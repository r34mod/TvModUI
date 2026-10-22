# 05 — Fondo y tren

## 1. Fondo de Manarola

Inicio usa cuatro fotos de Manarola como identidad visual:

```text
app/wallpapers/
  mediterranean-dawn.jpg
  mediterranean-day.jpg
  mediterranean-sunset.jpg
  mediterranean-night.jpg
  CREDITS.md
```

Son recursos locales, no URLs remotas. Se precargan para que el cambio no
dependa de la red. Los créditos están en `app/wallpapers/CREDITS.md`.

## 2. Franjas horarias

Con `wallpaper: 'auto'`, la imagen cambia según la hora local de la TV:

| Desde | Hasta | Imagen |
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

La duración del crossfade es `wallpaperCrossfadeMs` (1600 ms por defecto). Solo
cambia la opacidad de dos capas; no hay blur en vivo.

También puedes usar:

- una ruta fija de imagen;
- `'coast'` para la escena SVG de reserva;
- `null` para negro.

## 3. SVGs de respaldo

Si falta una foto o no se puede decodificar, Inicio usa una escena SVG de costa
generada en el propio HTML/CSS. Tiene cuatro fases:

```js
coastSchedule: [
  { from: 5,  to: 8,  phase: 'dawn' },
  { from: 8,  to: 17, phase: 'day' },
  { from: 17, to: 20, phase: 'sunset' },
  { from: 20, to: 5,  phase: 'night' }
]
```

Esta escena no depende de imágenes externas.

## 4. Tren de Cercanías

El tren es un easter egg. Se activa pulsando **Atrás cinco veces consecutivas**
en Inicio. No cambia apps, ajustes ni el Home; es solo una escena visual.

Uso recomendado:

- empezar desde la rejilla principal;
- pulsar Atrás cinco veces seguidas;
- no abrir un panel entre pulsaciones;
- la escena termina sola o con Atrás.

La animación es CSS/JS local. No descarga recursos ni llama a servicios
externos.

## 5. Activación

Valores relevantes de `CONFIG`:

```js
wallpaper: 'auto',
wallpaperSchedule: [ /* ... */ ],
coastSchedule: [ /* ... */ ],
wallpaperCrossfadeMs: 1600
```

El disparador del tren forma parte de `app.js`; no es una app separada y no
necesita root.

## 6. Personalización

Para usar tus propias fotos:

1. Sustituye los cuatro archivos de `app/wallpapers/`.
2. Mantén los mismos nombres o actualiza `wallpaperSchedule`.
3. Actualiza `CREDITS.md` si redistribuyes las nuevas imágenes.
4. Recompila y reinstala.

Para desactivar el fondo fotográfico:

```js
wallpaper: 'coast'
```

o:

```js
wallpaper: null
```

## 7. Notas

- Las imágenes son decorativas; la app sigue funcionando si faltan.
- Mantén las fotos en 1920×1080 o un 16:9 similar.
- No uses imágenes enormes: webOS 5 tiene memoria limitada.
- El tren está oculto a propósito; no es una función principal de la UI.
