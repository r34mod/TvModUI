// Plantilla saneada de app/config.js.
// No contiene IPs, tokens ni URLs reales.
// Copia este contenido a app/config.js y rellena tus valores.

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

  // App de TV en directo.
  liveTvApp: 'com.webos.app.livetv',

  // Tarjetas por fila.
  columns: 5,

  // Reloj de 24 horas.
  clock24h: true,

  // 'auto' usa las fotos según la hora.
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

  // Tiempo con Open-Meteo. Cambia latitud, longitud y ciudad.
  weather: {
    enabled: true,
    latitude: 0,
    longitude: 0,
    city: 'Tu ciudad'
  },

  // Home Assistant.
  // url: URL de tu HA (no la escribas en documentación pública).
  // token: token de larga duración creado en HA.
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
