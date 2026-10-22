# Seguridad

## No publiques secretos

Este repositorio **no debe contener**:

- `app/config.js` con una URL o un token reales de Home Assistant;
- archivos `.key`, `.pem`, `.p12` o claves SSH;
- la IP privada de una TV o de un servidor;
- logs de la TV, `autoroot.log` o capturas con datos de red;
- IPK/WGT generados;
- tokens de Home Assistant en capturas o issues.

`app/config.js` y `app/apps.js` están en `.gitignore` porque son locales.
Usa `app/config.example.js` y `app/apps.example.js`.

Antes de publicar:

```powershell
powershell -ExecutionPolicy Bypass -File tools\check-secrets.ps1
```

## Root y garantía

Rootear una TV:

- puede anular la garantía;
- puede impedir actualizaciones oficiales;
- puede dejar la TV en un estado irrecuperable si se interrumpe el arranque;
- depende del modelo, firmware y versión de las herramientas.

No cortes la alimentación durante los primeros 30–60 segundos de arranque.
No hagas factory reset con el root instalado. No actualices firmware sin
comprobar compatibilidad.

## Home Assistant

El token de larga duración se guarda dentro del IPK. Si compartes el IPK,
compartes el token. Revócalo en Home Assistant y crea otro si se filtra.

Usa un usuario de Home Assistant con permisos limitados si es posible. No
expongas la TV ni Home Assistant directamente a Internet.

## Samsung Tizen

El scaffold de `samsung-tizen/` no instala root ni reemplaza el Home del sistema.
Es una app web normal. No hay un método de root universal para Samsung y este
repositorio no lo pretende.

## Reportar un problema

Abre un issue **sin datos privados**. Incluye:

- modelo de TV;
- versión de webOS/Tizen;
- versión del launcher;
- pasos para reproducir;
- logs con IPs, tokens y rutas personales eliminadas.

## Alcance

La implementación LG está probada en una LG 55UN71006LB con webOS 5 y firmware
04.64.00. Otras versiones pueden necesitar cambios. El scaffold Samsung Tizen no
está probado en hardware.
