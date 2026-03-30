# Privacy Policy

**PR Test File Collapser** — Chrome Extension

*Last updated: March 30, 2026*

## Overview

PR Test File Collapser is a browser extension that automatically collapses test file diffs on GitHub pull request review pages. It operates entirely within your browser and does not collect, store, or transmit any user data.

## Data Collection

This extension does **not** collect any data. Specifically:

- No personal information is collected
- No browsing history is tracked
- No analytics or telemetry is sent
- No cookies are set
- No data is shared with third parties
- No data leaves your browser

## Permissions

The extension requests the following browser permissions:

- **storage**: Saves your auto-collapse preference (a single on/off toggle) locally in your browser. This data never leaves your device.
- **activeTab**: Used to detect if the current tab is a GitHub pull request page and to communicate with the content script. No tab data is read, stored, or transmitted.
- **Host access (github.com)**: The content script runs only on GitHub pull request file review pages to read file names and collapse test file diffs. No page content is collected or sent anywhere.

## Local Storage

The only data stored is:

| Key | Type | Purpose |
|-----|------|---------|
| `enabled` | Boolean | Whether auto-collapse is turned on or off |

This is stored locally via `chrome.storage.local` and never transmitted.

## Third-Party Services

This extension does not communicate with any external servers or third-party services.

## Changes

If this privacy policy changes, the update will be posted in this file and in the extension's repository at https://github.com/sonyatalona/pr-test-collapser.

## Contact

For questions or concerns, open an issue at https://github.com/sonyatalona/pr-test-collapser/issues.
