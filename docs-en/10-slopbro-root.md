# 10 — Root with SlopBro

This is the procedure that was actually used on the reference TV. It is **not**
a universal installer. Read the whole page and the official SlopBro/Homebrew
documentation before running anything.

## 1. Context

- TV: LG **55UN71006LB**.
- webOS 5, firmware **04.64.00**.
- A PC on the **same local network** as the TV.
- The work session was remote over the internet, but the TV itself was **not**
  exposed to the internet: no port forwarding, no public IP, no DMZ.
- Tool: **SlopBro**, run from the PC over the LAN.
- Result: Homebrew Channel **0.7.3** and root SSH.

SlopBro is a separate project with its own license (AGPL). It is **not**
included in this repository. Use the official source and check its current
compatibility.

## 2. Before starting

1. Confirm the exact model and firmware.
2. Confirm that the current SlopBro version supports webOS 5 and your TV.
3. Put the PC and TV on the same LAN.
4. Disable VPNs that could change the route to the TV.
5. Keep the TV connected to power; do not unplug it during the process.
6. Have the LG Home and a recovery path available.
7. Do not update firmware during the process.

Do not expose the TV to the internet. Do not run the tool from a public network.

## 3. Command used

With the TV IP/hostname in `TV_HOST`:

```bash
python slopbro.py --webos-version 5 TV_HOST --debug
```

The `--webos-version 5` flag selects the webOS 5 profile. `--debug` prints the
steps and is useful if pairing or installation fails.

Depending on the SlopBro version, the command may be:

```bash
python slopbro.py --webos-version 5 TV_HOST
```

The exact arguments must match the version you downloaded.

## 4. Pairing

SlopBro may ask for SSAP pairing. On the TV:

1. A pairing/authorization prompt appears.
2. Accept it with the remote.
3. Wait for the tool to continue.
4. If the prompt does not appear, check that the TV is awake and on the same
   network.

Do not share the `.key` file created by pairing. Its filename may contain the TV
IP and it is a credential.

## 5. Homebrew Channel

When the root step succeeds, SlopBro installs **Homebrew Channel**.

Reference result:

- Homebrew Channel **0.7.3**.
- Root SSH available.
- Initial root password: **`alpine`**.
- Telnet should remain **OFF**.

Change the root password after the first login if your Homebrew setup allows it.
Do not enable Telnet.

## 6. Verify access

```bash
ssh root@TV_HOST 'id; uname -a'
```

Expected:

```text
uid=0(root)
```

Check Homebrew:

```bash
ssh root@TV_HOST \
  "luna-send -n 1 -f luna://org.webosbrew.hbchannel.service/exec \
   '{\"command\":\"id\"}'"
```

Check the failsafe flag:

```bash
ssh root@TV_HOST 'ls -l /var/luna/preferences/webosbrew_failsafe'
```

If it exists, Homebrew is in protection mode. Wait at least 60 seconds after
boot before doing anything else.

## 7. After root

- Keep Homebrew Channel installed.
- Install/keep the launcher through `dev/install`.
- Set `defaultApps.home` only after the app works.
- Keep the LG Home as fallback.
- Do not factory reset.
- Do not update firmware without checking compatibility.
- Do not enable Telnet.
- Do not expose SSH to the internet.

Continue with [`02-install-and-direct-home.md`](02-install-and-direct-home.md).

## 8. Risks

- Root can void the warranty.
- A failed root can brick the TV.
- A firmware update can remove the root or break Homebrew.
- A factory reset can remove the root and your data.
- Pairing keys and SSH access are credentials.
- The method is model/firmware/tool-version dependent.

If root already works, **do not repeat it** just to install this launcher.

## 9. What not to publish

Never publish:

- the `.key` pairing file;
- the TV IP or hostname;
- SSH keys or passwords;
- `autoroot.log`;
- SlopBro logs with network data;
- a modified SlopBro build.

## 10. If something fails

- Re-run with `--debug` and read the first error, not the last one.
- Confirm the TV is on the same LAN.
- Confirm the webOS version flag.
- Reboot the TV and wait for the failsafe window to clear.
- Check the official SlopBro/Homebrew compatibility notes.
- Do not try random root methods from other models.

This repository documents one successful path, not a guaranteed procedure.
