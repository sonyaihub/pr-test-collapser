export {};

document.addEventListener("DOMContentLoaded", () => {
  const prView = document.getElementById("pr-view")!;
  const notPrView = document.getElementById("not-pr-view")!;
  const testCountEl = document.getElementById("test-count")!;
  const totalCountEl = document.getElementById("total-count")!;
  const enabledToggle = document.getElementById("enabled") as HTMLInputElement;
  const collapseBtn = document.getElementById("collapse-btn")!;
  const expandBtn = document.getElementById("expand-btn")!;

  function updateCounts(response: { testFileCount?: number; totalFileCount?: number } | undefined) {
    if (!response) return;
    testCountEl.textContent = String(response.testFileCount ?? 0);
    if (response.totalFileCount != null) {
      totalCountEl.textContent = String(response.totalFileCount);
    }
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const isPrFiles = tab?.url?.match(
      /github\.com\/.*\/pull\/\d+\/(files|changes)/
    );

    if (!isPrFiles) {
      notPrView.classList.remove("hidden");
      prView.classList.add("hidden");
      return;
    }

    prView.classList.remove("hidden");
    notPrView.classList.add("hidden");

    chrome.tabs.sendMessage(tab.id!, { action: "getStatus" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        testCountEl.textContent = "?";
        totalCountEl.textContent = "?";
        return;
      }
      updateCounts(response);
    });

    chrome.storage.local.get({ enabled: true }, (settings) => {
      enabledToggle.checked = settings.enabled as boolean;
    });

    enabledToggle.addEventListener("change", () => {
      const enabled = enabledToggle.checked;
      chrome.storage.local.set({ enabled });
      const action = enabled ? "collapseTests" : "expandTests";
      chrome.tabs.sendMessage(tab.id!, { action }, updateCounts);
    });

    collapseBtn.addEventListener("click", () => {
      chrome.tabs.sendMessage(tab.id!, { action: "collapseTests" }, updateCounts);
    });

    expandBtn.addEventListener("click", () => {
      chrome.tabs.sendMessage(tab.id!, { action: "expandTests" }, updateCounts);
    });
  });
});
