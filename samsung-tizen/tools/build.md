# Build Samsung Tizen

No hay un script de build universal: Tizen Studio y la CLI dependen de la
versión instalada.

Ruta recomendada:

1. Abrir Tizen Studio.
2. Importar `samsung-tizen/` como **Tizen Web Project**.
3. Configurar un certificado de autor.
4. Usar **Project → Build** y **Project → Package**.
5. Instalar el `.wgt` con `sdb install`.

Con CLI, desde `samsung-tizen/`:

```bash
tizen build-web -e .
tizen package -t wgt -s NOMBRE_CERTIFICADO -- .
```

Si el proyecto no compila, revisa:

- que `config.xml` tenga un `id` y `package` válidos;
- que el perfil sea `tv`;
- que el certificado esté activo;
- que la versión de Tizen soporte las APIs usadas.

No incluyas certificados, claves ni `.wgt` en el repositorio.
