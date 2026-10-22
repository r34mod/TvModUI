# 09 — Changelog

This is the work chronology, not a semantic-version release history.

## October 2026 — initial base

- Started from the webOS port of **tv-vibehack**.
- Kept the app grid, dock and remote-first navigation.
- Added Spanish UI texts and the 1920×1080 layout.
- Set `handlesRelaunch: false` for Home behavior.

## Home direct

- First attempts used Developer Mode and an external watcher.
- The watcher detected the LG Home and launched Inicio on top; it caused a
  visible flash and needed a permanent process.
- Replaced it with `defaultApps.home = com.gathin.tvhome`.
- The LG Home remains the fallback.
- The legacy watcher scripts were kept only as a rescue option.

## Antena TV

- Added a panel with channels 1–8 in one row.
- Used the real tuner list from `apiadapter`.
- Added numeric badges and optional local logos.
- Cached the channel list in `localStorage`.
- Added remote, mouse and keys 1–8 access.
- Fixed channel opening when the Live TV app was already running.

## Wallpaper and train

- Added four Manarola photos with a time-based schedule.
- Added a crossfade between time slots.
- Added inline SVG coast scenes as fallback.
- Added the Cercanías train easter egg after five Back presses.

## Home Assistant

- Added the **Casa** pill and panel.
- Used the Homebrew Channel `exec` service to run `curl` on the TV.
- Added light, switch and binary sensor rows.
- Added `turn_on` / `turn_off` calls.
- Kept the token in `app/config.js`, outside the public repo.
- No writable `media_player` entity was created.

## Performance on webOS 5

- Removed live blur and `backdrop-filter`.
- Made panels opaque.
- Replaced diffused focus shadows with inset rings.
- Pre-rendered the Antena TV panel.
- Reduced DOM work and live timers.
- Kept animations on `transform` and `opacity`.
- Verified that Home brings Inicio to the foreground without a full reload.

## Root

- Rooted with **SlopBro** from a PC on the same LAN.
- Installed **Homebrew Channel 0.7.3**.
- Enabled root SSH.
- Kept Telnet disabled.
- Did not update firmware, factory reset or reinstall Developer Mode.
- Documented the real process in [`10-slopbro-root.md`](10-slopbro-root.md).

## Final build at that point

- IPK: **6,409,406 bytes**.
- Last foreground app after pressing Home: `com.gathin.tvhome`.
- Stremio was not installed by IPK; it was left to the LG Content Store path.

## Pending / optional

- Stremio installation confirmation on the TV.
- Optional removal of unused apps.
- Final Home Assistant “connected” check.
- Optional antenna/logo restoration.
- Hardware testing of the Samsung Tizen scaffold.

## Documentation

- Spanish docs: [`../docs/`](../docs/).
- English docs: [`README.md`](README.md).
- Sanitized source in `app/` and `tools/`.
- Public repo prepared with `.gitignore`, license, security notice and secret
  scanner.
