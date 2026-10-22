# 12 — LG and Samsung compatibility

## 1. Main rule

There is no universal launcher for “any LG or Samsung”. There are **adapters**
and one reference implementation. What changes:

- the app system and app IDs;
- app launching;
- the tuner and channels;
- the system Home;
- remote keys;
- installation;
- root and persistence.

This repo separates the LG implementation from the Samsung scaffold so the
assumptions are not mixed.

---

## 2. Matrix

| Platform | Status | Launcher | Direct Home | Antenna TV | Home Assistant | Root |
|---|---|---|---|---|---|---|
| LG webOS 5 | Tested | Yes | Yes | Yes | Yes | Homebrew/SlopBro |
| LG webOS 4 | Untested | Base | Review | Review | Yes | Depends |
| LG webOS 6/7 | Untested | Base | Review | Review | Yes | Depends |
| Samsung Tizen 5.5 | Scaffold | Base UI | No | No | No | No |
| Samsung Tizen 6/7 | Scaffold | Base UI | No | No | No | No |
| Other brands | Not supported | — | — | — | — | — |

“Tested” means one LG 55UN71006LB, webOS 5, firmware 04.64.00. It is not a
guarantee for other panels, regions or firmware.

---

## 3. LG webOS

### What works in the reference

- Web app `com.gathin.tvhome` installed by `dev/install`.
- Direct Home with `defaultApps.home`.
- Catalog generated over SSH with `listLaunchPoints`.
- App launching through Luna/Homebrew.
- Channels through `apiadapter/tv/getChannelList` and `openChannel`.
- Home Assistant through `curl` as root.
- Remote keys: arrows, OK, Back, numbers.

### What may change

- app and input IDs;
- ACG permissions;
- channel API;
- `handlesRelaunch` behavior;
- network services;
- Homebrew/SlopBro availability;
- WebView and CSS support.

### Requirements

- webOS with root/Homebrew for direct Home and the catalog.
- `ares-package` on the PC.
- Root SSH for `dev/install` and `sync-apps`.

Without root you can develop the UI, but not direct Home or the automatic
catalog.

---

## 4. Samsung Tizen

### What the scaffold includes

- Tizen web app (`config.xml` + `index.html`).
- 16:9 grid and clock.
- Arrow/Enter/Back navigation.
- Common Tizen key registration.
- Demo launch through `tizen.application.launchApp`.

### What is missing

- real installed-app catalog;
- tuner / Live TV;
- channel panel;
- Home Assistant;
- Home replacement;
- root.

### Why there is no universal root

Samsung root depends on model, SoC, firmware and Tizen version. There is no
single method equivalent to SlopBro for webOS. This repo does **not** include
Samsung exploits and does not promise one.

### Installation

Package it as a normal web app and install it with Tizen Studio/`sdb` on a TV in
developer mode. It does not replace the system Home.

---

## 5. Contract for adding a platform

If you want to port the UI to another TV, implement an adapter with:

```text
init()
getApps()                 -> [{ id, title, icon, iconColor }]
launchApp(id, params)
getForegroundApp()
openChannel(number)
getNetwork()
openSettings(section)
execute(command)          -> only if the platform allows it
setHome(appId)            -> only if the system allows it
storage.get/set(key)
```

The UI should not call Luna, Tizen or vendor APIs directly. Today the LG version
uses Luna inside `app/app.js`; the Tizen scaffold is independent. A future
refactor can move this to `app/platform.js`.

---

## 6. Test checklist on another TV

- [ ] The app starts and fills the screen.
- [ ] Clock and date are correct.
- [ ] Arrows move focus smoothly.
- [ ] OK opens an app.
- [ ] Back returns or exits.
- [ ] Dock and grid do not overlap.
- [ ] The wallpaper changes by time slot.
- [ ] The channel panel opens and tunes.
- [ ] Direct Home survives a reboot.
- [ ] Home Assistant responds.
- [ ] No logs contain tokens/IPs.

---

## 7. What NOT to promise

- That it works on every LG.
- That it works on every Samsung.
- That root is safe or reversible.
- That Home can be replaced on Tizen.
- That third-party logos/icons can be redistributed.
- That an AI can fill the gaps without hardware testing.
