# 08 — Pruebas, diagnóstico y recuperación

## 1. Matriz de pruebas

| Prueba | Resultado esperado |
|---|---|
| Pulsar Home | Abre Inicio sin parpadeo del Home de LG |
| `getForegroundAppInfo` | `com.gathin.tvhome` |
| Navegar con flechas | El foco se mueve sin tirones |
| OK en una app | Abre la app |
| OK en TV en directo | Abre el panel Antena TV |
| Flechas en Antena | Cambia de canal |
| Tecla `4` | Sintoniza el canal 4 y abre TV |
| Atrás en Antena | Cierra el panel |
| Atrás ×5 | Aparece el tren |
| Casa | Abre Home Assistant |
| OK en una luz | Enciende/apaga y refresca |
| Atrás en Casa | Cierra el panel |
| Reiniciar TV | Inicio sigue siendo el Home |

---

## 2. Comandos de comprobación

Definir el host:

```powershell
$env:TV_HOST = 'IP_DE_LA_TV'
```

### Foreground

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.applicationManager/getForegroundAppInfo '{}'"
```

### Home por defecto

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.settingsservice/getSystemSettings \
   '{\"category\":\"general\",\"key\":\"defaultApps\"}'"
```

### App instalada

```bash
ssh root@TV_HOST \
  "ls -la /media/developer/apps/usr/palm/applications/com.gathin.tvhome"
```

### Lista de canales

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -w 15000 -f \
   luna://com.webos.service.apiadapter/tv/getChannelList '{}' | head -c 400"
```

### Servicio de root

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://org.webosbrew.hbchannel.service/exec \
   '{\"command\":\"id\"}'"
```

### Logs del watcher (si se usa el rescate)

```bash
ssh root@TV_HOST "tail -50 /tmp/vibehack-watcher.log"
```

---

## 3. Reinstalar la app

```powershell
powershell -ExecutionPolicy Bypass -File tools\build.ps1
powershell -ExecutionPolicy Bypass -File tools\install.ps1 -TvHost $env:TV_HOST -Launch
```

Si se cambió la lista de apps:

```powershell
powershell -ExecutionPolicy Bypass -File tools\sync-apps.ps1 -TvHost $env:TV_HOST
```

---

## 4. Volver al Home de LG

```bash
ssh root@TV_HOST
luna-send -n 1 -f luna://com.webos.settingsservice/setSystemSettings \
  '{"category":"general","settings":{"defaultApps":{"home":"com.webos.app.fullhome"}}}'
```

Inicio se puede seguir abriendo desde su icono.

---

## 5. Desactivar el watcher de rescate

Si en algún momento se activó el watcher antiguo y se quiere volver al Home
directo:

```bash
ssh root@TV_HOST
sh /ruta/a/disable-watcher.sh
```

El script:

- mata el proceso;
- borra `/tmp/vibehack-watcher.pid`;
- elimina el hook de `/var/lib/webosbrew/init.d/`;
- intenta reactivar Launch Home o deja el Home de LG.

No debe quedar ejecutándose a la vez que el Home directo.

---

## 6. Pantalla negra o launcher que no responde

### Opción A: volver al Home de LG

```bash
ssh root@TV_HOST
luna-send -n 1 -f luna://com.webos.settingsservice/setSystemSettings \
  '{"category":"general","settings":{"defaultApps":{"home":"com.webos.app.fullhome"}}}'
```

### Opción B: abrir Inicio desde su icono

Aunque no sea el Home por defecto, la app sigue instalada. Se puede lanzar con:

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://com.webos.applicationManager/launch \
   '{\"id\":\"com.gathin.tvhome\"}'"
```

### Opción C: desactivar el watcher

Si el problema empezó al activar el watcher, ejecutar `disable-watcher.sh`.

### Opción D: reiniciar

```bash
ssh root@TV_HOST "reboot"
```

No cortar la alimentación durante el arranque. Esperar al menos 60 segundos.

---

## 7. Failsafe

Flag:

```text
/var/luna/preferences/webosbrew_failsafe
```

Si aparece, Homebrew puede estar en modo de protección. No hacer factory reset
ni actualizar firmware. Revisar el estado de Homebrew y seguir el procedimiento
de recuperación correspondiente.

---

## 8. Diagnóstico de Antena TV

1. Abrir el panel.
2. Mirar el estado: `8 canales`, `Buscando canales…`, `Sin lista`.
3. Si hay caché, borrarla:

```js
localStorage.removeItem('tvhome.antenna.v1');
```

4. Recargar Inicio.
5. Probar la API de canales por SSH.
6. Si la API falla, los nombres base y las teclas 1–8 deben seguir funcionando.

---

## 9. Diagnóstico de Home Assistant

| Comprobación | Comando / acción |
|---|---|
| La TV llega a HA | `curl` desde la TV |
| Token válido | `GET /api/` con Bearer |
| Entidad correcta | Revisar `entity_id` en HA |
| Servicio root | Probar `hbchannel.service/exec` |
| Panel | Abrir Casa y mirar el estado |

Si el token se ha pegado mal, suele devolver `401`. Si la URL no es accesible,
`curl` devuelve error o timeout. Si el servicio root falla, el panel muestra
“No se pudo ejecutar en la TV”.

---

## 10. Checklist antes de reiniciar

- [ ] El IPK se ha generado sin errores.
- [ ] La instalación terminó en `installed`.
- [ ] `defaultApps.home` apunta a `com.gathin.tvhome`.
- [ ] La app aparece en `listLaunchPoints`.
- [ ] El panel Antena se abre y cierra.
- [ ] El Home de LG sigue disponible como fallback.
- [ ] No hay ningún watcher antiguo ejecutándose.
- [ ] No se ha cortado la corriente durante el arranque.
