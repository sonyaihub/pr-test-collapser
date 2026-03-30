document.addEventListener("DOMContentLoaded", () => {
  const prView = document.getElementById("pr-view")!;
  const notPrView = document.getElementById("not-pr-view")!;
  const testCountEl = document.getElementById("test-count")!;
  const totalCountEl = document.getElementById("total-count")!;
  const enabledToggle = document.getElementById(
    "enabled"
  ) as HTMLInputElement;
  const collapseBtn = document.getElementById("collapse-btn")!;
  const expandBtn = document.getElementById("expand-btn")!;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const isPrFiles = tab?.url?.match(
      /github\.com\/.*\/pull\/\d+\/(files|changes)/
    );

    if (!isPrFiles) {
      notPrView.style.display = "block";
      prView.style.display = "none";
      return;
    }

    prView.style.display = "block";
    notPrView.style.display = "none";

    chrome.tabs.sendMessage(
      tab.id!,
      { action: "getStatus" },
      (response) => {
        if (chrome.runtime.lastError || !response) {
          testCountEl.textContent = "?";
          totalCountEl.textContent = "?";
          return;
        }
        testCountEl.textContent = String(response.testFileCount ?? 0);
        totalCountEl.textContent = String(response.totalFileCount ?? 0);
      }
    );

    chrome.storage.local.get({ enabled: true }, (settings) => {
      enabledToggle.checked = settings.enabled;
    });

    enabledToggle.addEventListener("change", () => {
      const enabled = enabledToggle.checked;
      chrome.storage.local.set({ enabled });

      const action = enabled ? "collapseTests" : "expandTests";
      chrome.tabs.sendMessage(tab.id!, { action }, (response) => {
        if (response) {
          testCountEl.textContent = String(response.testFileCount ?? 0);
        }
      });
    });

    collapseBtn.addEventListener("click", () => {
      chrome.tabs.sendMessage(
        tab.id!,
        { action: "collapseTests" },
        (response) => {
          if (response) {
            testCountEl.textContent = String(response.testFileCount ?? 0);
            totalCountEl.textContent = String(response.totalFileCount ?? 0);
          }
        }
      );
    });

    expandBtn.addEventListener("click", () => {
      chrome.tabs.sendMessage(
        tab.id!,
        { action: "expandTests" },
        (response) => {
          if (response) {
            testCountEl.textContent = String(response.testFileCount ?? 0);
          }
        }
      );
    });
  });
});
