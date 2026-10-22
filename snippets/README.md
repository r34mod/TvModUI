# Snippets saneados

Estos archivos son copias de referencia, **sin IPs, tokens ni URLs privadas**.
El repo ya incluye las versiones operativas en `app/` y `tools/`; usa estas
copias solo como ejemplo o para comparar.

| Archivo | Destino orientativo |
|---|---|
| `config.example.js` | `app/config.example.js` |
| `appinfo.json` | `app/appinfo.json` |
| `build.ps1` | `tools/build.ps1` |
| `install.ps1` | `tools/install.ps1` |
| `sync-apps.ps1` | `tools/sync-apps.ps1` |
| `enable-watcher.sh` | rescate legacy en la TV |
| `disable-watcher.sh` | volver al Home de LG |

## Variables

- `TV_HOST`: IP o nombre de la TV, solo en la sesión de PowerShell.
- `HA_URL`: URL de Home Assistant, solo en `app/config.js`.
- `TOKEN_AQUI`: token de larga duración, solo en `app/config.js`.

No escribas valores reales en este documento ni en un repositorio público.
