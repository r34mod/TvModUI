# 09 — Registro de cambios

Esta es la cronología del trabajo, no un historial de versiones semánticas.

## Octubre de 2026 — base inicial

- Se partió del port a webOS de **tv-vibehack**.
- Se mantuvieron rejilla, dock y navegación con mando.
- Se añadieron textos en español y el lienzo 1920×1080.
- Se puso `handlesRelaunch: false` para el comportamiento de Home.

## Home directo

- Los primeros intentos usaban Developer Mode y un watcher externo.
- El watcher detectaba el Home de LG y lanzaba Inicio encima; provocaba un flash
  visible y necesitaba un proceso permanente.
- Se sustituyó por `defaultApps.home = com.gathin.tvhome`.
- El Home de LG queda como respaldo.
- Los scripts del watcher se conservan solo como rescate.

## Antena TV

- Se añadió un panel con los canales 1–8 en una fila.
- Se usó la lista real del sintonizador vía `apiadapter`.
- Se añadieron insignias numéricas y logos locales opcionales.
- Se cacheó la lista en `localStorage`.
- Se añadió acceso con mando, ratón y teclas 1–8.
- Se corrigió la apertura cuando la app de TV ya estaba abierta.

## Fondo y tren

- Se añadieron cuatro fotos de Manarola con horario.
- Se añadió crossfade entre franjas.
- Se añadieron escenas SVG de costa como respaldo.
- Se añadió el easter egg del tren de Cercanías tras cinco Atrás.

## Home Assistant

- Se añadió la píldora y el panel **Casa**.
- Se usó el servicio `exec` de Homebrew Channel para ejecutar `curl` en la TV.
- Se añadieron filas de luz, switch y sensor binario.
- Se añadieron llamadas `turn_on` / `turn_off`.
- El token queda en `app/config.js`, fuera del repo público.
- No se creó ninguna entidad `media_player` escribible.

## Rendimiento en webOS 5

- Se eliminó el blur en vivo y `backdrop-filter`.
- Se hicieron opacos los paneles.
- Se sustituyeron sombras difuminadas de foco por anillos internos.
- Se prerenderizó el panel de Antena TV.
- Se redujo el trabajo del DOM y los timers vivos.
- Se mantuvieron animaciones en `transform` y `opacity`.
- Se verificó que Home trae Inicio al frente sin recarga completa.

## Root

- Se rooteó con **SlopBro** desde un PC en la misma LAN.
- Se instaló **Homebrew Channel 0.7.3**.
- Se habilitó SSH root.
- Se mantuvo Telnet desactivado.
- No se actualizó firmware, no se hizo factory reset y no se reinstaló Developer
  Mode.
- El proceso real está en [`10-root-slopbro.md`](10-root-slopbro.md).

## Build final de esa fase

- IPK: **6.409.406 bytes**.
- Última app en primer plano tras pulsar Home: `com.gathin.tvhome`.
- Stremio no se instaló por IPK; se dejó para la LG Content Store.

## Pendiente / opcional

- Confirmación de instalación de Stremio en la TV.
- Eliminación opcional de apps que no se usan.
- Comprobación final de “Conectado” en Home Assistant.
- Restauración opcional de logos de Antena.
- Prueba del scaffold Samsung Tizen en hardware.

## Documentación

- Docs en español: [`../docs/`](../docs/).
- Docs en inglés: [`../docs-en/README.md`](../docs-en/README.md).
- Código saneado en `app/` y `tools/`.
- Repo público preparado con `.gitignore`, licencia, aviso de seguridad y
  escáner de secretos.
