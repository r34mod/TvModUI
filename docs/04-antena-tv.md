# 04 — Antena TV (canales 1–8)

## 1. Qué hace

La tarjeta **TV en directo** del dock no abre directamente la app de TV: abre
un panel flotante **Antena TV** con los canales 1–8 en una sola fila.

Cada tarjeta muestra:

- número de canal;
- logo local del canal;
- nombre.

Se puede elegir con:

- flechas izquierda/derecha + OK;
- ratón (`mouseover` para foco, `click` para sintonizar);
- teclas numéricas **1–8**;
- Atrás o Escape para cerrar.

Al sintonizar, se oculta el panel, se abre el canal y se trae **TV en directo**
al frente.

---

## 2. Diseño final

- Panel centrado, ancho **1680 px**.
- 8 tarjetas de **190×150 px** en una fila.
- Sin `backdrop-filter`.
- Sin blur en tiempo real.
- Fondo **opaco** oscuro para evitar repintados.
- Foco con anillo interior blanco, sin sombra difuminada ni escala.
- Sin transiciones en las tarjetas: el foco responde de inmediato.
- El panel se crea una vez al arrancar y se reutiliza.
- Apertura con un fade corto de 100 ms.

CSS clave:

```css
#antennaPanel {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 6;
  width: 1680px;
  padding: 24px 26px 18px;
  border-radius: 40px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0) 48%),
    linear-gradient(180deg, #191c22, #0b0d11);
  box-shadow: 0 22px 52px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transform: translate(-50%, -50%);
  transition: opacity 100ms linear;
}

#antennaPanel.hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 100ms linear, visibility 0s linear 100ms;
}

.antChannel {
  position: relative;
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 190px;
  height: 150px;
  margin-right: 14px;
  padding: 14px 12px 12px;
  overflow: hidden;
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  background:
    radial-gradient(circle at 50% 32%, rgba(255, 255, 255, 0.13),
      rgba(255, 255, 255, 0) 62%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.075),
      rgba(255, 255, 255, 0.025));
}

.antChannel.focused {
  border-color: rgba(255, 255, 255, 0.92);
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.92),
    inset 0 -3px 0 var(--glow, rgba(255, 255, 255, 0.28));
}
```

webOS 5/Chromium 68 no aplica bien `gap` en flexbox; por eso las tarjetas usan
`margin-right`. Tampoco se usa `inset: 0` en CSS; se usan
`top/right/bottom/left`.

---

## 3. Logos

Los logos **no se incluyen** en el repositorio para no redistribuir marcas de
terceros. La carpeta `app/channels/` solo contiene un README con los nombres que
espera la app. Si añades tus propios PNG, se cargan como `<img>` locales, sin
depender de la red. Si falta un logo o el canal no coincide, se muestra una
insignia neutra con el número.

Créditos y marcas: `app/channels/README.md`.

---

## 4. Obtención de canales

La API antigua `com.webos.service.tv/getChannelList` no es fiable en esta TV.
Se usa:

```text
luna://com.webos.service.apiadapter/tv/getChannelList
```

El servicio devuelve una lista grande (~200 KB). Para no enviar todo por el
puente de root, se ejecuta un pequeño script de Node **en la TV** que:

1. llama a `luna-send` con `getChannelList`;
2. filtra emisoras terrestres;
3. se queda con los números 1–8;
4. prefiere la versión HDTV;
5. devuelve solo un JSON pequeño.

Código conceptual:

```js
var node = 'var cp=require("child_process");' +
  'var out=cp.execSync("/usr/bin/luna-send -n 1 -w 15000 -f ' +
  'luna://com.webos.service.apiadapter/tv/getChannelList {}",' +
  '{encoding:"utf8",maxBuffer:1048576});' +
  'var j=JSON.parse(out);' +
  'if(!j.channelList){process.exit(1);}' +
  'var l=j.channelList.filter(function(c){' +
  'return c.channelMode==="Terrestrial"&&c.channelTypeId===1;});' +
  'var b={};' +
  'l.forEach(function(c){var n=parseInt(String(c.channelNumber||"")' +
  '.split("-")[0],10);' +
  'if(!(n>=1&&n<=8))return;' +
  'if(!b[n]||(c.HDTV&&!b[n].HDTV))b[n]=c;});' +
  'var r=[];for(var n=1;n<=8;n++)r.push(b[n]?' +
  '{number:n,channelName:b[n].channelName,channelId:b[n].channelId,' +
  'channelMode:b[n].channelMode,channelTypeId:1,HDTV:b[n].HDTV}:' +
  '{number:n,channelName:"Canal "+n,channelMode:"Terrestrial",' +
  'channelTypeId:1});' +
  'console.log(JSON.stringify(r));';

execRoot("/usr/bin/node -e '" + node + "'", function (out) { ... });
```

Filtros:

```js
c.channelMode === 'Terrestrial' && c.channelTypeId === 1
```

Si la lista real falla, se mantienen los nombres base de los 8 canales y el
acceso por número sigue disponible.

---

## 5. Caché

- Clave: `tvhome.antenna.v1`.
- Duración: **5 minutos**.
- Se guarda en `localStorage`.
- Se precarga en segundo plano **1,5 s** después de arrancar.
- Si la caché está fresca, no se despierta el sintonizador.
- Si el panel se abre y no hay caché, se muestra “Buscando canales…”.

Esto evita que abrir el panel bloquee la UI mientras la TV consulta la lista.

---

## 6. Sintonización

Al elegir un canal:

```js
var payload = { channelNumber: String(ch.number) };
if (ch.channelId) payload.channelId = ch.channelId;

execRoot(
  "luna-send -n 1 -w 8000 -f " +
  "luna://com.webos.service.apiadapter/tv/openChannel '" +
  JSON.stringify(payload).replace(/'/g, "'\\''") + "'",
  function (out) {
    if (/"returnValue"\s*:\s*false/.test(out)) {
      toast('No se pudo abrir el canal ' + ch.number);
      return;
    }
    // openChannel sintoniza, pero no siempre trae Live TV al frente.
    setTimeout(function () {
      launch(CONFIG.liveTvApp, 'TV en directo');
    }, 350);
  }
);
```

El retardo de **350 ms** se usa para dar tiempo al sintonizador antes de traer
la app de TV al primer plano.

---

## 7. Teclado

En `zone === 'antenna'`:

```js
if (k === KEY.LEFT && antennaFocus > 0) focusAntenna(antennaFocus - 1);
else if (k === KEY.RIGHT && antennaFocus < antennaChannels.length - 1)
  focusAntenna(antennaFocus + 1);
else if (k === KEY.OK) tuneAntenna(antennaFocus);
else if (k === KEY.BACK || k === KEY.ESC) hideAntenna();
else if (k >= 49 && k <= 56) tuneAntenna(k - 49);   // 1–8
else if (k >= 97 && k <= 104) tuneAntenna(k - 97);  // teclado numérico
```

La tecla `4`, por ejemplo, sintoniza el canal 4 y abre TV en directo.

---

## 8. Apertura y reutilización

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

Así la primera apertura no reconstruye 8 tarjetas y las siguientes solo cambian
el foco. El panel oculto usa `visibility: hidden` para que el navegador no lo
pinte mientras no se ve.

---

## 9. Fallos típicos

| Síntoma | Causa probable | Solución |
|---|---|---|
| “Sin lista de canales” | `getChannelList` no responde | Esperar caché o revisar API |
| Logos no aparecen | Falta el PNG o no coincide el nombre | Revisar `app/channels/` y `CREDITS.md` |
| Canal equivocado | Numeración/HDTV distinta | Ajustar `antennaFromList` y `nameMatch` |
| Sintoniza pero no abre TV | `openChannel` no trae foreground | Mantener el `launch` tras 350 ms |
| Panel lento | Sombras/blur/transparencias | Ver [`07-rendimiento-webos5.md`](07-rendimiento-webos5.md) |
