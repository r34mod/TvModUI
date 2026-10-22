# 07 — Rendimiento en webOS 5

## 1. Síntoma

El panel de Antena TV se abría, pero al pulsar flechas o cambiar de canal se
notaba un tirón fuerte. En las primeras versiones había picos de **cientos de
milisegundos** por pulsación.

La TV es una **LG 55UN71006LB** con webOS 5 y un webview basado en
**Chromium 68**. No es un navegador moderno: los filtros y las capas grandes se
pagan caros.

---

## 2. Causas

Se identificaron cuatro:

1. **Blur a pantalla completa** sobre el fondo:
   `filter: blur(18px)` en `#wallpaper`.
2. **Panel semitransparente** encima del fondo: obliga a mezclar y repintar la
   pared de atrás cada vez que cambia una tarjeta.
3. **Sombras grandes y transformaciones** en la tarjeta enfocada:
   `box-shadow` de 30–46 px y `scale()`.
4. **Filtros en los logos**: `drop-shadow()` en cada imagen.

Además, el panel se reconstruía en cada apertura con 8 tarjetas e imágenes.

---

## 3. Qué se cambió

### Fondo

Se eliminó por completo:

```css
/* eliminado */
body.antenna-open #wallpaper {
  filter: blur(18px) saturate(1.08) brightness(0.92);
  transform: scale(1.05);
}
```

El fondo queda **nítido**. El panel se separa con su propio fondo opaco y su
borde, no con blur.

### Panel

De semitransparente a **opaco**:

```css
#antennaPanel {
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0) 48%),
    linear-gradient(180deg, #191c22, #0b0d11);
  transition: opacity 100ms linear;
}

#antennaPanel.hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 100ms linear, visibility 0s linear 100ms;
}
```

Se quitó `backdrop-filter` y se eliminó la animación de escala/desplazamiento
del panel. Ahora solo hay un fade corto.

### Tarjetas

Se quitó:

- `transform: translateY(-5px) scale(1.04)`;
- `box-shadow` con blur;
- `transition` de fondo, borde, transform y sombra;
- `filter: drop-shadow()` de los logos;
- `transform: scale()` del logo;
- pseudo-elemento radial con blur.

El foco ahora es un anillo interior:

```css
.antChannel.focused {
  border-color: rgba(255, 255, 255, 0.92);
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.92),
    inset 0 -3px 0 var(--glow, rgba(255, 255, 255, 0.28));
}
```

Es un `box-shadow` **sin blur**, dibujado dentro de la tarjeta. No hay
recomposición de una sombra difuminada.

### Panel precreado

Al arrancar se crea el panel oculto:

```js
antennaChannels = baseAntennaChannels();
renderAntenna();
```

Al abrirlo:

```js
if (!antennaGrid.children.length) renderAntenna();
else focusAntenna(0);
```

El panel oculto usa `visibility: hidden`; así no se pinta hasta que se abre.

---

## 4. Quirks de webOS 5 / Chromium 68

| Problema | Detalle | Solución |
|---|---|---|
| `backdrop-filter` | No soportado/no fiable | No usarlo; fondo opaco |
| `filter: blur()` | Muy caro a pantalla completa | Evitarlo |
| `flex gap` | El valor se calcula pero no se aplica | Usar `margin` |
| `inset` | No fiable en CSS | Usar `top/right/bottom/left` |
| Sombras grandes | Repintan al cambiar el foco | Anillo interior sin blur |
| Capas semitransparentes | Mezclan con el fondo en cada frame | Panel opaco |
| Animaciones CSS complejas | Pueden rasterizar de más | Temporizador JS para el tren |
| `will-change` excesivo | Consume memoria | Usarlo solo en el tren |

---

## 5. Medición orientativa

Se midió con el depurador remoto de la TV, provocando cambios de foco y
esperando dos `requestAnimationFrame`.

Antes:

- picos de **~700 ms** al cambiar de tarjeta;
- panel con blur + transparencia + sombras;
- respuesta irregular.

Después:

- la mayoría de cambios de foco quedaron en **~10–20 ms**;
- mediana ~12 ms en la última batería;
- algún pico aislado del sistema, pero sin el tirón continuo anterior;
- apertura del panel en torno a **140 ms** con el fade.

Son medidas orientativas: la TV puede variar por temperatura, red, apps en
segundo plano o el propio servidor de depuración.

---

## 6. Reglas para futuros cambios

1. No poner `filter: blur()` sobre `#wallpaper`.
2. No usar `backdrop-filter` como base del diseño.
3. No usar capas grandes semitransparentes para paneles.
4. Evitar `box-shadow` con blur grande en elementos que cambian de foco.
5. Evitar `scale()`/`translate()` en cada tarjeta al navegar.
6. Precrear paneles ocultos y reutilizarlos.
7. Medir en la TV, no solo en el PC.
8. Si se quiere “cristal”, usar una **imagen ya desenfocada** como fondo opaco,
   no blur en vivo.

---

## 7. Si vuelve a ir lento

Revisar en este orden:

1. ¿Hay algún `filter` o `backdrop-filter` nuevo?
2. ¿El panel volvió a ser semitransparente?
3. ¿Se añadieron sombras/transformaciones a `.antChannel`?
4. ¿Se está re-renderizando el panel en cada apertura?
5. ¿Hay animaciones CSS de fondo o de opacidad a pantalla completa?
6. ¿La lista de canales se consulta cada vez que se abre el panel?
7. ¿El home tiene muchas apps o iconos grandes sin caché?

Herramientas:

- abrir el inspector remoto del webview;
- comprobar `getComputedStyle(...).filter` y `.backdropFilter`;
- medir con `requestAnimationFrame`;
- revisar `localStorage` (`tvhome.antenna.v1`);
- mirar logs de la TV por SSH.
