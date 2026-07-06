# Git Workflow — First Commit Guide

This project follows the **Conventional Commits** specification (https://www.conventionalcommits.org),
the convention used at most large engineering orgs (Google, Angular, Netflix, etc.) because it enables
automated changelogs, semantic versioning, and consistent history.

## 1. Initialize the repository

```bash
cd med-calendar
git init
git branch -M main
```

## 2. Set up `.gitignore` (already included)

Confirm `node_modules/`, `dist/`, and `.astro/` are ignored before staging:

```bash
cat .gitignore
```

## 3. Stage everything

```bash
git add .
git status   # review what's about to be committed
```

Never commit `node_modules/` or lockfile artifacts from a different package manager
(e.g. don't mix `package-lock.json` with `pnpm-lock.yaml`).

## 4. Write the commit using Conventional Commits format

```
<type>(<optional scope>): <short summary, imperative mood, no trailing period>

<optional body: what and why, wrapped at ~72 chars>

<optional footer: BREAKING CHANGE, issue refs, sign-off>
```

**Common `type` values:**

| type       | when to use it                                      |
|------------|------------------------------------------------------|
| `feat`     | a new feature                                         |
| `fix`      | a bug fix                                              |
| `chore`    | tooling, config, scaffolding — no source behavior change |
| `docs`     | documentation only                                     |
| `style`    | formatting, no logic change                            |
| `refactor` | code change that neither fixes a bug nor adds a feature |
| `test`     | adding or correcting tests                             |

**Rules for the subject line:**
- Imperative mood: "add", not "added" or "adds"
- No period at the end
- ≤ 50 characters if possible
- Lowercase after the colon (unless a proper noun)

## 5. Recommended first commit for this project

Since this commit introduces the whole working application, `feat` is more accurate
than `chore` (which is reserved for pure tooling/config with no user-facing behavior):

```bash
git commit -m "feat: scaffold medication tracking calendar app" -m "
Initial implementation using Astro 7 + TypeScript (no UI framework) and
Tailwind CSS v4, with data persisted to localStorage.

- Monthly calendar view with per-day dose tracking
- Custom items with emoji + color tags (medication/supplement presets
  or fully custom categories)
- Item and day management modals
- Design tokens and component styles in src/styles/global.css
"
```

Using two `-m` flags creates a clean subject + body without needing an editor.
Alternatively, run `git commit` with no `-m` to open your editor and write the
full message (preferred for longer bodies).

## 6. Optional but common at larger companies

- **Sign-off (DCO):** `git commit -s ...` appends `Signed-off-by: Name <email>`
- **Verify commit locally before pushing:**
  ```bash
  git log -1 --stat
  ```
- **Enforce the convention going forward** with `commitlint` + a Git hook (via `husky`):
  ```bash
  pnpm add -D @commitlint/cli @commitlint/config-conventional husky
  echo "export default { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
  pnpm exec husky init
  echo 'pnpm exec commitlint --edit "$1"' > .husky/commit-msg
  ```

