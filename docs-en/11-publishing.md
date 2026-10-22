# 11 — Publishing the repository without secrets

## 1. Before creating the repository

This repo is prepared for publication, but always check the local state.

The commit must not contain:

- `app/config.js` with a real URL or token;
- `app/apps.js` generated from a specific TV;
- `app/icons/` with app icons;
- `app/channels/*.png` with channel logos;
- `.key`, `.pem`, `.p12` files;
- `dist/`, `*.ipk`, `*.wgt`;
- logs, screenshots or `.env` files.

`.gitignore` excludes them, but verify it.

---

## 2. Automated check

```powershell
powershell -ExecutionPolicy Bypass -File tools\check-secrets.ps1
```

The script looks for:

- IPv4 addresses;
- JWT-looking tokens;
- private keys;
- literal tokens;
- `.key` files;
- forbidden files already tracked.

If it returns an error, do not publish until it is clean.

---

## 3. Manual review

```powershell
git status --short
git ls-files
```

Check that these do not appear:

```text
app/config.js
app/apps.js
app/icons/...
app/channels/*.png
dist/...
*.ipk
*.wgt
*.key
```

Also review the history if you have committed before:

```powershell
git log --all --stat
```

If a secret is already in a commit, deleting it from the last commit is not
enough: rewrite the history or, better, revoke the token/key.

---

## 4. Create the repository

```powershell
cd "D:\Codigos Java\TvModUI"
git init -b main
git add .
git status
git commit -m "TvModUI: LG webOS launcher + Samsung Tizen scaffold"
```

Add the remote without writing it into the docs:

```powershell
git remote add origin REPO_URL
git push -u origin main
```

Do not upload `LgModUI`, `webos-vibehack`, `slopbro` or the whole
`D:\Codigos Java` folder. This repo already contains the sanitized code and
documentation.

---

## 5. What to publish

### LG

- `app/` with `config.example.js` and `apps.example.js`.
- Sanitized `tools/`.
- `docs/` and `docs-en/`.
- Wallpapers with `CREDITS.md`.
- No channel logos and no app icons.

### Samsung

- `samsung-tizen/` marked as an **untested scaffold**.
- No certificates, no `.wgt`, no keys.
- Change the example `appId` values only locally.

---

## 6. Recommended GitHub README text

- “Reference implementation for LG webOS 5.”
- “Samsung Tizen scaffold, not hardware-tested.”
- “Not a universal installer.”
- “Rooting may void the warranty.”
- “No third-party logos, icons or content are included.”
- “MIT; see LICENSE and NOTICE.”

---

## 7. After publishing

- Enable GitHub secret scanning if available.
- Review issues and PRs for tokens or IPs.
- Ask users to sanitize logs.
- If a HA token leaks, revoke it immediately.
- Tag tested versions with model, webOS/Tizen and firmware.
