# TvModUI

A TV launcher with a tvOS-like look, built for **LG webOS** and with a
**separate Samsung Tizen scaffold**. It includes direct Home, an app grid, a
dock, a channel panel, a time-based wallpaper, an easter egg and a Home
Assistant panel.

> **This is not a universal installer.** The LG implementation was tested on an
> LG 55UN71006LB with webOS 5 and firmware 04.64.00. The Samsung Tizen folder is
> a UI scaffold, not a complete port or a universal root method.
>
> The repository is sanitized: it contains no private IPs, tokens or keys.
> Each user must create a local `app/config.js`.

**Documentation:** [Español](README.md) · [English](docs-en/README.md)

---

## Status by platform

| Platform | Status | What is included |
|---|---|---|
| LG webOS 5 | Hardware-tested | Full launcher, direct Home, Antenna TV, HA |
| LG webOS 4/6/7 | Untested | Reusable base; review APIs and permissions |
| Samsung Tizen | Scaffold, untested | UI, keyboard, app demo; no root or Home |
| Other brands | Not supported | Reference documentation only |

“Any LG or Samsung” does not mean it works without changes: app APIs, app IDs,
tuners, Home and installation differ. See
[`docs-en/12-lg-samsung-compatibility.md`](docs-en/12-lg-samsung-compatibility.md).

---

## LG features

- Direct Home with `com.gathin.tvhome` and LG Home fallback.
- 16:9 card grid, dock and Casa/Inputs/Network/Settings pills.
- **Antenna TV** panel with channels 1–8, optional logos and number keys.
- Manarola wallpaper with dawn/day/sunset/night slots and crossfade.
- Cercanías train after five Back presses.
- **Casa** panel for Home Assistant over REST.
- webOS 5/Chromium 68 optimization: no live blur, opaque panels, flat focus.

---

## Layout

```text
TvModUI/
├── app/                        LG webOS reference implementation
│   ├── config.example.js       configuration template
│   ├── apps.example.js         minimal startup catalog
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── appinfo.json
│   ├── fonts/
│   ├── wallpapers/
│   └── channels/               README; local/optional PNGs
├── tools/                      build, install, sync, setup, check-secrets
├── docs/                       Spanish documentation
├── docs-en/                    English documentation
├── snippets/                   reference snippets and scripts
└── samsung-tizen/              Tizen scaffold
    ├── app/
    ├── config.xml
    └── tools/
```

`app/config.js` and `app/apps.js` are **not published**: they are created from
the examples with `tools/setup.ps1`. `app/icons/` is generated from the TV.

---

## Quick start — LG webOS

Requirements:

- LG TV with webOS, rooted, with Homebrew Channel/SSH.
- PC with PowerShell and `ares-package`.
- `TV_HOST` set in the session; do not write it into the repo.

```powershell
$env:TV_HOST = 'TV_IP'

powershell -ExecutionPolicy Bypass -File tools\setup.ps1
# Edit app\config.js: dock, wallpaper, Home Assistant.

powershell -ExecutionPolicy Bypass -File tools\sync-apps.ps1 -TvHost $env:TV_HOST
powershell -ExecutionPolicy Bypass -File tools\build.ps1
powershell -ExecutionPolicy Bypass -File tools\install.ps1 -TvHost $env:TV_HOST -Launch
```

To make Inicio the Home app, see
[`docs-en/02-install-and-direct-home.md`](docs-en/02-install-and-direct-home.md).
The SlopBro root procedure is in
[`docs-en/10-slopbro-root.md`](docs-en/10-slopbro-root.md).

---

## Quick start — Samsung Tizen

Open `samsung-tizen/` in Tizen Studio, change the `appId` values in
`samsung-tizen/app/app.js`, configure a certificate and package it as a web app.

```text
samsung-tizen/README.md
samsung-tizen/tools/build.md
```

The scaffold does not root the TV, does not replace the Samsung Home and has not
been hardware-tested. There is no universal Samsung root; do not try generic
steps.

---

## Configuration and secrets

- `app/config.example.js` → copy to `app/config.js`.
- `app/apps.example.js` → copy to `app/apps.js`.
- `app/config.js` may contain the Home Assistant URL and token: **do not commit
  it**.
- `app/apps.js`, `app/icons/`, `*.ipk`, `*.wgt`, `*.key` and `dist/` are in
  `.gitignore`.

Before publishing:

```powershell
powershell -ExecutionPolicy Bypass -File tools\check-secrets.ps1
```

If the HA token leaks, revoke it and create another. Do not expose the TV or
Home Assistant to the Internet.

---

## Documentation

| Document | Content |
|---|---|
| [`docs-en/01-root-and-access.md`](docs-en/01-root-and-access.md) | Root, SSH, failsafe |
| [`docs-en/02-install-and-direct-home.md`](docs-en/02-install-and-direct-home.md) | IPK, direct Home, rollback |
| [`docs-en/03-home-ui.md`](docs-en/03-home-ui.md) | UI, grid, focus, keys |
| [`docs-en/04-antenna-tv.md`](docs-en/04-antenna-tv.md) | Channels, logos, tuning |
| [`docs-en/05-wallpaper-and-train.md`](docs-en/05-wallpaper-and-train.md) | Wallpaper and easter egg |
| [`docs-en/06-home-assistant.md`](docs-en/06-home-assistant.md) | Casa panel and REST |
| [`docs-en/07-webos5-performance.md`](docs-en/07-webos5-performance.md) | webOS 5 performance |
| [`docs-en/08-testing-and-recovery.md`](docs-en/08-testing-and-recovery.md) | Testing and recovery |
| [`docs-en/09-changelog.md`](docs-en/09-changelog.md) | Chronology |
| [`docs-en/10-slopbro-root.md`](docs-en/10-slopbro-root.md) | Real root process with SlopBro |
| [`docs-en/11-publishing.md`](docs-en/11-publishing.md) | Publish without secrets |
| [`docs-en/12-lg-samsung-compatibility.md`](docs-en/12-lg-samsung-compatibility.md) | LG/Samsung matrix |

Spanish docs: [`docs/`](docs/).

---

## License and credits

Code under the MIT license, derived from **webos-vibehack** and
**tv-vibehack**. See [`LICENSE`](LICENSE) and [`NOTICE.md`](NOTICE.md).

No affiliation with LG, Samsung, Tizen, Homebrew, Unsplash or the app owners.
Channel logos and app icons are not included in this repository.

Rooting a TV may void the warranty and brick the device. Use it at your own
risk.
