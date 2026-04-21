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
    return hasAnyFileMutation(mutations);
  },
};

// ---------------------------------------------------------------------------
// New /changes UI
// ---------------------------------------------------------------------------
function isCollapsedNew(fileEl: Element): boolean {
  const header = fileEl.querySelector('[class*="diff-file-header"]');
  if (header && /(^|[\s_-])collapsed([\s_-]|$)/.test(header.className)) return true;
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
    return hasAnyFileMutation(mutations);
  },
};

const ANY_FILE_SELECTOR =
  ".file[data-tagsearch-path], .file[id^='diff-'], " +
  '[class*="PullRequestDiffsList-module"], ' +
  '[class*="diffEntry"], [class*="Diff-module__diff__"]';

function hasAnyFileMutation(mutations: MutationRecord[]): boolean {
  return mutations.some((m) =>
    Array.from(m.addedNodes).some(
      (n) =>
        n.nodeType === 1 &&
        ((n as Element).matches?.(ANY_FILE_SELECTOR) ||
          (n as Element).querySelector?.(ANY_FILE_SELECTOR))
    )
  );
}

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

// Paths we've already acted on. Auto-runs skip these so a file the user
// manually expanded after an initial collapse won't be re-collapsed by the
// retry timers or mutation observer.
const handledPaths = new Set<string>();
let lastPrKey = "";

function getPrKey(): string {
  const match = location.pathname.match(/\/pull\/(\d+)/);
  return match ? `${location.hostname}${match[0]}` : "";
}

function resetIfPrChanged(): void {
  const key = getPrKey();
  if (key && key !== lastPrKey) {
    handledPaths.clear();
    lastPrKey = key;
  }
}

function processFiles(collapse: boolean, force = false): StatusResult {
  resetIfPrChanged();
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
      if (!force && handledPaths.has(path)) return;
      if (adapter.collapseFile(fileEl)) collapsedCount++;
      handledPaths.add(path);
    } else {
      adapter.expandFile(fileEl);
      handledPaths.add(path);
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
      sendResponse(processFiles(true, true));
    } else if (message.action === "expandTests") {
      sendResponse(processFiles(false, true));
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
  const retryTimers: ReturnType<typeof setTimeout>[] = [];

  const isFilesPath = () =>
    /\/pull\/\d+\/(files|changes)/.test(location.pathname);

  const kick = () => {
    retryTimers.forEach(clearTimeout);
    retryTimers.length = 0;
    if (!isFilesPath()) return;
    [0, 500, 1500, 4000, 8000, 15000].forEach((ms) => {
      retryTimers.push(setTimeout(run, ms));
    });
  };

  kick();

  const observer = new MutationObserver((mutations) => {
    if (!isFilesPath()) return;
    if (!getAdapter().hasNewFiles(mutations)) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(run, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  let lastHref = location.href;
  const onNavigate = () => {
    if (location.href === lastHref) return;
    lastHref = location.href;
    kick();
  };
  window.addEventListener("popstate", onNavigate);
  document.addEventListener("turbo:load", onNavigate);
  document.addEventListener("turbo:render", onNavigate);
  setInterval(onNavigate, 500);
});
