# Changelog

All notable changes to this project are documented here. Version tags match [GitHub Releases](https://github.com/vivek-kubvt/CUDashboard/releases).

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- (add items here before the next release)

## [1.1.0] - 2026-05-22

### Changed

- Daily report schedule uses **IST (GMT+05:30)** via `timezone: Asia/Kolkata` in GitHub Actions (7:00 PM, Mon–Fri).

### Added

- README: how to stay up to date and sync from upstream.
- This changelog and maintainer release notes (`.github/RELEASING.md`).

## [1.0.0] - 2026-05-22

### Added

- Cursor usage dashboard (billing, charts, live session data).
- Optional daily screenshot report to Google Chat (`npm run daily-report`, GitHub Actions workflow).
- Server-side Playwright capture for CI and local reports.

[Unreleased]: https://github.com/vivek-kubvt/CUDashboard/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/vivek-kubvt/CUDashboard/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/vivek-kubvt/CUDashboard/releases/tag/v1.0.0
