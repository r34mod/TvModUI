# Contribuir

## Reglas

- No incluyas IPs, tokens, claves, logs ni capturas con datos privados.
- No incluyas apps, logos, carátulas ni contenido con DRM.
- No añadas mods de Netflix/Disney/HBO ni addons de pago.
- Mantén la compatibilidad con webOS 5/Chromium 68 en la parte LG.
- Para Samsung, indica la versión de Tizen y el modelo probado.
- Un cambio de UI debe probarse en TV, no solo en escritorio.

## Antes de enviar

```powershell
powershell -ExecutionPolicy Bypass -File tools\check-secrets.ps1
powershell -ExecutionPolicy Bypass -File tools\build.ps1
```

Comprueba que `app/config.js`, `app/apps.js`, `app/icons/` y `dist/` no se han
añadido al commit.

## Estilo

- Español para textos de UI y documentación.
- 2 espacios en JS/CSS/HTML.
- Sin dependencias externas si se pueden evitar.
- En webOS 5, evita `backdrop-filter`, `filter: blur()` a pantalla completa,
  `gap` en flexbox y `inset` en CSS.
- Los paneles deben ser opacos y el foco no debe usar sombras difuminadas.

## Pull requests

Incluye:

- qué cambia;
- modelo y firmware/Tizen probado;
- captura si afecta a la UI;
- confirmación de que no hay secretos.
