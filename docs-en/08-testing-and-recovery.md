# 08 — Testing and recovery

## 1. Test checklist

Do these tests after every install:

- [ ] The TV boots normally.
- [ ] Home opens Inicio.
- [ ] The clock and date are correct.
- [ ] The grid scrolls with the arrows.
- [ ] The dock opens apps.
- [ ] Antena TV lists channels 1–8.
- [ ] Keys 1–8 open the corresponding channel.
- [ ] The Casa panel reads Home Assistant.
- [ ] The train appears after five Back presses.
- [ ] Back closes each panel.
- [ ] The wallpaper changes when the time slot changes.
- [ ] Reboot and press Home again.
- [ ] The LG Home still works as a fallback.

## 2. Verify the foreground app

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.applicationManager/getForegroundAppInfo '{}'"
```

Expected after pressing Home:

```json
{
  "foregroundAppInfo": {
    "appId": "com.gathin.tvhome"
  }
}
```

## 3. Verify the installed app

```bash
ssh root@TV_HOST \
  "ls -la /media/developer/apps/usr/palm/applications/com.gathin.tvhome"
```

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.applicationManager/listLaunchPoints '{}'" \
  | grep -o 'com.gathin.tvhome'
```

## 4. If Inicio does not open

1. Check that the IPK exists in `dist/`.
2. Reinstall:

```powershell
powershell -ExecutionPolicy Bypass -File tools\install.ps1 -TvHost $env:TV_HOST -Launch
```

3. Check the install log for `state":"installed"`.
4. Check `app/appinfo.json`; the `id` must be `com.gathin.tvhome`.
5. Check the app directory on the TV.
6. If the Home setting points to an app that is not installed, set the LG Home
   first.

## 5. If Home returns to the LG Home

Set Inicio again:

```bash
luna-send -n 1 -f luna://com.webos.settingsservice/setSystemSettings \
  '{"category":"general","settings":{"defaultApps":{"home":"com.gathin.tvhome"}}}'
```

If that does not stick after a reboot, check:

- that the app is installed;
- that `handlesRelaunch` is `false`;
- that no legacy watcher is fighting the setting;
- that the firmware has not reset `defaultApps`.

## 6. Return to the LG Home

```bash
luna-send -n 1 -f luna://com.webos.settingsservice/setSystemSettings \
  '{"category":"general","settings":{"defaultApps":{"home":"com.webos.app.fullhome"}}}'
```

Then disable the legacy watcher if it was enabled:

```bash
sh /media/developer/apps/usr/palm/applications/com.gathin.tvhome/tools/legacy-disable-watcher.sh
```

Or run the sanitized script from the repo over SSH.

## 7. If the app crashes

- Reinstall the IPK.
- Check that `app/apps.js` exists; run `tools/setup.ps1` or `sync-apps.ps1`.
- Check that `app/config.js` exists and is valid JavaScript.
- Open the Web Inspector if available, or check the app logs.
- Remove recent CSS/JS changes and rebuild.

A missing `apps.js` or `config.js` is a common cause of a blank screen.

## 8. Boot problems and failsafe

If the TV bootloops after root:

- Do not cut power repeatedly.
- Wait at least 60 seconds.
- Check the Homebrew failsafe flag:

```text
/var/luna/preferences/webosbrew_failsafe
```

- Use the Homebrew recovery procedure.
- Do not factory reset a rooted TV unless you accept losing root and data.

The exact recovery depends on the model and Homebrew version. This repo does not
provide a universal unbrick method.

## 9. Rollback

1. Set the LG Home as default.
2. Disable the watcher.
3. Uninstall Inicio if you no longer want it.
4. Keep a copy of the working IPK and `config.js` outside the repo.

## 10. What to include in a bug report

- TV model.
- webOS version and firmware.
- Launcher version.
- Steps to reproduce.
- Whether Home direct is enabled.
- Sanitized logs: no IPs, tokens, URLs or serial numbers.

More security notes: [`../SECURITY.md`](../SECURITY.md).
