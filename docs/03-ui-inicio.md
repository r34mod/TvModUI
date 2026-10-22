# 03 — Interfaz de Inicio

## 1. Objetivo

Sustituir el Home de LG por una interfaz tipo Apple TV/tvOS, en español, sin
publicidad ni apps promocionales, con:

- fondo fotográfico real;
- tarjetas 16:9;
- rejilla limpia;
- dock inferior;
- píldoras de Casa, Entradas, Wi-Fi y Ajustes;
- panel de Antena TV;
- panel de Home Assistant;
- tren de Cercanías como easter egg.

La app es una web app de 1920×1080 que ocupa toda la pantalla. No hay scroll de
página: el launcher mueve una “etapa” interna.

---

## 2. Estructura de `app/index.html`

```text
body
├── #wallpaper
│   ├── #wallpaperA / #wallpaperB      dos capas para crossfade
│   └── #coastScene                    escena SVG de reserva
├── #train                             SVG del tren
├── header
│   ├── #leftBlock                     saludo, reloj, fecha, tiempo
│   └── #pills                          Casa · Entradas · Wi-Fi · Ajustes
├── #antennaPanel                       panel Antena TV
├── #viewport
│   └── #stage
│       ├── #dockBand
│       ├── #tiles                      tarjetas de apps
│       └── #glass                      contorno de foco
├── #inputsPanel                        desplegable de entradas
├── #haPanel                            panel Home Assistant
└── #toast
```

Los scripts se cargan en este orden:

```html
<script src="config.js"></script>
<script src="apps.js"></script>
<script src="app.js"></script>
```

`apps.js` se genera con `tools/sync-apps.ps1`; `config.js` es la configuración
editable.

---

## 3. Medidas y estilo

- Lienzo: **1920×1080**.
- Tarjetas: **300×169 px** (16:9), radio **27 px**.
- Columnas: **5** (`CONFIG.columns`).
- Dock: 5 apps con tarjetas más pequeñas.
- Píldoras: altura **84 px**, radio **42 px**, fondo oscuro.
- Reloj: **104 px**, formato 24 h por defecto.
- Sin cristal: el foco es un **contorno blanco plano**, no un efecto de blur.
- Texto blanco con sombra suave para legibilidad sobre la foto.

CSS clave:

```css
.item {
  position: absolute;
  width: 300px;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 400ms ease, transform 400ms ease,
    left 320ms ease, top 320ms ease;
}

.card {
  position: relative;
  width: 300px;
  height: 169px;
  border-radius: 27px;
  overflow: hidden;
  background: #1c1c1e;
  transition: transform 180ms ease;
}

.item.focused .card {
  transform: scale(1.1);
  transition: transform 260ms cubic-bezier(0.34, 1.6, 0.5, 1);
}

#glass {
  position: absolute;
  border-radius: 40px;
  border: 3px solid rgba(255, 255, 255, 0.9);
  background: none;
}
```

El foco se dibuja con `#glass`: una sola capa que se mueve entre tarjetas, en
lugar de aplicar sombras o cristal a cada tarjeta.

---

## 4. Rejilla y dock

- `CONFIG.dockApps` define las apps fijas de la fila inferior.
- `CONFIG.hiddenApps` oculta apps que no deben aparecer (TV, HDMI, Copilot,
  alertas de deportes, la propia app Inicio).
- `CONFIG.columns` controla cuántas tarjetas caben por fila.
- El dock usa el mismo número de huecos que la rejilla.
- El orden se puede cambiar manteniendo pulsado OK sobre una tarjeta:
  flechas para mover, OK para colocar, Atrás para cancelar.

Configuración saneada: [`../snippets/config.example.js`](../snippets/config.example.js).

---

## 5. Píldoras superiores

| Píldora | Acción |
|---|---|
| **Casa** | Abre el panel de Home Assistant |
| **Entradas** | Desplegable con HDMI/AV/Componente y TV en directo |
| **Wi-Fi / Ethernet** | Abre Ajustes → Red |
| **Ajustes** | Abre Ajustes de webOS |

La etiqueta de red cambia según el estado (`Wi-Fi`, `Ethernet`, etc.). El icono
se genera con SVG inline para no depender de fuentes de iconos.

---

## 6. Zonas de foco y teclado

`app.js` mantiene una variable `zone`:

```js
var zone = 'grid'; // 'grid' | 'top' | 'inputs' | 'ha' | 'antenna'
```

| Zona | Flechas | OK | Atrás |
|---|---|---|---|
| `grid` | Mueve por tarjetas | Abre app / Antena TV | Secuencia del tren |
| `top` | Mueve por píldoras | Activa píldora | Nada |
| `inputs` | Mueve por entradas | Abre entrada | Cierra |
| `ha` | Mueve por dispositivos | Enciende/apaga | Cierra |
| `antenna` | Mueve por canales | Sintoniza | Cierra |

Códigos usados por el mando:

```js
KEY = {
  LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40,
  OK: 13, BACK: 461, ESC: 27
}
```

La app también acepta ratón: `mouseover` mueve el foco y `click` activa.

---

## 7. Apps eliminadas / ocultas

Se quitaron de la TV apps que no se usaban:

- Twitch.
- Apps promocionales de LG.

Se ocultan de la rejilla, sin desinstalar:

- `com.gathin.tvhome` (la propia app).
- Entradas HDMI.
- `com.webos.app.sportsteamsettings` (app de sistema no removible).
- `shortcutcopilot`.

La lista de apps se regenera con `sync-apps.ps1`; no se edita a mano salvo casos
concretos.

---

## 8. Arranque y reanudación

Al arrancar:

1. Se construyen las tarjetas.
2. Se precarga el panel de Antena TV oculto.
3. Se aplica el fondo según la hora.
4. Se actualiza el reloj y el tiempo.
5. Se enfoca la primera tarjeta.
6. Se calienta la lista de canales en segundo plano.

Al volver del segundo plano (`webOSRelaunch` o `visibilitychange`):

- se actualiza el reloj;
- se reaplica el fondo;
- se cierran paneles que hayan quedado abiertos;
- se recarga el tiempo;
- se enfoca la tarjeta actual.

---

## 9. Personalización rápida

- **Dock**: `CONFIG.dockApps`.
- **Apps ocultas**: `CONFIG.hiddenApps`.
- **Columnas**: `CONFIG.columns`.
- **Reloj 12/24 h**: `CONFIG.clock24h`.
- **Fondo**: `CONFIG.wallpaper`, `CONFIG.wallpaperSchedule`.
- **TV en directo**: `CONFIG.liveTvApp`.
- **Home Assistant**: `CONFIG.homeAssistant`.
- **Textos**: `index.html` y `app.js`.

Después de cualquier cambio:

```powershell
powershell -ExecutionPolicy Bypass -File tools\build.ps1
powershell -ExecutionPolicy Bypass -File tools\install.ps1 -TvHost $env:TV_HOST -Launch
```
