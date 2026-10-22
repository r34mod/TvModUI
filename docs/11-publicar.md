# 11 — Publicar el repositorio sin secretos

## 1. Antes de crear el repositorio

Este repo está preparado para publicarse, pero hay que revisar siempre lo local.

No deben existir en el commit:

- `app/config.js` con URL o token reales;
- `app/apps.js` generado desde una TV concreta;
- `app/icons/` con iconos de apps;
- `app/channels/*.png` con logos de canales;
- archivos `.key`, `.pem`, `.p12`;
- `dist/`, `*.ipk`, `*.wgt`;
- logs, capturas o `.env`.

El `.gitignore` ya los excluye, pero compruébalo.

---

## 2. Comprobación automática

```powershell
powershell -ExecutionPolicy Bypass -File tools\check-secrets.ps1
```

El script busca:

- direcciones IPv4;
- JWT con pinta de token;
- claves privadas;
- tokens literales;
- archivos `.key`;
- archivos prohibidos ya trackeados.

Si devuelve error, no publiques hasta limpiarlo.

---

## 3. Revisión manual

```powershell
git status --short
git ls-files
```

Comprueba que no aparecen:

```text
app/config.js
app/apps.js
app/icons/...
app/channels/*.png
dist/...
*.ipk
*.wgt
*.key
```

También revisa el historial si ya has hecho commits antes:

```powershell
git log --all --stat
```

Si un secreto ya está en un commit, **no basta con borrarlo del último commit**:
hay que reescribir el historial o, mejor, revocar el token/clave.

---

## 4. Crear el repo

```powershell
cd "D:\Codigos Java\TvModUI"
git init -b main
git add .
git status
git commit -m "TvModUI: launcher LG webOS + scaffold Samsung Tizen"
```

Añadir el remoto (sin escribirlo en la documentación):

```powershell
git remote add origin REPO_URL
git push -u origin main
```

No subas `LgModUI`, `webos-vibehack`, `slopbro` ni `D:\Codigos Java` completo.
Este repo ya contiene la documentación y el código saneado.

---

## 5. Qué publicar

### LG

- `app/` con `config.example.js` y `apps.example.js`.
- `tools/` saneado.
- `docs/`.
- Wallpapers con `CREDITS.md`.
- Sin logos de canales ni iconos de apps.

### Samsung

- `samsung-tizen/` marcado como **scaffold no probado**.
- Sin certificados, sin `.wgt`, sin claves.
- Cambiar los `appId` de ejemplo por los reales solo en local.

---

## 6. Texto recomendado para el README de GitHub

- “Implementación de referencia para LG webOS 5.”
- “Scaffold para Samsung Tizen, no probado en hardware.”
- “No es un instalador universal.”
- “Rootear puede anular la garantía.”
- “No se incluyen logos, iconos ni contenido de terceros.”
- “MIT; ver LICENSE y NOTICE.”

---

## 7. Después de publicar

- Activa la protección de secretos de GitHub si está disponible.
- Revisa issues y PRs en busca de tokens o IPs.
- Si alguien comparte un log, pídele que lo sanee.
- Si se filtra un token de HA, revócalo inmediatamente.
- Etiqueta las versiones probadas: modelo, webOS/Tizen y firmware.
