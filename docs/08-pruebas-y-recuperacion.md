# 08 — Pruebas y recuperación

## 1. Lista de pruebas

Haz estas pruebas después de cada instalación:

- [ ] La TV arranca normal.
- [ ] Home abre Inicio.
- [ ] El reloj y la fecha son correctos.
- [ ] La rejilla se mueve con las flechas.
- [ ] El dock abre apps.
- [ ] Antena TV lista los canales 1–8.
- [ ] Las teclas 1–8 abren el canal correspondiente.
- [ ] El panel Casa lee Home Assistant.
- [ ] El tren aparece tras cinco pulsaciones de Atrás.
- [ ] Atrás cierra cada panel.
- [ ] El fondo cambia al cambiar de franja.
- [ ] Reinicia y pulsa Home otra vez.
- [ ] El Home de LG sigue funcionando como respaldo.

## 2. Comprobar la app en primer plano

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.applicationManager/getForegroundAppInfo '{}'"
```

Esperado tras pulsar Home:

```json
{
  "foregroundAppInfo": {
    "appId": "com.gathin.tvhome"
  }
}
```

## 3. Comprobar la app instalada

```bash
ssh root@TV_HOST \
  "ls -la /media/developer/apps/usr/palm/applications/com.gathin.tvhome"
```

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.applicationManager/listLaunchPoints '{}'" \
  | grep -o 'com.gathin.tvhome'
```

## 4. Si Inicio no abre

1. Comprueba que el IPK existe en `dist/`.
2. Reinstala:

```powershell
powershell -ExecutionPolicy Bypass -File tools\install.ps1 -TvHost $env:TV_HOST -Launch
```

3. Busca `state":"installed"` en el log de instalación.
4. Revisa `app/appinfo.json`; el `id` debe ser `com.gathin.tvhome`.
5. Comprueba el directorio de la app en la TV.
6. Si el Home apunta a una app que no está instalada, vuelve primero al Home de
   LG.

## 5. Si Home vuelve al Home de LG

Vuelve a poner Inicio:

```bash
luna-send -n 1 -f luna://com.webos.settingsservice/setSystemSettings \
  '{"category":"general","settings":{"defaultApps":{"home":"com.gathin.tvhome"}}}'
```

Si no se mantiene tras reiniciar, revisa:

- que la app está instalada;
- que `handlesRelaunch` es `false`;
- que ningún watcher legacy está peleando con el ajuste;
- que el firmware no ha reseteado `defaultApps`.

## 6. Volver al Home de LG

```bash
luna-send -n 1 -f luna://com.webos.settingsservice/setSystemSettings \
  '{"category":"general","settings":{"defaultApps":{"home":"com.webos.app.fullhome"}}}'
```

Después desactiva el watcher legacy si lo habías activado:

```bash
sh /media/developer/apps/usr/palm/applications/com.gathin.tvhome/tools/legacy-disable-watcher.sh
```

O ejecuta el script saneado del repo por SSH.

## 7. Si la app falla

- Reinstala el IPK.
- Comprueba que existe `app/apps.js`; ejecuta `tools/setup.ps1` o
  `sync-apps.ps1`.
- Comprueba que existe `app/config.js` y que es JavaScript válido.
- Abre el Web Inspector si está disponible o revisa los logs.
- Quita los cambios recientes de CSS/JS y recompila.

Un `apps.js` o `config.js` que falta es una causa habitual de pantalla en
negro.

## 8. Problemas de arranque y failsafe

Si la TV entra en bootloop tras el root:

- No cortes la alimentación repetidamente.
- Espera al menos 60 segundos.
- Revisa el flag de failsafe de Homebrew:

```text
/var/luna/preferences/webosbrew_failsafe
```

- Usa el procedimiento de recuperación de Homebrew.
- No hagas factory reset en una TV rooteada salvo que aceptes perder el root y
  los datos.

La recuperación exacta depende del modelo y de la versión de Homebrew. Este repo
no incluye un método universal de desbrick.

## 9. Rollback

1. Pon el Home de LG por defecto.
2. Desactiva el watcher.
3. Desinstala Inicio si ya no lo quieres.
4. Guarda una copia del IPK y de `config.js` que funcionaban fuera del repo.

## 10. Qué incluir en un bug report

- Modelo de TV.
- Versión de webOS y firmware.
- Versión del launcher.
- Pasos para reproducir.
- Si el Home directo está activo.
- Logs saneados: sin IPs, tokens, URLs ni números de serie.

Más notas de seguridad: [`../SECURITY.md`](../SECURITY.md).
