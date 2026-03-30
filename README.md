# PR Test File Collapser

A Chrome extension that automatically collapses test files in GitHub pull request reviews, so reviewers can focus on production code first.

## Features

- Automatically collapses test file diffs when you open a PR's "Files changed" or "Changes" tab
- Supports both the classic `/files` and new `/changes` GitHub UI
- Adds a "TEST" badge to test file headers for easy identification
- Toggle auto-collapse on/off from the popup
- Manually expand/collapse all test files with one click

## Supported Test File Patterns

| Language | Patterns |
|---|---|
| JS / TS | `.test.ts`, `.spec.tsx`, `__tests__/`, `__mocks__/` |
| Go | `_test.go` |
| Python | `test_*.py`, `*_test.py`, `conftest.py` |
| Ruby | `_spec.rb`, `_test.rb`, `spec/` |
| Java / Kotlin | `*Test.java`, `*Test.kt`, `src/test/` |
| C# / .NET | `*Test.cs`, `.Tests/` |
| Rust | `tests.rs`, `tests/` |
| PHP | `*Test.php` |
| Elixir | `_test.exs` |
| Swift | `*Tests.swift`, `Tests/` |
| Other | `__snapshots__/`, `.snap`, `fixtures/` |

## Installation

1. Clone this repo
2. Install dependencies and build:
   ```sh
   bun install
   bun run build
   ```
3. Open `chrome://extensions` in Chrome
4. Enable **Developer mode**
5. Click **Load unpacked** and select the `dist/` folder

## Development

```sh
bun install        # install dependencies
bun run build      # build to dist/
bun run check      # type check with tsc
```

## Tech Stack

- TypeScript
- Tailwind CSS v4
- Bun (bundler + package manager)
- Chrome Extension Manifest V3

## Feedback

Found a bug or have a suggestion? [Open an issue](https://github.com/sonyatalona/pr-test-collapser/issues).

## License

[MIT](LICENSE)
