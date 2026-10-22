#!/bin/sh
# Desactiva el watcher de Inicio y devuelve el botón Home a Launch Home.
# Ejecutar como root en la TV.
#
# Si Launch Home no está instalado, el Home vuelve al launcher de LG.

PIDF=/tmp/vibehack-watcher.pid
INITD=/var/lib/webosbrew/init.d/40-vibehack-watcher
LH=/media/developer/apps/usr/palm/applications/org.webosbrew.lounge.launcher

if [ -f "$PIDF" ]; then
  kill "$(cat "$PIDF" 2>/dev/null)" 2>/dev/null || true
fi

rm -f "$PIDF" "$INITD"
killall vibehack-watcher.sh 2>/dev/null || true

if [ -f "$LH/enable-home-watcher.sh" ]; then
  sh "$LH/enable-home-watcher.sh"
else
  echo "Launch Home no está: Home vuelve al launcher de LG"
fi
