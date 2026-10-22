// Configuración de ejemplo de Inicio para LG webOS.
// Copia este archivo a config.js y rellena tus valores:
//
//   powershell -File tools\setup.ps1
//
// No publiques config.js con datos reales.

window.CONFIG = {
  // Apps del dock, en orden. Los ids salen de app/apps.js.
  dockApps: [
    'com.webos.app.livetv',
    'youtube.leanback.v4',
    'amazon',
    'netflix',
    'com.disney.disneyplus-prod'
  ],

  // Apps que no se muestran en la rejilla.
  hiddenApps: [
    'com.gathin.tvhome',
    'com.webos.app.hdmi1',
    'com.webos.app.hdmi2',
    'com.webos.app.hdmi3',
    'com.webos.app.hdmi4',
    'com.webos.app.sportsteamsettings',
    'shortcutcopilot'
  ],

  // App de TV en directo. Vacío para omitirla.
  liveTvApp: 'com.webos.app.livetv',

  // Tarjetas por fila.
  columns: 5,

  // Reloj de 24 horas.
  clock24h: true,

  // 'auto' usa las fotos de wallpaperSchedule.
  // También admite una ruta fija, 'coast' o null.
  wallpaper: 'auto',

  wallpaperSchedule: [
    { from: 5,  to: 8,  image: 'wallpapers/mediterranean-dawn.jpg' },
    { from: 8,  to: 17, image: 'wallpapers/mediterranean-day.jpg' },
    { from: 17, to: 20, image: 'wallpapers/mediterranean-sunset.jpg' },
    { from: 20, to: 5,  image: 'wallpapers/mediterranean-night.jpg' }
  ],

  coastSchedule: [
    { from: 5,  to: 8,  phase: 'dawn' },
    { from: 8,  to: 17, phase: 'day' },
    { from: 17, to: 20, phase: 'sunset' },
    { from: 20, to: 5,  phase: 'night' }
  ],

  wallpaperCrossfadeMs: 1600,

  // Tiempo con Open-Meteo (sin API key).
  // Cambia latitud, longitud y ciudad. enabled:false lo oculta.
  weather: {
    enabled: true,
    latitude: 0,
    longitude: 0,
    city: 'Tu ciudad'
  },

  // Home Assistant.
  // url: dirección de tu HA (no la publiques).
  // token: token de larga duración creado en HA.
  // entities: dispositivos que quieres ver.
  homeAssistant: {
    url: 'HA_URL',
    token: 'TOKEN_AQUI',
    entities: [
      { entity: 'light.example_1', name: 'Luz de ejemplo', kind: 'light' },
      { entity: 'switch.example_1', name: 'Switch de ejemplo', kind: 'switch' },
      { entity: 'binary_sensor.example_1', name: 'Sensor de ejemplo',
        kind: 'binary_sensor' }
    ]
  }
};
