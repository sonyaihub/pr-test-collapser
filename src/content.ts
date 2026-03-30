export {};

// ---------------------------------------------------------------------------
// Test file patterns
// ---------------------------------------------------------------------------
const TEST_PATTERNS: RegExp[] = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /\.tests\.[jt]sx?$/,
  /\.specs\.[jt]sx?$/,
  /__tests__\//,
  /__mocks__\//,
  /\btests?\//i,
  /_test\.go$/,
  /test_[^/]+\.py$/,
  /[^/]+_test\.py$/,
  /tests\.py$/,
  /conftest\.py$/,
  /_spec\.rb$/,
  /_test\.rb$/,
  /spec\//,
  /Test\.java$/,
  /Test\.kt$/,
  /Tests\.java$/,
  /Tests\.kt$/,
  /src\/test\//,
  /Tests?\.cs$/,
  /\.Tests\//,
  /tests\.rs$/,
  /tests\//,
  /Test\.php$/,
  /_test\.exs$/,
  /Tests\.swift$/,
  /Tests\//,
  /__snapshots__\//,
  /\.snap$/,
  /fixtures?\//i,
];

function isTestFile(filePath: string): boolean {
  return TEST_PATTERNS.some((p) => p.test(filePath));
}

// ---------------------------------------------------------------------------
// UI adapter interface
// ---------------------------------------------------------------------------
interface UIAdapter {
  name: string;
  getFileDiffs(): NodeListOf<Element> | Element[];
  getFilePath(fileEl: Element): string;
  collapseFile(fileEl: Element): boolean;
  expandFile(fileEl: Element): void;
  addTestBadge(fileEl: Element): void;
  getObserverTarget(): Element;
  hasNewFiles(mutations: MutationRecord[]): boolean;
}

// ---------------------------------------------------------------------------
// Detect which GitHub UI we're on
// ---------------------------------------------------------------------------
function isNewChangesUI(): boolean {
  return (
    location.pathname.includes("/changes") ||
    !!document.querySelector('[class*="PullRequestDiffsList-module"]')
  );
}

// ---------------------------------------------------------------------------
// Classic /files UI
// ---------------------------------------------------------------------------
const classicAdapter: UIAdapter = {
  name: "classic",

  getFileDiffs() {
    return document.querySelectorAll(
      ".file[data-tagsearch-path], .file[id^='diff-']"
    );
  },

  getFilePath(fileEl) {
    return (
      fileEl.getAttribute("data-tagsearch-path") ??
      fileEl
        .querySelector(".file-header a[title], .file-info a[title]")
        ?.getAttribute("title") ??
      fileEl
        .querySelector(".file-header [data-clipboard-text]")
        ?.getAttribute("data-clipboard-text") ??
      fileEl.querySelector(".file-header")?.textContent?.trim().split("\n")[0].trim() ??
      ""
    );
  },

  collapseFile(fileEl) {
    const details = fileEl.querySelector(
      "details.js-details-container"
    ) as HTMLDetailsElement | null;
    if (details?.open) {
      details.open = false;
      return true;
    }

    const toggleBtn = fileEl.querySelector(
      'button[aria-label="Toggle diff contents"], button.js-details-target'
    ) as HTMLButtonElement | null;
    if (toggleBtn?.getAttribute("aria-expanded") === "true") {
      toggleBtn.click();
      return true;
    }

    const chevron = fileEl
      .querySelector(
        ".file-header .js-toggle-file-notes, .file-header .octicon-chevron-down"
      )
      ?.closest("button") as HTMLButtonElement | null;
    if (chevron) {
      chevron.click();
      return true;
    }

    const diffBody =
      (fileEl.querySelector(".js-file-content") as HTMLElement) ??
      (fileEl.querySelector(".blob-wrapper") as HTMLElement) ??
      (fileEl.querySelector("[data-diff-anchor]") as HTMLElement);
    if (diffBody && diffBody.style.display !== "none") {
      diffBody.style.display = "none";
      fileEl.setAttribute("data-test-collapser-hidden", "true");
      return true;
    }

    return false;
  },

  expandFile(fileEl) {
    const details = fileEl.querySelector(
      "details.js-details-container"
    ) as HTMLDetailsElement | null;
    if (details && !details.open) {
      details.open = true;
      return;
    }

    const toggleBtn = fileEl.querySelector(
      'button[aria-label="Toggle diff contents"], button.js-details-target'
    ) as HTMLButtonElement | null;
    if (toggleBtn?.getAttribute("aria-expanded") === "false") {
      toggleBtn.click();
      return;
    }

    if (fileEl.getAttribute("data-test-collapser-hidden") === "true") {
      const diffBody =
        (fileEl.querySelector(".js-file-content") as HTMLElement) ??
        (fileEl.querySelector(".blob-wrapper") as HTMLElement) ??
        (fileEl.querySelector("[data-diff-anchor]") as HTMLElement);
      if (diffBody) {
        diffBody.style.display = "";
        fileEl.removeAttribute("data-test-collapser-hidden");
      }
    }
  },

  addTestBadge(fileEl) {
    if (fileEl.querySelector(".test-collapser-badge")) return;
    const target =
      fileEl.querySelector(".file-info") ??
      fileEl.querySelector(".Truncate") ??
      fileEl.querySelector(".file-header");
    target?.appendChild(createBadge());
  },

  getObserverTarget() {
    return (
      document.querySelector("#files") ??
      document.querySelector(".js-diff-progressive-container") ??
      document.querySelector("[data-target='diff-layout.mainContainer']") ??
      document.body
    );
  },

  hasNewFiles(mutations) {
    const sel = ".file[data-tagsearch-path], .file[id^='diff-']";
    return mutations.some((m) =>
      Array.from(m.addedNodes).some(
        (n) =>
          n.nodeType === 1 &&
          ((n as Element).matches?.(sel) ||
            (n as Element).querySelector?.(sel))
      )
    );
  },
};

// ---------------------------------------------------------------------------
// New /changes UI
// ---------------------------------------------------------------------------
function isCollapsedNew(fileEl: Element): boolean {
  const header = fileEl.querySelector('[class*="diff-file-header"]');
  if (header?.className.includes("collapsed")) return true;
  if (fileEl.querySelector(".octicon-chevron-right")) return true;
  return false;
}

function getToggleButtonNew(fileEl: Element): HTMLButtonElement | null {
  const header = fileEl.querySelector('[class*="diff-file-header"]');
  return header?.querySelector("button") as HTMLButtonElement | null;
}

const newAdapter: UIAdapter = {
  name: "new-changes",

  getFileDiffs() {
    const entries = document.querySelectorAll(
      '[class*="PullRequestDiffsList-module__diffEntry"]'
    );
    if (entries.length > 0) return entries;
    return document.querySelectorAll('[class*="Diff-module__diff__"]');
  },

  getFilePath(fileEl) {
    const nameEl = fileEl.querySelector('[class*="file-name"]');
    if (nameEl) {
      return (
        nameEl.textContent
          ?.replace(/[\u200E\u200F\u202A-\u202E]/g, "")
          .trim() ?? ""
      );
    }
    return (
      fileEl.querySelector("[data-clipboard-text]")?.getAttribute("data-clipboard-text") ?? ""
    );
  },

  collapseFile(fileEl) {
    if (isCollapsedNew(fileEl)) {
      return true;
    }
    const btn = getToggleButtonNew(fileEl);
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  },

  expandFile(fileEl) {
    if (!isCollapsedNew(fileEl)) {
      return;
    }
    const btn = getToggleButtonNew(fileEl);
    btn?.click();
  },

  addTestBadge(fileEl) {
    if (fileEl.querySelector(".test-collapser-badge")) return;
    const nameEl = fileEl.querySelector('[class*="file-name"]');
    nameEl?.parentElement?.appendChild(createBadge());
  },

  getObserverTarget() {
    return (
      document.querySelector('[class*="PullRequestDiffsList"]') ??
      document.querySelector('[class*="DiffComparisonViewer"]') ??
      document.body
    );
  },

  hasNewFiles(mutations) {
    const sel = '[class*="diffEntry"], [class*="Diff-module__diff__"]';
    return mutations.some((m) =>
      Array.from(m.addedNodes).some(
        (n) =>
          n.nodeType === 1 &&
          ((n as Element).matches?.(sel) ||
            (n as Element).querySelector?.(sel))
      )
    );
  },
};

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------
function createBadge(): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className = "test-collapser-badge";
  badge.textContent = "TEST";
  badge.style.cssText = `
    display:inline-flex;align-items:center;padding:1px 6px;margin-left:8px;
    font-size:11px;font-weight:600;line-height:18px;border-radius:12px;
    background:#ddf4ff;color:#0969da;vertical-align:middle;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  `;
  return badge;
}

function getAdapter(): UIAdapter {
  return isNewChangesUI() ? newAdapter : classicAdapter;
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------
type StatusResult = {
  testFileCount: number;
  collapsedCount: number;
  totalFileCount: number;
};

let collapsedCount = 0;
let testFileCount = 0;

function processFiles(collapse: boolean): StatusResult {
  const adapter = getAdapter();
  const files = adapter.getFileDiffs();
  collapsedCount = 0;
  testFileCount = 0;

  files.forEach((fileEl) => {
    const path = adapter.getFilePath(fileEl);
    if (!path || !isTestFile(path)) return;

    testFileCount++;
    adapter.addTestBadge(fileEl);

    if (collapse) {
      if (adapter.collapseFile(fileEl)) collapsedCount++;
    } else {
      adapter.expandFile(fileEl);
    }
  });

  try {
    chrome.storage.local.set({ testFileCount, collapsedCount, totalFileCount: files.length });
  } catch {
    // context invalidated
  }

  return { testFileCount, collapsedCount, totalFileCount: files.length };
}

// ---------------------------------------------------------------------------
// Message listener
// ---------------------------------------------------------------------------
type Message =
  | { action: "getStatus" }
  | { action: "collapseTests" }
  | { action: "expandTests" };

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    if (message.action === "getStatus") {
      const adapter = getAdapter();
      const files = adapter.getFileDiffs();
      let count = 0;
      files.forEach((fileEl) => {
        if (isTestFile(adapter.getFilePath(fileEl))) count++;
      });
      sendResponse({ testFileCount: count, collapsedCount, totalFileCount: files.length });
    } else if (message.action === "collapseTests") {
      sendResponse(processFiles(true));
    } else if (message.action === "expandTests") {
      sendResponse(processFiles(false));
    }
    return true;
  }
);

// ---------------------------------------------------------------------------
// Auto-run
// ---------------------------------------------------------------------------
chrome.storage.local.get({ enabled: true }, (settings) => {
  if (!settings.enabled) return;

  const run = () => processFiles(true);
  let debounceTimer: ReturnType<typeof setTimeout>;

  run();
  setTimeout(run, 1500);
  setTimeout(run, 4000);

  const adapter = getAdapter();
  const observer = new MutationObserver((mutations) => {
    if (!adapter.hasNewFiles(mutations)) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(run, 300);
  });

  observer.observe(adapter.getObserverTarget(), { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 30000);
});
