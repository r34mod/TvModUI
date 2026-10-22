# 01 — Root, Homebrew Channel and access

## 1. Actual TV state

The TV was rooted in the first session with **SlopBro**, from a PC on the same
local network while the working session was remote over the internet. That root
was then used to install the launcher. The firmware was not updated and no
factory reset was performed.

The real step-by-step guide is in [`10-slopbro-root.md`](10-slopbro-root.md).

Starting point:

- LG **55UN71006LB**, webOS 5.
- Firmware **04.64.00**.
- **Homebrew Channel** installed.
- **Root SSH** enabled.
- `Quick Start+` disabled.
- SSH access from the PC.

Root is not a feature of this launcher: it is the access layer that makes the
launcher installable and lets it talk to internal webOS services. The method
used is documented in [`10-slopbro-root.md`](10-slopbro-root.md). If root is
already working, **do not repeat it**: the brick risk is not worth it.

---

## 2. Why root is needed

| Need | Service / path | Why root |
|---|---|---|
| Install the IPK without Developer Mode | `luna://com.webos.appInstallService/dev/install` | The development installer requires privileges |
| Read apps and icons | `luna://com.webos.applicationManager/listLaunchPoints` | Runs over SSH as root |
| Open channels | `com.webos.service.apiadapter/tv/openChannel` | Internal TV service |
| Read the channel list | `com.webos.service.apiadapter/tv/getChannelList` | Internal TV service |
| Run `curl` for HA | `org.webosbrew.hbchannel.service/exec` | Avoids CORS and uses the TV network |
| Change the Home app | `com.webos.settingsservice/setSystemSettings` | System setting |
| Rescue watcher | `/var/lib/webosbrew/init.d/` | Boot-time root hook |
| Remove preinstalled apps | `applicationManager` / `dev/install` | Requires privileges |

Without root, the original project relies on Developer Mode, `ares install` and
an external watcher. Those dependencies were removed here.

---

## 3. Basic checks

With `TV_HOST` as an environment variable or placeholder:

```bash
ssh root@TV_HOST 'id; uname -a'
```

It should answer as `uid=0(root)`.

Check that Luna responds:

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.applicationManager/getForegroundAppInfo '{}'"
```

Check the Homebrew Channel service:

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://org.webosbrew.hbchannel.service/exec \
   '{\"command\":\"id\"}'"
```

Check the current Home setting:

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.settingsservice/getSystemSettings \
   '{\"category\":\"general\",\"key\":\"defaultApps\"}'"
```

---

## 4. Homebrew failsafe

The TV uses this flag:

```text
/var/luna/preferences/webosbrew_failsafe
```

While it exists, Homebrew is in protection mode. During the first **30–60
seconds** of boot, do not cut power: the system may still be clearing the flag.
If power is cut during that window, the TV may stay in failsafe.

Good practices:

- Do not cut power during boot.
- Do not factory reset a rooted TV.
- Do not update firmware without checking Homebrew compatibility.
- Keep the LG Home as a fallback.
- Keep `disable-watcher.sh` and the LG Home available.

---

## 5. Important paths

```text
/media/developer/apps/usr/palm/applications/com.gathin.tvhome   installed app
/var/lib/webosbrew/                                              Homebrew
/var/lib/webosbrew/init.d/                                       boot hooks
/var/luna/preferences/webosbrew_failsafe                         failsafe flag
/tmp/                                                            temporary files
```

The app is installed in the development apps area. The launcher does not modify
the system partition; it only uses services and Homebrew hooks.

---

## 6. What was NOT done

- No firmware update.
- No factory reset.
- No Developer Mode reinstall.
- Stremio was not installed by IPK (it stays on the LG Content Store path).
- No unofficial Stremio addons or DRM/pirated content were used.
- No writable Home Assistant `media_player` entity was created.

---

## 7. If root has to be redone

The procedure used here is documented in [`10-slopbro-root.md`](10-slopbro-root.md):
**SlopBro** for webOS 5, with the PC on the same LAN and the TV not exposed to
the internet.

Before repeating it:

1. Confirm the exact model and firmware.
2. Check compatibility with the current SlopBro/Homebrew versions.
3. Confirm the failsafe flag is clear.
4. Keep the LG Home reachable.
5. Do not update firmware during the process.

If root already works, **do not repeat it**: the brick risk is not worth it and
this mod does not need it.
