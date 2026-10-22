# 10 — Root con SlopBro

Este es el procedimiento que se usó realmente en la TV de referencia. **No** es
un instalador universal. Lee toda la página y la documentación oficial de
SlopBro/Homebrew antes de ejecutar nada.

## 1. Contexto

- TV: LG **55UN71006LB**.
- webOS 5, firmware **04.64.00**.
- Un PC en la **misma red local** que la TV.
- La sesión de trabajo fue remota por internet, pero la TV **no** estaba expuesta
  a internet: sin port forwarding, sin IP pública, sin DMZ.
- Herramienta: **SlopBro**, ejecutada desde el PC por la LAN.
- Resultado: Homebrew Channel **0.7.3** y SSH root.

SlopBro es un proyecto separado con su propia licencia (AGPL). **No** se incluye
en este repositorio. Usa la fuente oficial y comprueba su compatibilidad actual.

## 2. Antes de empezar

1. Confirma el modelo y firmware exactos.
2. Confirma que la versión actual de SlopBro soporta webOS 5 y tu TV.
3. Pon el PC y la TV en la misma LAN.
4. Desactiva VPNs que puedan cambiar la ruta hacia la TV.
5. Mantén la TV conectada a la corriente; no la desenchufes durante el proceso.
6. Ten a mano el Home de LG y una vía de recuperación.
7. No actualices firmware durante el proceso.

No expongas la TV a internet. No ejecutes la herramienta desde una red pública.

## 3. Comando usado

Con la IP/nombre de la TV en `TV_HOST`:

```bash
python slopbro.py --webos-version 5 TV_HOST --debug
```

El flag `--webos-version 5` selecciona el perfil de webOS 5. `--debug` imprime
los pasos y es útil si falla el emparejamiento o la instalación.

Según la versión de SlopBro, el comando puede ser:

```bash
python slopbro.py --webos-version 5 TV_HOST
```

Los argumentos exactos deben coincidir con la versión que descargues.

## 4. Emparejamiento

SlopBro puede pedir emparejamiento SSAP. En la TV:

1. Aparece un aviso de emparejamiento/autorización.
2. Acéptalo con el mando.
3. Espera a que la herramienta continúe.
4. Si no aparece el aviso, comprueba que la TV está despierta y en la misma red.

No compartas el archivo `.key` que crea el emparejamiento. Su nombre puede
contener la IP de la TV y es una credencial.

## 5. Homebrew Channel

Cuando el paso de root tiene éxito, SlopBro instala **Homebrew Channel**.

Resultado de referencia:

- Homebrew Channel **0.7.3**.
- SSH root disponible.
- Contraseña root inicial: **`alpine`**.
- Telnet debe quedar **desactivado**.

Cambia la contraseña root tras el primer login si tu instalación de Homebrew lo
permite. No actives Telnet.

## 6. Verificar acceso

```bash
ssh root@TV_HOST 'id; uname -a'
```

Esperado:

```text
uid=0(root)
```

Comprueba Homebrew:

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://org.webosbrew.hbchannel.service/exec \
   '{\"command\":\"id\"}'"
```

Comprueba el flag de failsafe:

```bash
ssh root@TV_HOST 'ls -l /var/luna/preferences/webosbrew_failsafe'
```

Si existe, Homebrew está en modo protección. Espera al menos 60 segundos tras el
arranque antes de hacer cualquier otra cosa.

## 7. Después del root

- Mantén Homebrew Channel instalado.
- Instala/mantén el launcher con `dev/install`.
- Configura `defaultApps.home` solo cuando la app funcione.
- Mantén el Home de LG como respaldo.
- No hagas factory reset.
- No actualices firmware sin comprobar compatibilidad.
- No actives Telnet.
- No expongas SSH a internet.

Continúa en
[`02-instalacion-y-home-directo.md`](02-instalacion-y-home-directo.md).

## 8. Riesgos

- El root puede anular la garantía.
- Un root fallido puede dejar la TV inservible.
- Una actualización de firmware puede quitar el root o romper Homebrew.
- Un factory reset puede quitar el root y tus datos.
- Las claves de emparejamiento y el acceso SSH son credenciales.
- El método depende del modelo, firmware y versión de las herramientas.

Si el root ya funciona, **no lo repitas** solo para instalar este launcher.

## 9. Qué no publicar

No publiques nunca:

- el archivo `.key` de emparejamiento;
- la IP o el hostname de la TV;
- claves o contraseñas SSH;
- `autoroot.log`;
- logs de SlopBro con datos de red;
- una build modificada de SlopBro.

## 10. Si algo falla

- Reejecuta con `--debug` y lee el primer error, no el último.
- Confirma que la TV está en la misma LAN.
- Confirma el flag de versión de webOS.
- Reinicia la TV y espera a que pase la ventana de failsafe.
- Revisa las notas oficiales de compatibilidad de SlopBro/Homebrew.
- No pruebes métodos de root aleatorios de otros modelos.

Este repositorio documenta una ruta que funcionó, no un procedimiento
garantizado.
