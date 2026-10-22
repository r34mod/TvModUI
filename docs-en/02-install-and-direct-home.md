# 02 — IPK installation and direct Home

## 1. Pipeline

```text
app/  ──ares-package──►  *.ipk  ──scp/SSH──►  /tmp/vibehack.ipk
                                      │
                                      ▼
                 luna://com.webos.appInstallService/dev/install
                                      │
                                      ▼
                      /media/developer/apps/.../com.gathin.tvhome
                                      │
                                      ▼
                    defaultApps.home = com.gathin.tvhome
```

Developer Mode and `ares install` are not used.

---

## 2. Sync the app catalog

webOS does not let a web app list installed apps. `tools/sync-apps.ps1` reads
the list **over SSH as root** and generates:

- `app/apps.js`
- `app/icons/*.png`
- HDMI/TV input entries in `apps.js`

Run it only when an app is installed or removed on the TV:

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-apps.ps1 -TvHost $env:TV_HOST
```

The script uses `listLaunchPoints` and downloads the icons. The catalog is
static: if you change apps and do not sync again, the grid will not reflect it.

Sanitized version: [`../tools/sync-apps.ps1`](../tools/sync-apps.ps1).

---

## 3. Build

Before building, create the local configuration from the examples:

```powershell
powershell -ExecutionPolicy Bypass -File tools\setup.ps1
```

This creates `app/config.js` and `app/apps.js` only if they are missing. Edit
`app/config.js` with your dock, wallpaper and Home Assistant settings.

```powershell
powershell -ExecutionPolicy Bypass -File tools\build.ps1
```

It generates:

```text
dist\com.gathin.tvhome_1.0.0_all.ipk
```

`build.ps1` uses `ares-package`. If it is not in `PATH`, pass its location:

```powershell
powershell -ExecutionPolicy Bypass -File tools\build.ps1 `
  -AresPackage 'C:\path\to\ares-package.cmd'
```

Sanitized version: [`../tools/build.ps1`](../tools/build.ps1).

---

## 4. Install and launch

```powershell
powershell -ExecutionPolicy Bypass -File tools\install.ps1 `
  -TvHost $env:TV_HOST -Launch
```

What `install.ps1` does:

1. Copies the IPK to `/tmp/vibehack.ipk` with `scp`.
2. Writes a JSON payload with `{ id, ipkUrl, subscribe }`.
3. Runs as root:

```bash
luna-send -i -f luna://com.webos.appInstallService/dev/install \
  '{"id":"com.gathin.tvhome","ipkUrl":"/tmp/vibehack.ipk","subscribe":true}'
```

4. Waits until the log contains `"state":"installed"`.
5. If `-Launch` is passed, opens the app with `applicationManager/launch`.
6. Removes the temporary files.

Sanitized version: [`../tools/install.ps1`](../tools/install.ps1).

---

## 5. App manifest

`app/appinfo.json` contains the important Home fields:

```json
{
  "id": "com.gathin.tvhome",
  "version": "1.0.0",
  "type": "web",
  "main": "index.html",
  "title": "Inicio",
  "handlesRelaunch": false,
  "requiredACG": ["application.launcher", "network.query"],
  "requiredPermissions": [
    "network.operation",
    "network.query",
    "activities.operation",
    "services.blegacy"
  ]
}
```

`handlesRelaunch: false` makes webOS bring the app to the foreground when Home
is pressed, instead of creating a new instance or letting the LG Home take over.

Sanitized copy: [`../snippets/appinfo.json`](../snippets/appinfo.json).

---

## 6. Make Inicio the Home app

Once, on the TV:

```bash
ssh root@TV_HOST
luna-send -n 1 -f luna://com.webos.settingsservice/setSystemSettings \
  '{"category":"general","settings":{"defaultApps":{"home":"com.gathin.tvhome"}}}'
```

Verify:

```bash
luna-send -n 1 -f luna://com.webos.settingsservice/getSystemSettings \
  '{"category":"general","key":"defaultApps"}'
```

It should return:

```json
{
  "settings": {
    "defaultApps": {
      "home": "com.gathin.tvhome"
    }
  }
}
```

Press Home and check the foreground app:

```bash
luna-send -n 1 -f luna://com.webos.applicationManager/getForegroundAppInfo '{}'
```

It should return `com.gathin.tvhome`.

---

## 7. Return to the LG Home

```bash
luna-send -n 1 -f luna://com.webos.settingsservice/setSystemSettings \
  '{"category":"general","settings":{"defaultApps":{"home":"com.webos.app.fullhome"}}}'
```

Inicio can still be opened from its icon even when it is not the default Home.

---

## 8. Legacy watcher: rescue option

The original project used a watcher that detected the LG Home and launched
Inicio on top. It is **not used** for normal operation here: direct Home avoids
the flash and does not need a permanent process.

Two rescue scripts are kept:

- `legacy-enable-watcher.sh`: installs/starts the watcher in
  `/var/lib/webosbrew/init.d/`.
- `legacy-disable-watcher.sh`: stops it, removes it from boot and returns Home
  to Launch Home or the LG Home.

They should not run at the same time as direct Home unless you are debugging.

Sanitized versions:

- [`../tools/legacy-enable-watcher.sh`](../tools/legacy-enable-watcher.sh)
- [`../tools/legacy-disable-watcher.sh`](../tools/legacy-disable-watcher.sh)

---

## 9. Update the app after a change

Every change under `app/` requires a rebuild and reinstall:

```powershell
powershell -ExecutionPolicy Bypass -File tools\build.ps1
powershell -ExecutionPolicy Bypass -File tools\install.ps1 -TvHost $env:TV_HOST -Launch
```

If the app list or icons changed, run `sync-apps.ps1` first.

---

## 10. Installation checks

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.applicationManager/listLaunchPoints '{}'" \
  | grep -o 'com.gathin.tvhome'
```

```bash
ssh root@TV_HOST \
  "ls -la /media/developer/apps/usr/palm/applications/com.gathin.tvhome"
```

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.applicationManager/getForegroundAppInfo '{}'"
```

If the app does not start, check:

- that the IPK was generated and copied;
- that the install log says `installed`;
- that `appinfo.json` has the correct `id`;
- that the default Home does not point to an uninstalled app;
- that the app path exists.

More detail in [`08-testing-and-recovery.md`](08-testing-and-recovery.md).
