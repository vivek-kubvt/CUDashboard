# Publishing a release

Use this when you ship a new version to everyone who cloned or forked the repo.

## 1. Prepare `main`

- Merge fixes to `main` and push to GitHub.
- Update `CHANGELOG.md`: move items from **Unreleased** into a new `## [x.y.z] - YYYY-MM-DD` section.
- Bump `version` in `package.json` if it changed (optional but helps track semver).

## 2. Create the tag and release

**On GitHub (recommended):**

1. [Releases](https://github.com/vivek-kubvt/CUDashboard/releases) → **Draft a new release**.
2. **Choose a tag:** e.g. `v1.1.0` → create on **`main`**.
3. **Title:** `v1.1.0`
4. **Description:** copy the new section from `CHANGELOG.md` and add an **Upgrading** block:

   ```markdown
   ## Upgrading

   git remote add upstream https://github.com/vivek-kubvt/CUDashboard.git   # once
   git fetch upstream
   git merge upstream/main
   git push origin main   # if you use a fork

   Re-check GitHub Actions secrets if `.github/workflows/` changed.
   ```

5. Publish (check **Set as the latest release**).

**CLI (optional):**

```bash
git tag v1.1.0
git push origin v1.1.0
gh release create v1.1.0 --title "v1.1.0" --notes-file CHANGELOG_SNIPPET.md
```

## 3. Versioning

| Bump   | When |
| ------ | ---- |
| Patch  | Bugfix, docs, small workflow tweak |
| Minor  | New feature, new env var, non-breaking behavior |
| Major  | Breaking change (removed secrets, new Node major, API change) |

## 4. Tell users

- They can **Watch → Custom → Releases** on the repo for GitHub notifications.
- Point them to [Releases](https://github.com/vivek-kubvt/CUDashboard/releases) and [Staying up to date](../README.md#staying-up-to-date) in the README.
