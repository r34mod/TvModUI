# 03 — Inicio UI

## 1. Goal

Inicio is a visual TV launcher: app grid, dock, channel panel, photographic
wallpaper, train and Home Assistant panel. The priority is that the remote works
without thinking and that the TV still behaves like a TV.

## 2. Structure of `app/index.html`

```text
body
  header
    clock, date, greeting
  main
    app grid
  dock
  Antena TV panel
  Casa panel (Home Assistant)
  Inputs panel
  Network panel
  Settings panel
  train scene
  fallback SVG scenes
```

The app is a single page: `index.html` + `style.css` + `app.js`. There is no
frontend build and no framework. It runs directly in the webOS WebView.

## 3. Measurements and style

- Design canvas: **1920 × 1080**.
- 16:9 cards, 300 × 169 px.
- Side margins: 112 px.
- 5 columns by default (`CONFIG.columns`).
- Dark background, opaque panels and a light accent.
- Local Outfit typeface (`app/fonts/outfit.ttf`).

The UI does not use live blur. Panels are opaque to avoid the cost of
`backdrop-filter` on webOS 5. See
[`07-webos5-performance.md`](07-webos5-performance.md).

## 4. Grid and dock

The grid is generated from `window.TV_APPS` (`app/apps.js`). The dock is
generated from `CONFIG.dockApps`. Apps in the dock are removed from the grid so
they are not duplicated.

Rules:

- Fixed apps are ordered by `dockApps`.
- Hidden apps are filtered with `hiddenApps`.
- Live TV is added at the end of Inputs.
- HDMI inputs come from `apps.js`.

## 5. Top pills

- **Casa**: opens Home Assistant.
- **Entradas**: HDMI and Live TV.
- **Red**: connection status.
- **Ajustes**: TV settings shortcuts.

The pills are normal HTML buttons. Focus moves with the arrows and OK.

## 6. Focus zones and keyboard

Keys:

- Arrows: move focus.
- OK/Enter: activate.
- Back (461): close panel or go back.
- Numbers 1–8: open a channel in Antena TV.

Focus is remembered per zone, so returning to the grid does not jump back to
the first tile.

## 7. Hidden apps

`hiddenApps` includes the launcher itself, HDMI inputs, sports settings and
Copilot. If an app does not exist on the TV, it simply does not appear.

## 8. Startup and relaunch

`handlesRelaunch: false` makes Home bring Inicio to the foreground. On startup:

- `CONFIG` is read;
- clock and wallpaper are painted;
- `TV_APPS` is loaded;
- focus is restored on the dock.

## 9. Quick customization

- `columns`: number of grid columns.
- `dockApps`: dock apps.
- `hiddenApps`: hidden apps.
- `wallpaper`: `'auto'`, a fixed path, `'coast'` or `null`.
- `clock24h`: 24-hour clock.
- `homeAssistant`: Casa panel.

The real catalog is regenerated with `tools/sync-apps.ps1`.
