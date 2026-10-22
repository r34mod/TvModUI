# 09 — Registro de cambios

Cronología resumida del trabajo. No incluye IPs, tokens ni URLs privadas.

## Fase 1 — Base y acceso

- Se rooteó la TV con **SlopBro** desde un PC en la misma LAN, con asistencia
  remota por internet. La TV no se expuso a Internet.
- Se instaló Homebrew Channel y se elevó su servicio.
- Se desactivó `Inicio rápido+`.
- Se comprobó el failsafe de Homebrew y el estado de los servicios Luna.
- Se documentó el modelo, webOS y firmware, sin cambiar el firmware.
- Se decidió no usar Developer Mode ni `ares install`.

## Fase 2 — Launcher propio

- Se partió del port `webos-vibehack`.
- Se adaptó la app a 1920×1080 y a las limitaciones de webOS 5.
- Se empaquetó como `com.gathin.tvhome` y se instaló por `dev/install`.
- Se configuró `defaultApps.home` para que el botón Home abra Inicio.
- Se añadió `handlesRelaunch: false`.
- Se dejó el Home de LG como fallback.
- Se descartó el watcher permanente porque el Home directo ya funcionaba.

## Fase 3 — Limpieza de apps

- Se eliminaron Twitch y apps promocionales de LG.
- Se regeneró `apps.js` y la carpeta de iconos con `sync-apps.ps1`.
- Se ocultaron apps internas, HDMI y la propia app Inicio.
- Se mantuvo la app de alertas deportivas oculta porque es de sistema.

## Fase 4 — Fondo

- Se eligieron fotos reales de Manarola.
- Se recortaron a 1920×1080.
- Se añadieron cuatro franjas: dawn, day, sunset y night.
- Se implementó el crossfade de 1600 ms.
- Se añadió sombra y text-shadow para legibilidad.
- Se conservó la escena SVG “coast” como respaldo.

## Fase 5 — Easter egg

- Se dibujó un tren de Cercanías Madrid de 3 coches en SVG.
- Se implementó la secuencia de 5 Atrás en 3000 ms.
- Se animó con un temporizador JS de 16 ms.
- Se colocó sobre la primera fila visible de apps.
- Se verificó con inyección de teclas y captura de pantalla.

## Fase 6 — Antena TV

- Se creó el panel flotante con 8 canales.
- Se añadieron logos locales y números.
- Se implementó la lectura de canales con `apiadapter/tv/getChannelList`.
- Se filtró la lista en la TV con Node para no enviar 200 KB por el puente.
- Se añadió caché de 5 minutos y precarga a los 1,5 s.
- Se implementó `openChannel` + lanzamiento de TV en directo a los 350 ms.
- Se añadieron flechas, ratón, OK y teclas 1–8.
- Se verificó el canal 4 y el retorno a Inicio.

## Fase 7 — Home Assistant

- Se añadió el panel Casa.
- Se configuró la URL, el token de larga duración y las entidades.
- Se implementó la lectura REST con `curl` como root.
- Se añadió el refresco cada 5 s mientras el panel está abierto.
- Se implementaron toggles para luces, switches, escenas, scripts, etc.
- Se añadieron estados `Conectando…`, `Conectado` y `Sin conexión`.

## Fase 8 — Rendimiento

- Se detectó que el blur a pantalla completa era muy caro en webOS 5.
- Se eliminó `filter: blur()` del fondo y `backdrop-filter`.
- Se cambió el panel a fondo opaco.
- Se quitaron sombras grandes, transforms y transiciones de las tarjetas.
- Se quitaron los `drop-shadow()` de los logos.
- Se precreó el panel oculto y se reutiliza.
- Se dejó un foco plano con anillo interior.
- Se redujo la apertura a un fade de 100 ms.
- Se midió de nuevo: de picos de cientos de ms a una respuesta estable de
  decenas de ms en la mayoría de pulsaciones.

## Estado actual

- Inicio es el Home directo.
- Home de LG sigue disponible.
- Panel Antena TV rediseñado y optimizado.
- Fondo real de Manarola activo.
- Tren de Cercanías funcionando.
- Panel Casa conectado a Home Assistant.
- Sin secretos en esta documentación.
