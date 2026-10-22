# 05 — Fondo fotográfico y tren de Cercanías

## 1. Fondo de Manarola

El fondo por defecto son **fotos reales** de Manarola (Cinque Terre), no la
escena SVG original. Se recortaron a **1920×1080** y se guardan en:

```text
app/wallpapers/
  mediterranean-dawn.jpg
  mediterranean-day.jpg
  mediterranean-sunset.jpg
  mediterranean-night.jpg
  CREDITS.md
```

Horario (`CONFIG.wallpaperSchedule`):

| Desde | Hasta | Foto |
|---:|---:|---|
| 05:00 | 08:00 | `mediterranean-dawn.jpg` |
| 08:00 | 17:00 | `mediterranean-day.jpg` |
| 17:00 | 20:00 | `mediterranean-sunset.jpg` |
| 20:00 | 05:00 | `mediterranean-night.jpg` |

`from` está incluido y `to` excluido. Si `to` es menor que `from`, la franja
cruza medianoche (por ejemplo, 20 → 5).

Configuración:

```js
wallpaper: 'auto',
wallpaperSchedule: [
  { from: 5,  to: 8,  image: 'wallpapers/mediterranean-dawn.jpg' },
  { from: 8,  to: 17, image: 'wallpapers/mediterranean-day.jpg' },
  { from: 17, to: 20, image: 'wallpapers/mediterranean-sunset.jpg' },
  { from: 20, to: 5,  image: 'wallpapers/mediterranean-night.jpg' }
],
wallpaperCrossfadeMs: 1600
```

También se puede usar:

- una ruta fija de imagen;
- `'coast'` para la escena SVG de reserva;
- `null` para fondo negro.

---

## 2. Capas y fundido

Hay dos capas (`#wallpaperA` y `#wallpaperB`). Al cambiar de foto:

1. se carga la nueva imagen en la capa inactiva;
2. se pone su opacidad a 1;
3. la capa anterior baja a 0;
4. el fundido dura `wallpaperCrossfadeMs` (1600 ms).

CSS:

```css
#wallpaper {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  z-index: -1;
  overflow: hidden;
  background: #000;
  pointer-events: none;
}

.wallpaperLayer {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 1600ms ease;
}
```

No se aplica `filter: blur()` al fondo. En webOS 5, un blur a pantalla completa
obliga a rasterizar la imagen cada vez que se abre un panel y provoca tirones.

---

## 3. Sombra y legibilidad

Sobre la foto se pinta una capa oscura para que el texto blanco se lea:

```css
body.photo-wallpaper::before {
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, .55) 0%,
    rgba(0, 0, 0, .22) 46%,
    rgba(0, 0, 0, .76) 100%
  );
}

#hero,
#leftBlock {
  text-shadow: 0 2px 18px rgba(0, 0, 0, .55);
}
```

El reloj y el título de la app enfocada también llevan sombra suave.

---

## 4. Actualización

`applyWallpaper()` se ejecuta:

- al arrancar;
- cada **60 s**;
- al volver del segundo plano.

Así el fondo cambia solo al cruzar una franja horaria, sin animaciones continuas.

---

## 5. Easter egg: tren de Cercanías Madrid

### Disparo

Cinco pulsaciones de **Atrás** en menos de **3000 ms**:

```js
var BACK_SEQUENCE_MS = 3000;
var backPresses = 0, backStarted = 0;

function noteBackPress() {
  var now = Date.now();
  if (!backPresses || now - backStarted > BACK_SEQUENCE_MS) {
    backPresses = 0;
    backStarted = now;
  }
  backPresses++;
  if (backPresses < 5) return false;
  resetBackSequence();
  playTrain();
  return true;
}
```

Si el usuario está en un panel (`inputs`, `ha`, `antenna`) o moviendo una
tarjeta, ese Atrás cierra el panel y **no cuenta** para la secuencia.

### Animación

El tren es un SVG de **3 coches** con branding “Cercanías Madrid”. Cruza la
primera fila visible de apps de izquierda a derecha durante unos **5,2 s**.

Se usa un `setInterval` de 16 ms en lugar de una animación CSS porque es más
fiable en webOS 5:

```js
trainEl.classList.add('running');
trainEl.style.opacity = '1';
trainEl.style.transform = 'translateX(-1500px)';

var started = Date.now();
trainTimer = setInterval(function () {
  var t = Math.min(1, (Date.now() - started) / 5200);
  trainEl.style.transform = 'translateX(' + (-1500 + 3600 * t) + 'px)';
  if (t < 1) return;
  clearInterval(trainTimer);
  trainTimer = null;
  trainEl.classList.remove('running');
  trainEl.style.opacity = '0';
}, 16);
```

La posición vertical se calcula sobre la primera fila visible, para que siga
funcionando si la rejilla está desplazada.

### CSS

```css
#train {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 4;
  width: 1500px;
  height: 150px;
  opacity: 0;
  transform: translateX(-1500px);
  pointer-events: none;
  will-change: transform, opacity;
}

#train.running { opacity: 1; }
```

El `filter: drop-shadow()` del SVG se usa solo durante el easter egg; no afecta
al rendimiento normal del launcher.

---

## 6. Créditos

- Fotos: Manarola, Cinque Terre, vía Unsplash; recortadas a 1920×1080.
- `mediterranean-dawn.jpg` es una variante de color de la foto de día.
- Términos y fuentes exactas: `app/wallpapers/CREDITS.md`.
- “Cercanías Madrid” es una marca de Renfe; el tren es una ilustración
  estilizada para uso personal.
