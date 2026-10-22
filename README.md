# TvModUI

Launcher de TV con estética tipo tvOS, pensado para **LG webOS** y con un
**scaffold separado para Samsung Tizen**. Incluye Home directo, rejilla de apps,
dock, panel de canales, fondo horario, easter egg y panel de Home Assistant.

> **No es un instalador universal.** La implementación LG está probada en una
> LG 55UN71006LB con webOS 5 y firmware 04.64.00. El scaffold Samsung Tizen es
> una base de interfaz, no un port completo ni un método de root universal.
>
> El repositorio está saneado: no contiene IPs privadas, tokens ni claves.
> Cada usuario debe crear su `app/config.js` local.

---

## Estado por plataforma

| Plataforma | Estado | Qué hay |
|---|---|---|
| LG webOS 5 | Probado en hardware | Launcher completo, Home directo, Antena TV, HA |
| LG webOS 4/6/7 | No probado | Base reutilizable; revisar APIs y permisos |
| Samsung Tizen | Scaffold, no probado | UI, teclado, demo de apps; sin root ni Home |
| Otras marcas | No soportado | Solo documentación de referencia |

“Cualquier LG o Samsung” no significa que funcione sin adaptar: cambian las APIs,
los IDs de apps, el sintonizador, el Home y el método de instalación. La matriz
completa está en [`docs/12-compatibilidad.md`](docs/12-compatibilidad.md).

---

## Funciones de la versión LG

- Home directo con `com.gathin.tvhome` y fallback al Home de LG.
- Rejilla de tarjetas 16:9, dock y píldoras de Casa/Entradas/Red/Ajustes.
- Panel **Antena TV** con canales 1–8, logos opcionales y teclas numéricas.
- Fondo de Manarola con franjas dawn/day/sunset/night y crossfade.
- Tren de Cercanías con cinco pulsaciones de Atrás.
- Panel **Casa** para Home Assistant por REST.
- Optimización para Chromium 68: sin blur en vivo, paneles opacos y foco plano.

---

## Estructura

```text
TvModUI/
├── app/                        LG webOS (implementación de referencia)
│   ├── config.example.js       plantilla de configuración
│   ├── apps.example.js         catálogo mínimo de arranque
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── appinfo.json
│   ├── fonts/
│   ├── wallpapers/
│   └── channels/               README; los PNG son locales/opcionales
├── tools/                      build, install, sync, setup, check-secrets
├── docs/                       documentación y guías
├── snippets/                   fragmentos y scripts de referencia
└── samsung-tizen/              scaffold Tizen
    ├── app/
    ├── config.xml
    └── tools/
```

`app/config.js` y `app/apps.js` **no se publican**: se crean desde los ejemplos
con `tools/setup.ps1`. `app/icons/` se genera desde la TV.

---

## Inicio rápido — LG webOS

Requisitos:

- TV LG con webOS, rooteada y con Homebrew Channel/SSH.
- PC con PowerShell y `ares-package`.
- `TV_HOST` definido en la sesión; no lo escribas en el repo.

```powershell
$env:TV_HOST = 'IP_DE_LA_TV'

powershell -ExecutionPolicy Bypass -File tools\setup.ps1
# Edita app\config.js: dock, fondo, Home Assistant.

powershell -ExecutionPolicy Bypass -File tools\sync-apps.ps1 -TvHost $env:TV_HOST
powershell -ExecutionPolicy Bypass -File tools\build.ps1
powershell -ExecutionPolicy Bypass -File tools\install.ps1 -TvHost $env:TV_HOST -Launch
```

Para activar Inicio como Home, consulta
[`docs/02-instalacion-y-home-directo.md`](docs/02-instalacion-y-home-directo.md).
El root con SlopBro está en [`docs/10-root-slopbro.md`](docs/10-root-slopbro.md).

---

## Inicio rápido — Samsung Tizen

Abre `samsung-tizen/` en Tizen Studio, cambia los `appId` de
`samsung-tizen/app/app.js`, configura un certificado y empaqueta como app web.

```text
samsung-tizen/README.md
samsung-tizen/tools/build.md
```

El scaffold no hace root, no reemplaza el Home de Samsung y no está probado en
hardware. No hay un root universal para Samsung; no lo intentes con pasos
genéricos.

---

## Configuración y secretos

- `app/config.example.js` → copia a `app/config.js`.
- `app/apps.example.js` → copia a `app/apps.js`.
- `app/config.js` puede contener la URL y el token de Home Assistant: **no lo
  subas**.
- `app/apps.js`, `app/icons/`, `*.ipk`, `*.wgt`, `*.key` y `dist/` están en
  `.gitignore`.

Antes de publicar:

```powershell
powershell -ExecutionPolicy Bypass -File tools\check-secrets.ps1
```

Si el token de HA se filtra, revócalo y crea otro. No expongas la TV ni Home
Assistant a Internet.

---

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/01-root-y-acceso.md`](docs/01-root-y-acceso.md) | Root, SSH, failsafe |
| [`docs/02-instalacion-y-home-directo.md`](docs/02-instalacion-y-home-directo.md) | IPK, Home directo, rollback |
| [`docs/03-ui-inicio.md`](docs/03-ui-inicio.md) | UI, rejilla, foco, teclas |
| [`docs/04-antena-tv.md`](docs/04-antena-tv.md) | Canales, logos, sintonización |
| [`docs/05-fondo-y-tren.md`](docs/05-fondo-y-tren.md) | Fondo y easter egg |
| [`docs/06-home-assistant.md`](docs/06-home-assistant.md) | Panel Casa y REST |
| [`docs/07-rendimiento-webos5.md`](docs/07-rendimiento-webos5.md) | Rendimiento en webOS 5 |
| [`docs/08-pruebas-y-recuperacion.md`](docs/08-pruebas-y-recuperacion.md) | Pruebas y rescate |
| [`docs/09-registro-de-cambios.md`](docs/09-registro-de-cambios.md) | Cronología |
| [`docs/10-root-slopbro.md`](docs/10-root-slopbro.md) | Root real con SlopBro |
| [`docs/11-publicar.md`](docs/11-publicar.md) | Publicar el repo sin secretos |
| [`docs/12-compatibilidad.md`](docs/12-compatibilidad.md) | Matriz LG/Samsung |

---

## Licencia y créditos

Código bajo licencia MIT, derivado de **webos-vibehack** y **tv-vibehack**.
Consulta [`LICENSE`](LICENSE) y [`NOTICE.md`](NOTICE.md).

No hay afiliación con LG, Samsung, Tizen, Homebrew, Unsplash ni con los
propietarios de las apps. Los logos de canales y los iconos de apps no se
incluyen en el repositorio.

Rootear una TV puede anular la garantía y dejar el equipo inservible. Úsalo bajo
tu responsabilidad.
