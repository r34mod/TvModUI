#!/bin/sh
# Activa el watcher de Inicio (com.gathin.tvhome) y retira el de Launch Home.
# Ejecutar como root en la TV.
# Requiere /var/lib/webosbrew/vibehack-watcher.sh.
#
# Es una alternativa de rescate. Para el funcionamiento normal se usa el Home
# directo (defaultApps.home = com.gathin.tvhome) y este watcher no debe estar
# ejecutándose.

WATCH=/var/lib/webosbrew/vibehack-watcher.sh
PIDF=/tmp/vibehack-watcher.pid
LOG=/tmp/vibehack-watcher.log
INITD=/var/lib/webosbrew/init.d/40-vibehack-watcher

[ -f "$WATCH" ] || { echo "Falta $WATCH"; exit 1; }
chmod 755 "$WATCH"
mkdir -p /var/lib/webosbrew/init.d

# Un solo watcher: quitar el de Launch Home.
if [ -f /tmp/launch-home-watcher.pid ]; then
  kill "$(cat /tmp/launch-home-watcher.pid 2>/dev/null)" 2>/dev/null || true
fi
rm -f /var/lib/webosbrew/init.d/40-launch-home-watcher
killall home-watcher.sh 2>/dev/null || true

# Parar una instancia anterior de este watcher.
if [ -f "$PIDF" ]; then
  kill "$(cat "$PIDF" 2>/dev/null)" 2>/dev/null || true
  sleep 1
fi
rm -f "$PIDF"

cat >"$INITD" <<EOF
#!/bin/sh
# Arranca el watcher y sale inmediatamente.
LOG="$LOG"
WATCH="$WATCH"
if command -v setsid >/dev/null 2>&1; then
  setsid nohup "\$WATCH" >>"\$LOG" 2>&1 </dev/null &
elif command -v nohup >/dev/null 2>&1; then
  nohup "\$WATCH" >>"\$LOG" 2>&1 </dev/null &
else
  "\$WATCH" >>"\$LOG" 2>&1 </dev/null &
fi
exit 0
EOF

chmod 755 "$INITD"

start_watcher() {
  if command -v setsid >/dev/null 2>&1; then
    setsid nohup "$WATCH" >>"$LOG" 2>&1 </dev/null &
  elif command -v nohup >/dev/null 2>&1; then
    nohup "$WATCH" >>"$LOG" 2>&1 </dev/null &
  else
    "$WATCH" >>"$LOG" 2>&1 </dev/null &
  fi
}

start_watcher
sleep 1

if [ -f "$PIDF" ] && kill -0 "$(cat "$PIDF" 2>/dev/null)" 2>/dev/null; then
  echo "watcher activo pid=$(cat "$PIDF")"
  exit 0
fi

echo "no arrancó"
tail -20 "$LOG" 2>/dev/null || true
exit 1
