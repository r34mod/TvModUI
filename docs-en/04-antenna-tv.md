# 04 — Antenna TV (channels 1–8)

## 1. What it does

The Antenna TV panel opens channels 1–8 directly from Inicio, with one row of
logos, without going through the Live TV app. It uses the real tuner channel
list and shows a logo or a numeric badge.

## 2. Final design

- A single row of 8 small cards.
- Each card shows the channel logo and name.
- Focus moves with left/right.
- OK tunes the channel.
- It can be opened with the remote, the mouse or keys 1–8.

## 3. Logos

Logos are **not included** in the repository to avoid redistributing third-party
trademarks. The `app/channels/` folder only contains a README with the names the
app expects. If you add your own PNGs, they are loaded as local `<img>` assets,
without network access. If a logo is missing or the channel does not match, a
neutral badge with the number is shown.

Credits and trademarks: `app/channels/README.md`.

## 4. Getting the channel list

The app requests the real list from the internal TV service:

```bash
luna-send -n 1 -f luna://com.webos.service.apiadapter/tv/getChannelList \
  '{"subscribe":false}'
```

It reads `channelId`, `channelNumber`, `channelName` and `channelLogo`. The app
normalizes and caches them.

## 5. Cache

The list is stored in `localStorage` so the panel opens instantly. If the tuner
changes or is retuned, force a reload from Settings or clear the `localStorage`
key.

## 6. Tuning

```bash
luna-send -n 1 -f luna://com.webos.service.apiadapter/tv/openChannel \
  '{"channelId":"CHANNEL_ID"}'
```

The app uses the real `channelId`, not the number. The number is only used by
the UI and keys 1–8.

## 7. Keyboard

- Keys 1–8: open the corresponding channel.
- Arrows: move focus in the panel.
- OK: tune.
- Back: close the panel.

## 8. Open and reuse

If the TV app is already open, it is reused; otherwise it is launched. The panel
does not create a new instance of the TV app.

## 9. Common failures

- The channel does not exist or its `channelId` changed.
- The tuner is not initialized.
- The logo is missing.
- No antenna is connected.
- The `apiadapter` service does not respond after suspend.

Fix: reopen Inicio, retune, or regenerate the cache.
