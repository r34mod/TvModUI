# 10 — Root de la TV con SlopBro

## 1. Aclaración: remoto no significa TV expuesta

La primera sesión de trabajo fue **remota por internet**, pero el root se ejecutó
desde un PC que estaba **en la misma red local que la TV**.

SlopBro levanta un servidor HTTP local en el PC y la TV carga desde ahí el
exploit. Por eso:

- no hizo falta abrir puertos en el router;
- no se expuso la TV directamente a Internet;
- no se usó una VPN para llegar a la TV;
- el tráfico del exploit fue **PC ↔ TV dentro de la LAN**.

Si algún día hay que repetirlo con la TV y el PC en sitios distintos, haría
falta una VPN o un túnel hacia esa LAN. No es el escenario que se usó aquí.

---

## 2. Contexto

- TV: **LG 55UN71006LB**, webOS 5.
- Firmware: **04.64.00 (5.6.2-21)**.
- Placa: `k6lp`.
- Conexión: **Ethernet**, PC y TV en el mismo router.
- Método: **SlopBro**, exploit de la vulnerabilidad de `jsserver`.
- Motivo de elegir SlopBro: el método de `faultmanager` está parcheado desde
  el firmware 04.60.49.

No se actualizó el firmware, no se hizo factory reset y no se instaló la app
Developer Mode de LG.

---

## 3. Antes de empezar

Checklist previo:

- [ ] Firmware anotado: `04.64.00`.
- [ ] Modelo y firmware comprobados en la tabla de compatibilidad de
      Homebrew/rootmy.tv.
- [ ] PC con **Python 3.10 o superior**.
- [ ] TV y PC **por cable al mismo router**, sin red de invitados, sin VLAN y
      sin aislamiento de clientes.
- [ ] Perfil de red de Windows en **Privada**.
- [ ] Sin VPN activa en el PC.
- [ ] App **Developer Mode** de LG desinstalada.
- [ ] **Inicio rápido+** desactivado temporalmente.
- [ ] IP de la TV localizada en los ajustes de red.
- [ ] `ping` desde el PC a la TV correcto.

> Con cable se evitan caídas de Wi-Fi y aislamientos de punto de acceso. Es la
> opción más estable para este proceso.

---

## 4. Preparar SlopBro

En el PC, dentro de la carpeta de trabajo:

```powershell
git clone <repositorio-oficial-de-slopbro> slopbro
cd slopbro
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Si PowerShell bloquea la activación:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
```

SlopBro solo usa la biblioteca estándar de Python; no necesita dependencias
externas.

---

## 5. Ejecutar el exploit

El comando que funcionó fue:

```powershell
python slopbro.py --webos-version 5 TV_HOST --debug
```

> El primer intento tuvo una errata en el nombre del parámetro
> (`--webose-version`). El script no arrancó; se corrigió a
> `--webos-version` y funcionó.

Qué ocurre:

1. SlopBro arranca un servidor HTTP local en el PC.
2. Abre una conexión SSAP con la TV.
3. Lanza una app WAM que carga la página del exploit.
4. La TV muestra una página de estado y pide **emparejamiento**.
5. Se acepta el aviso en la TV.
6. Se descarga el paquete falso de `com.webos.service.jsserver`.
7. Ese paquete se ejecuta como **root** y lanza `autoroot.sh`.
8. `autoroot.sh` instala **Homebrew Channel** y lo eleva.
9. Al terminar aparece el mensaje **“Rooting complete”**.
10. Puede hacer falta reiniciar para que Homebrew Channel aparezca.

No se flashea nada, no se toca el bootloader y no se cambia el firmware.

---

## 6. Si falla

| Síntoma | Prueba |
|---|---|
| La TV no conecta de vuelta al PC | `--local-ip IP_DEL_PC` |
| Error TLS/curl en la TV | `--curl-insecure` (útil si el reloj de la TV está mal) |
| No elige la app correcta | `--debug --webos-version 5` |
| No aparece Homebrew Channel | Reiniciar con Inicio rápido+ desactivado |
| Nada funciona | Revisar Firewall de Windows y la red Privada |
| Se queda en el emparejamiento | Aceptar el aviso en la TV y repetir |

Si se usa `--local-ip`, hay que pasar la IP **del PC**, no la de la TV.

---

## 7. Primera configuración de Homebrew

En **Homebrew Channel → Settings**:

- [ ] **SSH Server: ON**.
- [ ] **Telnet: OFF** (root sin contraseña en la LAN).
- [ ] **Block system updates: ON**.
- [ ] Failsafe mode: dejar como está.

Después, por SSH:

```bash
ssh root@TV_HOST
```

La contraseña inicial del root de Homebrew es `alpine`. Se debe cambiar o,
mejor, usar solo autenticación por clave.

```bash
id
# debe devolver uid=0(root)
```

### Cambiar la contraseña

```bash
passwd
```

### Añadir una clave pública

En el PC:

```powershell
ssh-keygen -t ed25519
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

En la TV:

```bash
mkdir -p /home/root/.ssh
chmod 700 /home/root/.ssh
echo 'TU_CLAVE_PUBLICA' >> /home/root/.ssh/authorized_keys
chmod 600 /home/root/.ssh/authorized_keys
```

Luego se puede entrar sin contraseña:

```bash
ssh root@TV_HOST
```

> No copies la clave privada del PC a la TV ni la publiques. El archivo `.key`
> que crea SlopBro para el emparejamiento SSAP tampoco debe compartirse.

---

## 8. Comprobar que el root sobrevive

```bash
ssh root@TV_HOST 'id'
```

Reiniciar y repetir:

```bash
ssh root@TV_HOST 'id'
```

Si sigue devolviendo `uid=0(root)`, la persistencia funciona.

También se puede comprobar Homebrew Channel en la TV y el estado del failsafe:

```bash
ls -l /var/luna/preferences/webosbrew_failsafe
```

Si el flag existe, Homebrew puede estar en modo de protección. No hacer factory
reset ni actualizar firmware: revisar primero el estado de Homebrew.

---

## 9. Qué instala SlopBro

- **Homebrew Channel** (versión usada: `0.7.3`).
- Elevación del servicio de Homebrew para que pueda ejecutar tareas como root.
- Persistencia del root.
- Aviso final para reiniciar.

SlopBro **no**:

- actualiza el firmware;
- hace factory reset;
- instala Developer Mode;
- cambia la partición de sistema;
- instala el launcher Inicio (eso se hizo después, por separado).

---

## 10. Seguridad

- **Telnet OFF**.
- Cambiar la contraseña `alpine` o usar solo clave SSH.
- No abrir el puerto 22 de la TV a Internet.
- No hacer port forwarding de la TV.
- No instalar la app Developer Mode de LG mientras esté rooteada.
- Bloquear actualizaciones de sistema desde Homebrew.
- No hacer factory reset: se pierde el root y en este firmware puede no
  recuperarse.
- No cortar la corriente durante los primeros 30–60 segundos de arranque.
- Guardar el checklist y una copia de la configuración de Homebrew.

---

## 11. Qué se hizo después del root

Con el root ya funcionando:

1. Se instaló y configuró **Homebrew Channel**.
2. Se habilitó SSH y se preparó el acceso por clave.
3. Se instaló el launcher **Inicio** (`com.gathin.tvhome`) por `dev/install`.
4. Se configuró como Home por defecto.
5. Se añadieron Antena TV, fondo, tren y panel de Home Assistant.

El detalle de esa parte está en:

- [`02-instalacion-y-home-directo.md`](02-instalacion-y-home-directo.md)
- [`03-ui-inicio.md`](03-ui-inicio.md)
- [`04-antena-tv.md`](04-antena-tv.md)
- [`05-fondo-y-tren.md`](05-fondo-y-tren.md)
- [`06-home-assistant.md`](06-home-assistant.md)
