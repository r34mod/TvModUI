# 01 — Root, Homebrew Channel y acceso

## 1. Estado real de la TV

La TV se rooteó en la primera sesión con **SlopBro**, desde un PC en la misma
red local y con la sesión de trabajo remota por internet. Después se usó ese
root para instalar el launcher. No se actualizó el firmware y no se hizo factory
reset.

El paso a paso real está en [`10-root-slopbro.md`](10-root-slopbro.md).

Punto de partida:

- LG **55UN71006LB**, webOS 5.
- Firmware **04.64.00**.
- **Homebrew Channel** instalado.
- **SSH root** habilitado.
- `Inicio rápido+` desactivado.
- Acceso desde el PC por SSH.

El root no forma parte del launcher, pero fue el paso previo que permitió
instalarlo y hablar con servicios internos de webOS. El método usado está en
[`10-root-slopbro.md`](10-root-slopbro.md). Si el root ya funciona, **no se debe
repetir**: el riesgo de ladrillo no compensa.

---

## 2. Por qué hace falta root

| Necesidad | Servicio / ruta | Por qué root |
|---|---|---|
| Instalar el IPK sin Developer Mode | `luna://com.webos.appInstallService/dev/install` | El instalador de desarrollo requiere privilegios |
| Leer apps e iconos | `luna://com.webos.applicationManager/listLaunchPoints` | Se ejecuta por SSH como root |
| Abrir canales | `com.webos.service.apiadapter/tv/openChannel` | Servicio interno de TV |
| Leer lista de canales | `com.webos.service.apiadapter/tv/getChannelList` | Servicio interno de TV |
| Ejecutar `curl` para HA | `org.webosbrew.hbchannel.service/exec` | Evita CORS y usa la red de la TV |
| Cambiar el Home | `com.webos.settingsservice/setSystemSettings` | Ajuste de sistema |
| Watcher de rescate | `/var/lib/webosbrew/init.d/` | Arranque como root |
| Quitar apps preinstaladas | `applicationManager` / `dev/install` | Requiere privilegios |

Sin root, el proyecto original usa Developer Mode, `ares install` y un watcher
externo. Aquí se eliminaron esas dependencias.

---

## 3. Comprobaciones básicas

Con `TV_HOST` como variable de entorno o placeholder:

```bash
ssh root@TV_HOST 'id; uname -a'
```

Debe responder como `uid=0(root)`.

Comprobar que Luna responde:

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.applicationManager/getForegroundAppInfo '{}'"
```

Comprobar el servicio del Homebrew Channel:

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://org.webosbrew.hbchannel.service/exec \
   '{\"command\":\"id\"}'"
```

Comprobar el Home actual:

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.settingsservice/getSystemSettings \
   '{\"category\":\"general\",\"key\":\"defaultApps\"}'"
```

---

## 4. Failsafe de Homebrew

La TV usa el flag:

```text
/var/luna/preferences/webosbrew_failsafe
```

Mientras existe, Homebrew está en modo de protección. En los primeros
**30–60 segundos** de arranque no conviene cortar la alimentación: el sistema
todavía puede estar borrando el flag. Si se corta la luz en ese momento, puede
quedar en failsafe.

Buenas prácticas:

- No cortar la corriente durante el arranque.
- No hacer factory reset con el mod instalado.
- No actualizar firmware sin revisar compatibilidad con Homebrew.
- Mantener el Home de LG como fallback.
- Tener a mano `disable-watcher.sh` y el Home de LG.

---

## 5. Rutas importantes

```text
/media/developer/apps/usr/palm/applications/com.gathin.tvhome   app instalada
/var/lib/webosbrew/                                              Homebrew
/var/lib/webosbrew/init.d/                                       hooks de arranque
/var/luna/preferences/webosbrew_failsafe                         flag de failsafe
/tmp/                                                            temporales
```

La app se instala en el área de aplicaciones de desarrollo. No se toca la
partición de sistema para el launcher; solo se usan servicios y hooks de
Homebrew.

---

## 6. Qué NO se hizo

- No se actualizó el firmware.
- No se hizo factory reset.
- No se reinstaló Developer Mode.
- No se instaló Stremio por IPK (se mantiene la vía de LG Content Store).
- No se usaron addons de Stremio no oficiales ni contenido con DRM.
- No se creó una entidad `media_player` escribible en Home Assistant.

---

## 7. Si hay que rehacer el root

El procedimiento que se usó está documentado en
[`10-root-slopbro.md`](10-root-slopbro.md): **SlopBro** para webOS 5, con el PC
en la misma LAN y la TV sin exponer a Internet.

Antes de repetirlo:

1. Confirmar modelo y firmware exactos.
2. Comprobar compatibilidad con la versión actual de SlopBro/Homebrew.
3. Confirmar que el flag de failsafe está limpio.
4. Tener el Home de LG localizable.
5. No actualizar firmware durante el proceso.

Si el root ya funciona, **no se debe repetir**: el riesgo de ladrillo no
compensa y este mod no lo necesita.
