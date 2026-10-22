// Catálogo mínimo de ejemplo para arrancar sin conectar la TV.
// `tools/setup.ps1` lo copia a apps.js solo si no existe.
// En una TV real, `tools/sync-apps.ps1` genera el catálogo definitivo
// y descarga los iconos en app/icons/.

window.TV_APPS = {
  apps: [
    { id: 'com.webos.app.livetv', title: 'TV en directo', icon: 'icon.png', iconColor: '#6a7c73' },
    { id: 'youtube.leanback.v4', title: 'YouTube', icon: 'icon.png', iconColor: '#ff0000' },
    { id: 'netflix', title: 'Netflix', icon: 'icon.png', iconColor: '#ffffff' },
    { id: 'amazon', title: 'Prime Video', icon: 'icon.png', iconColor: '#0578ff' },
    { id: 'com.disney.disneyplus-prod', title: 'Disney+', icon: 'icon.png', iconColor: '#054553' }
  ],
  inputs: [
    { appId: 'com.webos.app.hdmi1', label: 'HDMI 1' },
    { appId: 'com.webos.app.hdmi2', label: 'HDMI 2' },
    { appId: 'com.webos.app.hdmi3', label: 'HDMI 3' }
  ]
};
