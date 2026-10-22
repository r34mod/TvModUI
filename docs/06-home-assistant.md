# 06 — Home Assistant en Inicio

## 1. Qué es

**Home Assistant no está instalado en la TV.** Home Assistant sigue corriendo en
su servidor y la TV actúa como cliente.

Dentro de Inicio hay un panel nativo llamado **Casa** que:

- lee el estado de varias entidades;
- las muestra con icono, nombre y estado;
- permite encender/apagar luces y switches;
- se actualiza cada 5 segundos mientras está abierto;
- no necesita abrir el navegador.

No se creó ninguna entidad `media_player` escribible para la TV.

---

## 2. Arquitectura

```text
Panel Casa (app.js)
       │
       ▼
haRequest()
       │
       ├─ construye un comando curl con Bearer token
       ▼
org.webosbrew.hbchannel.service/exec   (root en la TV)
       │
       ▼
API REST de Home Assistant
```

Se usa `curl` como root en lugar de `fetch()` desde el webview para evitar
problemas de CORS y de certificados del navegador antiguo de webOS.

---

## 3. Configuración saneada

En `app/config.js`:

```js
homeAssistant: {
  url: 'HA_URL',                 // URL de Home Assistant, no incluida aquí
  token: 'TOKEN_AQUI',           // token de larga duración
  entities: [
    { entity: 'light.example_1', name: 'Luz de ejemplo', kind: 'light' },
    { entity: 'switch.example_1', name: 'Switch de ejemplo', kind: 'switch' },
    { entity: 'binary_sensor.example_1', name: 'Sensor de ejemplo',
      kind: 'binary_sensor' }
  ]
}
```

Tipos admitidos: `light`, `switch`, `sensor`, `binary_sensor`, `scene`,
`script`, `climate`, `media_player`, `cover`, `automation`.

Plantilla completa: [`../snippets/config.example.js`](../snippets/config.example.js).

---

## 4. Crear el token

En Home Assistant:

1. Abre el perfil de usuario.
2. Entra en **Seguridad**.
3. Crea un **token de acceso de larga duración**.
4. Copia el token una sola vez.
5. Pégalo en `app/config.js`.
6. Recompila e instala Inicio.

El token hereda los permisos del usuario que lo creó. Si solo se van a controlar
unas luces, considera un usuario de HA limitado a esos dispositivos.

---

## 5. Peticiones

### Leer estado

```text
GET {HA_URL}/api/states/{entity_id}
Cabecera: Authorization: Bearer {token}
```

### Ejecutar servicio

```text
POST {HA_URL}/api/services/{dominio}/{servicio}
Body: {"entity_id":"{entity_id}"}
```

Mapeo de `toggleHa()`:

| Dominio | Servicio |
|---|---|
| `scene` | `scene/turn_on` |
| `script` | `script/turn_on` |
| `button` | `button/press` |
| `automation` | `automation/toggle` |
| `lock` | `lock/lock` o `lock/unlock` |
| `climate` | `climate/turn_on` o `climate/turn_off` |
| luces, switches, etc. | `{dominio}/toggle` |

Los sensores (`sensor`, `binary_sensor`, `weather`, `person`,
`device_tracker`, `sun`) son de solo lectura.

---

## 6. Código clave

Construcción del comando:

```js
function haRequest(path, method, body, cb) {
  var cfg = CONFIG.homeAssistant || {};
  var base = String(cfg.url || '').replace(/\/+$/, '');
  var token = String(cfg.token || '').replace(/'/g, "'\\''");
  if (!base || !token) {
    cb(null, 'Falta configurar Home Assistant');
    return;
  }

  var cmd = 'curl -s -m 8 ';
  if (/^https:/i.test(base)) cmd += '-k ';
  cmd += "-H 'Authorization: Bearer " + token +
    "' -H 'Content-Type: application/json'";

  if (method === 'POST') {
    cmd += " -X POST -d '" +
      JSON.stringify(body || {}).replace(/'/g, "'\\''") + "'";
  }

  cmd += " '" + (base + path).replace(/'/g, "'\\''") + "'";

  execRoot(cmd, function (out, res) {
    if (res && res.returnValue === false) {
      cb(null, 'No se pudo ejecutar en la TV');
      return;
    }
    if (!out) {
      cb(null, 'Home Assistant no responde');
      return;
    }
    cb(out, null);
  });
}
```

Lectura de todas las entidades:

```js
function loadHa() {
  if (!haConfigured() || !haTiles.length) return;
  var pending = haTiles.length, ok = 0, lastErr = null;

  haTiles.forEach(function (t) {
    haRequest('/api/states/' + encodeURIComponent(t.entity), 'GET', null,
      function (out, err) {
        if (out) {
          try {
            var s = JSON.parse(out);
            if (s && s.entity_id) { updateHaTile(t, s); ok++; }
          } catch (e) { /* entidad inválida */ }
        } else {
          lastErr = err;
        }
        if (--pending === 0) {
          if (ok) setHaStatus('Conectado', 'ok');
          else setHaStatus(lastErr || 'Sin conexión', 'bad');
        }
      });
  });
}
```

`showHome()` arranca el refresco:

```js
loadHa();
haTimer = setInterval(loadHa, 5000);
```

`hideHome()` lo detiene:

```js
clearInterval(haTimer);
haTimer = null;
```

---

## 7. Panel Casa

- Se abre con la píldora **Casa**.
- La rejilla usa 3 columnas (`HA_COLS = 3`).
- Flechas para moverse.
- OK para encender/apagar.
- Atrás/Escape para salir.
- Estado en la cabecera: `Conectando…`, `Conectado` o `Sin conexión`.
- Si no hay configuración, muestra un aviso para editar `config.js`.

No se guarda el token en `localStorage`: se lee de `config.js` en cada arranque.

---

## 8. Seguridad

- El token va dentro del IPK. Si compartes el IPK, compartes el token.
- Si el token se filtra, revócalo en HA y crea otro.
- No publiques `app/config.js` real.
- Para HTTPS con certificado autofirmado, el código usa `curl -k`; eso desactiva
  la verificación del certificado. Úsalo solo en una red de confianza.
- La TV debe poder alcanzar `HA_URL` por la red local.
- Si HA está detrás de un proxy, la URL debe incluir el puerto/prefijo correcto.

---

## 9. Diagnóstico

| Síntoma | Causa probable | Comprobación |
|---|---|---|
| “Falta configurar” | `url` o `token` vacíos | Revisar `config.js` |
| “Home Assistant no responde” | Red, URL o puerto | Probar `curl` desde la TV |
| “401 / Unauthorized” | Token inválido o revocado | Crear token nuevo |
| “No se pudo ejecutar” | Homebrew Channel/exec | Probar `org.webosbrew.hbchannel.service/exec` |
| Alguna entidad “No encontrada” | `entity_id` incorrecto | Revisar en HA |
| Estado desactualizado | Panel cerrado | Se refresca al abrirlo |

Prueba manual desde la TV (sin poner el token en el historial):

```bash
curl -s -H "Authorization: Bearer TOKEN_AQUI" \
  "HA_URL/api/"
```

Debe devolver el mensaje de bienvenida de la API.
