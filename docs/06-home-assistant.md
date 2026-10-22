# 06 — Home Assistant

## 1. Qué hace el panel Casa

La píldora **Casa** abre un panel con entidades de Home Assistant. No es una app
nativa de HA ni necesita HACS. Inicio habla con la API REST de Home Assistant y
muestra un conjunto pequeño de entidades configuradas por el usuario.

El panel es intencionadamente pequeño: luces, switches y sensores binarios. Es un
mando, no un dashboard completo.

## 2. Configuración

En `app/config.js`:

```js
homeAssistant: {
  url: 'HA_URL',
  token: 'TOKEN_LARGO',
  entities: [
    { entity: 'light.ejemplo_1', name: 'Luz de ejemplo', kind: 'light' },
    { entity: 'switch.ejemplo_1', name: 'Switch de ejemplo', kind: 'switch' },
    { entity: 'binary_sensor.ejemplo_1', name: 'Sensor de ejemplo',
      kind: 'binary_sensor' }
  ]
}
```

- `url`: URL base de Home Assistant, sin barra final.
- `token`: token de larga duración.
- `entities`: entidades que se muestran.
- `kind`: `light`, `switch` o `binary_sensor`.

El archivo de ejemplo es `app/config.example.js`. No publiques un `config.js`
real.

## 3. Cómo se hacen las peticiones

El WebView de webOS 5 tiene limitaciones con CORS, certificados HTTPS y
`fetch` directo. Para evitarlas, Inicio usa el servicio de Homebrew Channel como
ejecutor local:

```text
app.js
  → luna://org.webosbrew.hbchannel.service/exec
      → curl en la TV
          → API REST de Home Assistant
```

El comando `curl` se ejecuta en la TV, así que la TV debe poder alcanzar la
dirección de Home Assistant. No se usa ningún proxy externo.

Leer un estado:

```bash
curl -s \
  -H "Authorization: Bearer TOKEN_LARGO" \
  -H "Content-Type: application/json" \
  "HA_URL/api/states/ENTITY_ID"
```

Encender una luz o un switch:

```bash
curl -s -X POST \
  -H "Authorization: Bearer TOKEN_LARGO" \
  -H "Content-Type: application/json" \
  -d '{"entity_id":"ENTITY_ID"}' \
  "HA_URL/api/services/homeassistant/turn_on"
```

Apagar:

```bash
curl -s -X POST \
  -H "Authorization: Bearer TOKEN_LARGO" \
  -H "Content-Type: application/json" \
  -d '{"entity_id":"ENTITY_ID"}' \
  "HA_URL/api/services/homeassistant/turn_off"
```

## 4. Comportamiento de la UI

- La píldora **Casa** abre el panel.
- Cada fila muestra el nombre y el estado.
- OK enciende o apaga una luz/switch.
- Los sensores binarios son de solo lectura.
- Un refresco vuelve a leer los estados.
- Atrás cierra el panel.
- Si el panel está vacío, muestra una ayuda para rellenar
  `homeAssistant.url`.

El panel usa filas opacas y foco plano, siguiendo las reglas de rendimiento de
webOS 5.

## 5. Seguridad del token

El token se guarda dentro del IPK. Si compartes el IPK, compartes el token.

Recomendaciones:

- Crea un token de larga duración solo para este launcher.
- Usa un usuario de Home Assistant con permisos limitados si es posible.
- No publiques `app/config.js`.
- No pongas el token en capturas, logs o issues.
- Revoca el token inmediatamente si se filtra.
- No expongas Home Assistant ni la TV directamente a Internet.

## 6. Fallos típicos

| Síntoma | Causa probable | Solución |
|---|---|---|
| Panel vacío | Falta `url` o `token` | Edita `app/config.js` y recompila |
| `401` | Token inválido o revocado | Crea otro token |
| `404` | Entidad incorrecta | Revisa el entity id en HA |
| Timeout | La TV no llega a HA | Revisa red y `HA_URL` |
| Error TLS | Problema de certificado | Usa un certificado válido o HTTP local |
| No cambia | Entidad de solo lectura | Usa una luz/switch escribible |
| Panel lento | Muchas entidades | Mantén la lista corta |

El panel no crea una entidad `media_player` escribible. Solo lee estados y llama
a `turn_on`/`turn_off` en entidades compatibles.

## 7. Notas

- Home Assistant no está instalado en la TV; el panel solo habla con el servidor.
- El token no se guarda en `localStorage`; se lee de `config.js`.
- Si la TV se suspende y cambia la red, reabre Inicio para refrescar.
- Mantén la lista de entidades corta: webOS 5 renderiza mejor con pocas filas.
