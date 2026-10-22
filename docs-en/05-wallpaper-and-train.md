# 05 — Wallpaper and train

## 1. Manarola wallpaper

Inicio uses four photos of Manarola as its visual identity:

```text
app/wallpapers/
  mediterranean-dawn.jpg
  mediterranean-day.jpg
  mediterranean-sunset.jpg
  mediterranean-night.jpg
  CREDITS.md
```

They are local assets, not remote URLs. They are preloaded so the change does
not depend on the network. Credits and license notes are in
`app/wallpapers/CREDITS.md`.

## 2. Time slots

With `wallpaper: 'auto'`, the image changes by local TV time:

| From | To | Image |
|---|---|---|
| 05:00 | 08:00 | `mediterranean-dawn.jpg` |
| 08:00 | 17:00 | `mediterranean-day.jpg` |
| 17:00 | 20:00 | `mediterranean-sunset.jpg` |
| 20:00 | 05:00 | `mediterranean-night.jpg` |

```js
wallpaperSchedule: [
  { from: 5,  to: 8,  image: 'wallpapers/mediterranean-dawn.jpg' },
  { from: 8,  to: 17, image: 'wallpapers/mediterranean-day.jpg' },
  { from: 17, to: 20, image: 'wallpapers/mediterranean-sunset.jpg' },
  { from: 20, to: 5,  image: 'wallpapers/mediterranean-night.jpg' }
]
```

The crossfade duration is `wallpaperCrossfadeMs` (1600 ms by default). Only the
opacity of two layers changes; there is no live blur.

You can also use:

- a fixed image path;
- `'coast'` for the fallback SVG scene;
- `null` for black.

## 3. Fallback SVGs

If a photo is missing or cannot be decoded, Inicio falls back to an inline SVG
coast scene. It has four phases:

```js
coastSchedule: [
  { from: 5,  to: 8,  phase: 'dawn' },
  { from: 8,  to: 17, phase: 'day' },
  { from: 17, to: 20, phase: 'sunset' },
  { from: 20, to: 5,  phase: 'night' }
]
```

This scene is generated at build time in the HTML/CSS, so it does not depend on
external images.

## 4. Cercanías train

The train is an easter egg. It is triggered by pressing **Back five consecutive
times** in Inicio. It does not change apps, settings or the Home app; it is only
a visual scene.

Recommended use:

- start from the main grid;
- press Back five times in a row;
- do not open a panel between presses;
- the scene ends on its own or with Back.

The animation is local CSS/JS. It does not download assets or call external
services.

## 5. Activation

Relevant `CONFIG` values:

```js
wallpaper: 'auto',
wallpaperSchedule: [ /* ... */ ],
coastSchedule: [ /* ... */ ],
wallpaperCrossfadeMs: 1600
```

The train trigger is part of `app.js`; it is not a separate app and does not
need root.

## 6. Customization

To use your own photos:

1. Replace the four files in `app/wallpapers/`.
2. Keep the same names, or update `wallpaperSchedule`.
3. Update `CREDITS.md` if you redistribute the new images.
4. Rebuild and reinstall.

To disable the photographic wallpaper, set:

```js
wallpaper: 'coast'
```

or:

```js
wallpaper: null
```

## 7. Notes

- The images are decorative; the app still works if they are missing.
- Keep the photos at 1920×1080 or a similar 16:9 size.
- Do not use huge images: webOS 5 has limited memory.
- The train is deliberately hidden; it is not a documented main feature in the
  UI.
