# Samsung Tizen — scaffold

## Estado

**Scaffold experimental. No probado en hardware.**

No es un port completo del launcher de webOS ni un instalador universal para
cualquier Samsung. Tizen cambia entre versiones, modelos y regiones; las APIs de
apps, TV en directo, teclas y Home no son equivalentes a webOS.

Lo que incluye:

- interfaz 16:9 con reloj y rejilla de apps;
- navegación con flechas, Enter y Atrás;
- soporte de teclas Tizen habituales;
- demo de lanzamiento de apps;
- empaquetado como app web Tizen normal.

Lo que **no** incluye:

- catálogo real de apps instaladas;
- TV en directo / sintonizador;
- panel Antena TV;
- Home Assistant;
- reemplazo del Home de Samsung;
- root.

## Requisitos

- Tizen Studio con extensiones para TV.
- TV Samsung en modo desarrollador.
- Certificado de autor.
- `sdb` para instalar.
- Modelo y versión de Tizen concretos para probar.

## Probar en escritorio

Abre `app/index.html` en un navegador. Sin `tizen`, la app funciona en modo demo:
las tarjetas se mueven y al pulsar Enter muestra un aviso.

## Empaquetar

Desde esta carpeta, con Tizen CLI:

```bash
tizen build-web -e .
tizen package -t wgt -s NOMBRE_CERTIFICADO -- .
```

El `.wgt` se genera en `Project/` o en la carpeta que indique Tizen Studio.
También se puede importar la carpeta como **Tizen Web Project** desde el IDE.

## Instalar

```bash
sdb connect TV_HOST
sdb install ruta/al/paquete.wgt
```

Sustituye `TV_HOST` por la IP de la TV **solo en tu máquina**; no la publiques.

## Adaptar

1. Cambia `APPS` en `app/app.js` por los IDs reales de tus apps.
2. Ajusta `config.xml` (id, package, versión, icono).
3. Prueba el lanzamiento de apps en tu modelo.
4. Si tu TV lo permite, añade integración con las APIs de TV.
5. No asumas que el Home se puede reemplazar: en Tizen no es universal.

## Licencia y marcas

El scaffold es MIT. Samsung y Tizen son marcas de sus propietarios. No hay
afiliación ni soporte oficial.
