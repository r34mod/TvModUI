# 06 — Home Assistant

## 1. What the Casa panel does

The **Casa** pill opens a panel with Home Assistant entities. It is not a native
HA app and does not need HACS. Inicio talks to the Home Assistant REST API and
shows a small set of entities configured by the user.

The panel is intentionally small: lights, switches and binary sensors. It is a
remote control, not a full dashboard.

## 2. Configuration

In `app/config.js`:

```js
homeAssistant: {
  url: 'HA_URL',
  token: 'YOUR_LONG_LIVED_TOKEN',
  entities: [
    { entity: 'light.example_1', name: 'Example light', kind: 'light' },
    { entity: 'switch.example_1', name: 'Example switch', kind: 'switch' },
    { entity: 'binary_sensor.example_1', name: 'Example sensor',
      kind: 'binary_sensor' }
  ]
}
```

- `url`: base URL of Home Assistant, without a trailing slash.
- `token`: long-lived access token.
- `entities`: the entities shown in the panel.
- `kind`: `light`, `switch` or `binary_sensor`.

The example file is `app/config.example.js`. Never commit a real `config.js`.

## 3. How requests are made

webOS 5 WebView has limitations with CORS, HTTPS certificates and direct
`fetch` calls. To avoid them, Inicio uses the Homebrew Channel service as a
local executor:

```text
app.js
  → luna://org.webosbrew.hbchannel.service/exec
      → curl on the TV
          → Home Assistant REST API
```

The `curl` command runs on the TV, so the TV must be able to reach the Home
Assistant address. No external proxy is used.

Read a state:

```bash
curl -s \
  -H "Authorization: Bearer YOUR_LONG_LIVED_TOKEN" \
  -H "Content-Type: application/json" \
  "HA_URL/api/states/ENTITY_ID"
```

Turn on a light or switch:

```bash
curl -s -X POST \
  -H "Authorization: Bearer YOUR_LONG_LIVED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id":"ENTITY_ID"}' \
  "HA_URL/api/services/homeassistant/turn_on"
```

Turn off:

```bash
curl -s -X POST \
  -H "Authorization: Bearer YOUR_LONG_LIVED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id":"ENTITY_ID"}' \
  "HA_URL/api/services/homeassistant/turn_off"
```

## 4. UI behavior

- The **Casa** pill opens the panel.
- Each row shows the entity name and state.
- OK toggles a light or switch.
- Binary sensors are read-only.
- A refresh re-reads the states.
- Back closes the panel.
- If the panel is empty, it shows a hint to fill in `homeAssistant.url`.

The panel uses opaque rows and flat focus, following the webOS 5 performance
rules.

## 5. Token security

The token is stored inside the IPK. If you share the IPK, you share the token.

Recommendations:

- Create a long-lived token only for this launcher.
- Use a Home Assistant user with limited permissions if possible.
- Do not publish `app/config.js`.
- Do not put the token in screenshots, logs or issues.
- Revoke the token immediately if it leaks.
- Do not expose Home Assistant or the TV directly to the Internet.

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Panel empty | `url` or `token` missing | Edit `app/config.js` and rebuild |
| `401` | Invalid/revoked token | Create a new token |
| `404` | Wrong entity id | Check the entity in HA |
| Timeout | TV cannot reach HA | Check network and `HA_URL` |
| TLS error | Certificate problem | Use a trusted certificate or a local HTTP endpoint |
| No change | Entity is read-only | Use a writable light/switch |
| Panel slow | Many entities | Keep the list short |

The panel does not create a writable `media_player` entity. It only reads states
and calls `turn_on`/`turn_off` for supported entities.

## 7. Notes

- Home Assistant is not installed on the TV; the panel only talks to the server.
- The token is not stored in `localStorage`; it is read from `config.js`.
- If the TV is suspended and the network changes, reopen Inicio to refresh.
- Keep the entity list small: webOS 5 renders better with a few rows.
