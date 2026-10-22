# 02 — Instalación del IPK y Home directo

## 1. Pipeline

```text
app/  ──ares-package──►  *.ipk  ──scp/SSH──►  /tmp/vibehack.ipk
                                      │
                                      ▼
                 luna://com.webos.appInstallService/dev/install
                                      │
                                      ▼
                      /media/developer/apps/.../com.gathin.tvhome
                                      │
                                      ▼
                    defaultApps.home = com.gathin.tvhome
```

No se usa Developer Mode ni el comando `ares install`.

---

## 2. Sincronizar catálogo de apps

webOS no deja que una app web lea la lista de apps instaladas. El script
`tools/sync-apps.ps1` la lee **por SSH como root** y genera:

- `app/apps.js`
- `app/icons/*.png`
- las entradas HDMI/TV de `apps.js`

Solo hay que ejecutarlo cuando se instala o se quita una app en la TV:

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-apps.ps1 -TvHost $env:TV_HOST
```

El script usa `listLaunchPoints` y descarga los iconos. La lista es estática:
si cambias apps y no vuelves a sincronizar, la rejilla no lo refleja.

Versión saneada: [`../tools/sync-apps.ps1`](../tools/sync-apps.ps1).

---

## 3. Empaquetar

Antes de empaquetar, crea la configuración local desde los ejemplos:

```powershell
powershell -ExecutionPolicy Bypass -File tools\setup.ps1
```

Esto crea `app/config.js` y `app/apps.js` solo si faltan. Edita `app/config.js`
con tu dock, fondo y Home Assistant.

```powershell
powershell -ExecutionPolicy Bypass -File tools\build.ps1
```

Genera:

```text
dist\com.gathin.tvhome_1.0.0_all.ipk
```

`build.ps1` usa `ares-package`. Si no está en el `PATH`, se le pasa la ruta:

```powershell
powershell -ExecutionPolicy Bypass -File tools\build.ps1 `
  -AresPackage 'C:\ruta\a\ares-package.cmd'
```

Versión saneada: [`../tools/build.ps1`](../tools/build.ps1).

---

## 4. Instalar y abrir

```powershell
powershell -ExecutionPolicy Bypass -File tools\install.ps1 `
  -TvHost $env:TV_HOST -Launch
```

Qué hace `install.ps1`:

1. Copia el IPK a `/tmp/vibehack.ipk` con `scp`.
2. Escribe un JSON con `{ id, ipkUrl, subscribe }`.
3. Ejecuta como root:

```bash
luna-send -i -f luna://com.webos.appInstallService/dev/install \
  '{"id":"com.gathin.tvhome","ipkUrl":"/tmp/vibehack.ipk","subscribe":true}'
```

4. Espera a que el log contenga `"state":"installed"`.
5. Si se pasa `-Launch`, lanza la app con `applicationManager/launch`.
6. Borra los temporales.

Versión saneada: [`../tools/install.ps1`](../tools/install.ps1).

---

## 5. Manifiesto de la app

`app/appinfo.json` contiene lo importante para el Home:

```json
{
  "id": "com.gathin.tvhome",
  "version": "1.0.0",
  "type": "web",
  "main": "index.html",
  "title": "Inicio",
  "handlesRelaunch": false,
  "requiredACG": ["application.launcher", "network.query"],
  "requiredPermissions": [
    "network.operation",
    "network.query",
    "activities.operation",
    "services.blegacy"
  ]
}
```

`handlesRelaunch: false` hace que, al pulsar Home, webOS traiga la app al frente
en lugar de crear una instancia nueva o dejar que el Home de LG tome el control.

Copia saneada: [`../snippets/appinfo.json`](../snippets/appinfo.json).

---

## 6. Activar Inicio como Home

Una sola vez en la TV:

```bash
ssh root@TV_HOST
luna-send -n 1 -f luna://com.webos.settingsservice/setSystemSettings \
  '{"category":"general","settings":{"defaultApps":{"home":"com.gathin.tvhome"}}}'
```

Comprobar:

```bash
luna-send -n 1 -f luna://com.webos.settingsservice/getSystemSettings \
  '{"category":"general","key":"defaultApps"}'
```

Debe aparecer:

```json
{
  "settings": {
    "defaultApps": {
      "home": "com.gathin.tvhome"
    }
  }
}
```

Probar el botón Home y comprobar la app en primer plano:

```bash
luna-send -n 1 -f luna://com.webos.applicationManager/getForegroundAppInfo '{}'
```

Debe devolver `com.gathin.tvhome`.

---

## 7. Volver al Home de LG

```bash
luna-send -n 1 -f luna://com.webos.settingsservice/setSystemSettings \
  '{"category":"general","settings":{"defaultApps":{"home":"com.webos.app.fullhome"}}}'
```

También se puede abrir Inicio desde su icono aunque no sea el Home por defecto.

---

## 8. Watcher antiguo: alternativa de rescate

El proyecto original usaba un watcher que detectaba el Home de LG y lanzaba
Inicio encima. Aquí **no se usa** para el funcionamiento normal: el Home directo
evita el parpadeo y no necesita un proceso permanente.

Se conservan dos scripts de rescate:

- `enable-watcher.sh`: instala/arranca el watcher en
  `/var/lib/webosbrew/init.d/`.
- `disable-watcher.sh`: lo para, lo quita del arranque y devuelve el Home a
  Launch Home o al Home de LG.

No deben ejecutarse a la vez que el Home directo salvo que se esté depurando.

Versiones saneadas:

- [`../snippets/enable-watcher.sh`](../snippets/enable-watcher.sh)
- [`../snippets/disable-watcher.sh`](../snippets/disable-watcher.sh)

---

## 9. Actualizar la app tras un cambio

Cada cambio en `app/` exige reempaquetar e instalar:

```powershell
powershell -ExecutionPolicy Bypass -File tools\build.ps1
powershell -ExecutionPolicy Bypass -File tools\install.ps1 -TvHost $env:TV_HOST -Launch
```

Si el cambio afecta a la lista de apps o a sus iconos, ejecuta antes
`sync-apps.ps1`.

---

## 10. Comprobaciones de instalación

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.applicationManager/listLaunchPoints '{}'" \
  | grep -o 'com.gathin.tvhome'
```

```bash
ssh root@TV_HOST \
  "ls -la /media/developer/apps/usr/palm/applications/com.gathin.tvhome"
```

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.applicationManager/getForegroundAppInfo '{}'"
```

Si la app no arranca, revisar:

- que el IPK se haya generado y copiado;
- que el log de instalación diga `installed`;
- que `appinfo.json` tenga el `id` correcto;
- que el Home por defecto no apunte a una app desinstalada;
- que el path de la app exista.

Más detalle en [`08-pruebas-y-recuperacion.md`](08-pruebas-y-recuperacion.md).
