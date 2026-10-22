# 07 — Rendimiento en webOS 5

## 1. Por qué importa

webOS 5 usa un motor Chromium antiguo y memoria limitada. Un launcher que se ve
bien en un navegador de escritorio puede dar tirones en la TV si usa efectos CSS
modernos o demasiadas actualizaciones del DOM.

La UI se ajustó primero para la TV, no para el escritorio.

## 2. Reglas usadas

### Sin blur en vivo

No uses:

- `backdrop-filter`;
- `filter: blur()` en capas a pantalla completa;
- paneles translúcidos con fondo desenfocado;
- sombras animadas que fuercen repintado.

Usa:

- paneles opacos;
- degradados precalculados;
- bordes estáticos;
- un anillo de foco plano con `box-shadow: inset`;
- `transform` y `opacity` para animar.

### Evitar layout caro o no soportado

En webOS 5, prefiere:

- anchos/altos explícitos;
- `position: absolute` en zonas fijas;
- `margin` en vez de `gap` de flex si hay dudas;
- `top/right/bottom/left` en vez de `inset`;
- layouts grid/flex simples.

### Paneles prerenderizados

El panel de Antena TV se construye una vez y se reutiliza. Las tarjetas de canal
no se recrean en cada movimiento de foco. El foco solo cambia clases.

### Limitar trabajo del DOM

- El reloj se actualiza una vez por minuto, no cada frame.
- El fondo cambia solo al cambiar de franja.
- El tren corre solo al activarse.
- Los estados de HA se refrescan a demanda, no con un poll permanente.
- El catálogo de apps es estático hasta que `sync-apps.ps1` lo regenera.

### Caché

- La lista de canales se cachea en `localStorage`.
- Las imágenes de fondo son locales y se precargan.
- Los iconos de apps son archivos locales generados por `sync-apps.ps1`.

### Reanudación

`handlesRelaunch: false` hace que Home traiga la app existente al frente en vez
de crear una instancia nueva. Así se evita una recarga completa cada vez que se
pulsa Home.

## 3. Guías de CSS

Bien:

```css
.card {
  background: #171b21;
  border: 1px solid rgba(255,255,255,.12);
}

.card.focused {
  box-shadow: inset 0 0 0 2px #fff;
  transform: scale(1.04);
}
```

Evita:

```css
/* No usar en webOS 5 */
.panel {
  backdrop-filter: blur(24px);
  filter: blur(8px);
}
```

Evita animar:

- `box-shadow` con mucho blur;
- `width`, `height`, `top`, `left`;
- `background-position` en imágenes grandes;
- `filter` en un elemento a pantalla completa.

## 4. Animación

- Usa `transform: translate/scale` y `opacity`.
- Transiciones cortas (120–220 ms para foco, unos 1600 ms para el crossfade).
- Usa `requestAnimationFrame` para el movimiento que sigue al mando.
- No lances una animación nueva en cada repetición de tecla sin limitarla.

## 5. Memoria

- Mantén los fondos en 1920×1080 o similar; no incluyas fotos 4K.
- No incluyas fuentes ni sets de iconos sin usar.
- No guardes imágenes base64 grandes en JS.
- Mantén corta la lista de entidades de HA.
- Elimina nodos de prueba/debug antes de empaquetar.

## 6. Verificación

En la TV:

1. Pulsa Home varias veces y comprueba que Inicio aparece sin flash.
2. Recorre toda la rejilla con las flechas.
3. Abre/cierra Antena TV, Casa, Entradas, Red y Ajustes.
4. Activa el tren y espera a que termine.
5. Cambia la hora de la TV o edita el horario para probar el fondo.
6. Reinicia y repite.

Comprobación útil:

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.applicationManager/getForegroundAppInfo '{}'"
```

Si la UI da tirones, quita efectos antes de añadir otros. En webOS 5, un panel
opaco simple suele ser más rápido y verse mejor que uno desenfocado.

## 7. Qué no hacer

- No añadas React/Vue ni un runtime grande para esta UI.
- No uses una fuente web remota.
- No cargues imágenes de red al arrancar.
- No tengas un intervalo permanente que repinte la rejilla.
- No uses `backdrop-filter` “solo por el efecto cristal”.
- No asumas que Chrome de escritorio se comporta igual que el WebView de la TV.
