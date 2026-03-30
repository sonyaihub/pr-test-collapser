// Common test file patterns across languages and frameworks
const TEST_PATTERNS: RegExp[] = [
  // JavaScript / TypeScript
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /\.tests\.[jt]sx?$/,
  /\.specs\.[jt]sx?$/,
  /__tests__\//,
  /__mocks__\//,
  /\btests?\//i,

  // Go
  /_test\.go$/,

  // Python
  /test_[^/]+\.py$/,
  /[^/]+_test\.py$/,
  /tests\.py$/,
  /conftest\.py$/,

  // Ruby
  /_spec\.rb$/,
  /_test\.rb$/,
  /spec\//,

  // Java / Kotlin
  /Test\.java$/,
  /Test\.kt$/,
  /Tests\.java$/,
  /Tests\.kt$/,
  /src\/test\//,

  // C# / .NET
  /Tests?\.cs$/,
  /\.Tests\//,

  // Rust
  /tests\.rs$/,
  /tests\//,

  // PHP
  /Test\.php$/,

  // Elixir
  /_test\.exs$/,

  // Swift
  /Tests\.swift$/,
  /Tests\//,

  // Snapshot / fixture files
  /__snapshots__\//,
  /\.snap$/,
  /fixtures?\//i,
];

function isTestFile(filePath: string): boolean {
  return TEST_PATTERNS.some((pattern) => pattern.test(filePath));
}

// ---------------------------------------------------------------------------
// UI adapter interface
// ---------------------------------------------------------------------------
interface UIAdapter {
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
function getFileDiffsClassic(): NodeListOf<Element> {
  return document.querySelectorAll(
    ".file[data-tagsearch-path], .file[id^='diff-']"
  );
}

function getFilePathClassic(fileEl: Element): string {
  const path = fileEl.getAttribute("data-tagsearch-path");
  if (path) return path;

  const link = fileEl.querySelector(
    ".file-header a[title], .file-info a[title]"
  );
  if (link) return link.getAttribute("title") ?? "";

  const clipBtn = fileEl.querySelector(".file-header [data-clipboard-text]");
  if (clipBtn) return clipBtn.getAttribute("data-clipboard-text") ?? "";

  const header = fileEl.querySelector(".file-header");
  if (header) return header.textContent?.trim().split("\n")[0].trim() ?? "";

  return "";
}

function collapseFileClassic(fileEl: Element): boolean {
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
}

function expandFileClassic(fileEl: Element): void {
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
}

function addTestBadgeClassic(fileEl: Element): void {
  if (fileEl.querySelector(".test-collapser-badge")) return;

  const header = fileEl.querySelector(".file-header");
  if (!header) return;

  const badge = createBadge();
  const fileInfo =
    header.querySelector(".file-info") ??
    header.querySelector(".Truncate") ??
    header;
  fileInfo.appendChild(badge);
}

function getObserverTargetClassic(): Element {
  return (
    document.querySelector("#files") ??
    document.querySelector(".js-diff-progressive-container") ??
    document.querySelector("[data-target='diff-layout.mainContainer']") ??
    document.body
  );
}

function hasNewFilesClassic(mutations: MutationRecord[]): boolean {
  return mutations.some((m) =>
    Array.from(m.addedNodes).some(
      (n) =>
        n.nodeType === 1 &&
        ((n as Element).matches?.(
          ".file[data-tagsearch-path], .file[id^='diff-']"
        ) ||
          (n as Element).querySelector?.(
            ".file[data-tagsearch-path], .file[id^='diff-']"
          ))
    )
  );
}

// ---------------------------------------------------------------------------
// New /changes UI
// ---------------------------------------------------------------------------
function getFileDiffsNew(): NodeListOf<Element> {
  return document.querySelectorAll(
    '[class*="PullRequestDiffsList-module__diffEntry"], [class*="Diff-module__diff__"]'
  );
}

function getFilePathNew(fileEl: Element): string {
  const nameEl = fileEl.querySelector('[class*="file-name"]');
  if (nameEl) {
    return (
      nameEl.textContent
        ?.replace(/[\u200E\u200F\u202A-\u202E]/g, "")
        .trim() ?? ""
    );
  }

  const clipBtn = fileEl.querySelector("[data-clipboard-text]");
  if (clipBtn) return clipBtn.getAttribute("data-clipboard-text") ?? "";

  return "";
}

function isCollapsedNew(fileEl: Element): boolean {
  const header = fileEl.querySelector('[class*="diff-file-header"]');
  if (header?.className.includes("collapsed")) return true;

  const chevron = fileEl.querySelector(".octicon-chevron-right");
  if (chevron) {
    const btn = chevron.closest("button");
    const tooltip = btn?.nextElementSibling;
    if (tooltip?.textContent?.trim() === "Expand file") return true;
  }

  return false;
}

function getCollapseButtonNew(fileEl: Element): HTMLButtonElement | null {
  const chevron = fileEl.querySelector(".octicon-chevron-down");
  if (!chevron) return null;

  const btn = chevron.closest("button") as HTMLButtonElement | null;
  if (!btn) return null;

  const tooltip = btn.nextElementSibling;
  if (
    tooltip?.textContent?.trim() === "Collapse file" ||
    tooltip?.textContent?.trim() === "Expand file"
  ) {
    return btn;
  }

  const header = btn.closest('[class*="diff-file-header"]');
  if (header?.querySelector("button") === btn) return btn;

  return null;
}

function getExpandButtonNew(fileEl: Element): HTMLButtonElement | null {
  const chevron = fileEl.querySelector(".octicon-chevron-right");
  if (!chevron) return null;

  const btn = chevron.closest("button") as HTMLButtonElement | null;
  if (!btn) return null;

  const tooltip = btn.nextElementSibling;
  if (tooltip?.textContent?.trim() === "Expand file") return btn;

  const header = btn.closest('[class*="diff-file-header"]');
  if (header?.querySelector("button") === btn) return btn;

  return null;
}

function collapseFileNew(fileEl: Element): boolean {
  if (isCollapsedNew(fileEl)) return true;
  const btn = getCollapseButtonNew(fileEl);
  if (btn) {
    btn.click();
    return true;
  }
  return false;
}

function expandFileNew(fileEl: Element): void {
  if (!isCollapsedNew(fileEl)) return;
  getExpandButtonNew(fileEl)?.click();
}

function addTestBadgeNew(fileEl: Element): void {
  if (fileEl.querySelector(".test-collapser-badge")) return;

  const fileNameEl = fileEl.querySelector('[class*="file-name"]');
  if (!fileNameEl?.parentElement) return;

  fileNameEl.parentElement.appendChild(createBadge());
}

function getObserverTargetNew(): Element {
  return (
    document.querySelector('[class*="PullRequestDiffsList"]') ??
    document.querySelector('[class*="DiffComparisonViewer"]') ??
    document.body
  );
}

function hasNewFilesNew(mutations: MutationRecord[]): boolean {
  return mutations.some((m) =>
    Array.from(m.addedNodes).some(
      (n) =>
        n.nodeType === 1 &&
        ((n as Element).matches?.(
          '[class*="diffEntry"], [class*="Diff-module__diff__"]'
        ) ||
          (n as Element).querySelector?.(
            '[class*="diffEntry"], [class*="Diff-module__diff__"]'
          ))
    )
  );
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function createBadge(): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className = "test-collapser-badge";
  badge.textContent = "TEST";
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    margin-left: 8px;
    font-size: 11px;
    font-weight: 600;
    line-height: 18px;
    border-radius: 12px;
    background-color: #ddf4ff;
    color: #0969da;
    vertical-align: middle;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  `;
  return badge;
}

function getAdapter(): UIAdapter {
  if (isNewChangesUI()) {
    return {
      getFileDiffs: getFileDiffsNew,
      getFilePath: getFilePathNew,
      collapseFile: collapseFileNew,
      expandFile: expandFileNew,
      addTestBadge: addTestBadgeNew,
      getObserverTarget: getObserverTargetNew,
      hasNewFiles: hasNewFilesNew,
    };
  }
  return {
    getFileDiffs: getFileDiffsClassic,
    getFilePath: getFilePathClassic,
    collapseFile: collapseFileClassic,
    expandFile: expandFileClassic,
    addTestBadge: addTestBadgeClassic,
    getObserverTarget: getObserverTargetClassic,
    hasNewFiles: hasNewFilesClassic,
  };
}

// ---------------------------------------------------------------------------
// Core processing
// ---------------------------------------------------------------------------
type StatusResult = {
  testFileCount: number;
  collapsedCount: number;
  totalFileCount: number;
};

let collapsedCount = 0;
let testFileCount = 0;
let processing = false;

function processFiles(collapse = true): StatusResult {
  if (processing)
    return { testFileCount, collapsedCount, totalFileCount: 0 };
  processing = true;

  try {
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
        if (fileEl.getAttribute("data-test-collapser-processed") === "true") {
          collapsedCount++;
          return;
        }
        if (adapter.collapseFile(fileEl)) {
          fileEl.setAttribute("data-test-collapser-processed", "true");
          collapsedCount++;
        }
      } else {
        adapter.expandFile(fileEl);
        fileEl.removeAttribute("data-test-collapser-processed");
      }
    });

    chrome.storage.local.set({
      testFileCount,
      collapsedCount,
      totalFileCount: files.length,
    });

    return { testFileCount, collapsedCount, totalFileCount: files.length };
  } finally {
    processing = false;
  }
}

// ---------------------------------------------------------------------------
// Message listener (popup communication)
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
      let currentTestCount = 0;
      files.forEach((fileEl) => {
        const path = adapter.getFilePath(fileEl);
        if (path && isTestFile(path)) currentTestCount++;
      });
      sendResponse({
        testFileCount: currentTestCount,
        collapsedCount,
        totalFileCount: files.length,
      });
    } else if (message.action === "collapseTests") {
      sendResponse(processFiles(true));
    } else if (message.action === "expandTests") {
      processFiles(false);
      collapsedCount = 0;
      sendResponse({ testFileCount, collapsedCount });
    }
    return true;
  }
);

// ---------------------------------------------------------------------------
// Auto-run on page load
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

  observer.observe(adapter.getObserverTarget(), {
    childList: true,
    subtree: true,
  });

  setTimeout(() => observer.disconnect(), 30000);
});
