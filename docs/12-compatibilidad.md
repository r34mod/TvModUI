# 12 — Compatibilidad LG y Samsung

## 1. Regla principal

No existe un launcher universal para “cualquier LG o Samsung”. Existen
**adaptadores** y una implementación de referencia. Cambian:

- el sistema de apps y sus IDs;
- el lanzamiento de apps;
- el sintonizador y los canales;
- el Home del sistema;
- las teclas del mando;
- el método de instalación;
- el root y la persistencia.

Este repo separa la implementación LG del scaffold Samsung para no mezclar
supuestos.

---

## 2. Matriz

| Plataforma | Estado | Launcher | Home directo | Antena TV | Home Assistant | Root |
|---|---|---|---|---|---|---|
| LG webOS 5 | Probado | Sí | Sí | Sí | Sí | Homebrew/SlopBro |
| LG webOS 4 | No probado | Base | Revisar | Revisar | Sí | Depende |
| LG webOS 6/7 | No probado | Base | Revisar | Revisar | Sí | Depende |
| Samsung Tizen 5.5 | Scaffold | UI base | No | No | No | No |
| Samsung Tizen 6/7 | Scaffold | UI base | No | No | No | No |
| Otras marcas | No soportado | — | — | — | — | — |

“Probado” significa una LG 55UN71006LB, webOS 5, firmware 04.64.00. No es una
garantía para otros paneles, regiones o firmwares.

---

## 3. LG webOS

### Lo que funciona en la referencia

- App web `com.gathin.tvhome` instalada por `dev/install`.
- Home directo con `defaultApps.home`.
- Catálogo generado por SSH con `listLaunchPoints`.
- Lanzamiento de apps por Luna/Homebrew.
- Canales por `apiadapter/tv/getChannelList` y `openChannel`.
- Home Assistant por `curl` como root.
- Teclas de mando: flechas, OK, Atrás, números.

### Lo que puede cambiar

- IDs de apps y entradas;
- permisos ACG;
- API de canales;
- comportamiento de `handlesRelaunch`;
- servicios de red;
- disponibilidad de Homebrew/SlopBro;
- WebView y soporte CSS.

### Requisitos

- webOS con root/Homebrew para el Home directo y el catálogo.
- `ares-package` en el PC.
- SSH root para `dev/install` y `sync-apps`.

Sin root se puede desarrollar la UI, pero no el Home directo ni el catálogo
automático.

---

## 4. Samsung Tizen

### Lo que incluye el scaffold

- App web Tizen (`config.xml` + `index.html`).
- Rejilla 16:9 y reloj.
- Navegación con flechas, Enter y Atrás.
- Registro de teclas Tizen habituales.
- Demo de lanzamiento por `tizen.application.launchApp`.

### Lo que falta

- catálogo real de apps instaladas;
- sintonizador/TV en directo;
- panel de canales;
- Home Assistant;
- reemplazo del Home;
- root.

### Por qué no hay root universal

El root de Samsung depende de modelo, SoC, firmware y versión de Tizen. No hay
un método único equivalente a SlopBro para webOS. Este repo **no** incluye
explotes de Samsung ni promete uno.

### Instalación

Se empaqueta como app web normal y se instala con Tizen Studio/`sdb` en una TV
con modo desarrollador. No reemplaza el Home del sistema.

---

## 5. Contrato para añadir una plataforma

Si quieres portar la UI a otra TV, implementa un adaptador con estas funciones:

```text
init()
getApps()                 -> [{ id, title, icon, iconColor }]
launchApp(id, params)
getForegroundApp()
openChannel(number)
getNetwork()
openSettings(section)
execute(command)          -> solo si la plataforma lo permite
setHome(appId)            -> solo si el sistema lo permite
storage.get/set(key)
```

La UI no debería llamar directamente a Luna, Tizen o APIs de fabricante. Hoy la
versión LG usa Luna dentro de `app/app.js`; el scaffold Tizen es independiente.
Una refactorización futura puede mover esto a `app/platform.js`.

---

## 6. Checklist de prueba en otra TV

- [ ] La app arranca y ocupa toda la pantalla.
- [ ] El reloj y la fecha son correctos.
- [ ] Las flechas mueven el foco sin tirones.
- [ ] OK abre una app.
- [ ] Atrás vuelve o cierra.
- [ ] El dock y la rejilla no se solapan.
- [ ] El fondo cambia de franja.
- [ ] El panel de canales abre y sintoniza.
- [ ] El Home directo sigue tras reiniciar.
- [ ] Home Assistant responde.
- [ ] No hay logs con tokens/IPs.

---

## 7. Qué NO prometer

- Que funcione en todas las LG.
- Que funcione en todas las Samsung.
- Que el root sea seguro o reversible.
- Que el Home se pueda reemplazar en Tizen.
- Que los logos/iconos de terceros se puedan redistribuir.
- Que una IA pueda rellenar los huecos sin probar en hardware.
