/*
 * TvModUI — scaffold para Samsung Tizen TV.
 *
 * Esto NO es un port completo del launcher de webOS. Es una base de interfaz
 * y navegación para Tizen. Cambia los appId por los IDs reales de tu TV.
 *
 * No requiere root, no reemplaza el Home de Samsung y no está probado en
 * hardware. Las APIs de Tizen cambian entre versiones y modelos.
 */
(function () {
  'use strict';

  var KEY = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    ENTER: 13,
    BACK: 10009,
    ESC: 27
  };

  // Cambia estos IDs por los de tus apps Tizen.
  // En Tizen, el ID suele tener la forma "paquete.app".
  var APPS = [
    { appId: 'APP_ID_TV', title: 'TV en directo', initial: 'TV' },
    { appId: 'APP_ID_YOUTUBE', title: 'YouTube', initial: 'YT' },
    { appId: 'APP_ID_NETFLIX', title: 'Netflix', initial: 'N' },
    { appId: 'APP_ID_PRIME', title: 'Prime Video', initial: 'PV' },
    { appId: 'APP_ID_DISNEY', title: 'Disney+', initial: 'D+' }
  ];

  var COLS = 5;
  var COLORS = ['#2c4a63', '#4a2d35', '#2e4a3a', '#3b3a56', '#4c3d28'];

  var grid = document.getElementById('grid');
  var clock = document.getElementById('clock');
  var date = document.getElementById('date');
  var greeting = document.getElementById('greeting');
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  var tiles = [];
  var focus = 0;

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function updateClock() {
    var now = new Date();
    var h = now.getHours();

    clock.textContent = pad(h) + ':' + pad(now.getMinutes());
    date.textContent = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    if (h >= 5 && h < 12) greeting.textContent = 'Buenos días';
    else if (h >= 12 && h < 20) greeting.textContent = 'Buenas tardes';
    else greeting.textContent = 'Buenas noches';
  }

  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('shown');
    }, 2400);
  }

  function render() {
    grid.innerHTML = '';
    tiles = [];

    APPS.forEach(function (app, i) {
      var card = document.createElement('div');
      card.className = 'card';
      card.setAttribute('role', 'option');
      card.tabIndex = -1;
      card.style.background =
        'linear-gradient(160deg, ' + COLORS[i % COLORS.length] + ', #141920)';

      var initial = document.createElement('div');
      initial.className = 'initial';
      initial.textContent = app.initial;

      var title = document.createElement('div');
      title.className = 'title';
      title.textContent = app.title;

      card.appendChild(initial);
      card.appendChild(title);

      card.addEventListener('mouseover', function () { setFocus(i); });
      card.addEventListener('click', function () { activate(i); });

      grid.appendChild(card);
      tiles.push(card);
    });

    setFocus(0);
  }

  function setFocus(index) {
    if (!tiles.length) return;
    focus = Math.max(0, Math.min(index, tiles.length - 1));

    tiles.forEach(function (tile, i) {
      tile.classList.toggle('focused', i === focus);
      tile.setAttribute('aria-selected', i === focus ? 'true' : 'false');
    });

    if (tiles[focus].scrollIntoView) {
      tiles[focus].scrollIntoView({ block: 'nearest' });
    }
  }

  function move(dx, dy) {
    var row = Math.floor(focus / COLS);
    var col = focus % COLS;
    var nextRow = row + dy;
    var nextCol = col + dx;

    if (nextRow < 0 || nextCol < 0 || nextCol >= COLS) return;

    var next = nextRow * COLS + nextCol;
    if (next >= 0 && next < tiles.length) setFocus(next);
  }

  function launch(app) {
    if (window.tizen && tizen.application && tizen.application.launchApp) {
      tizen.application.launchApp(
        app.appId,
        function () { /* lanzada */ },
        function () { toast('No se pudo abrir ' + app.title); }
      );
      return;
    }

    toast('Demo: ' + app.title + ' (' + app.appId + ')');
  }

  function activate(index) {
    var app = APPS[index];
    if (!app) return;
    launch(app);
  }

  function exitApp() {
    if (window.tizen && tizen.application &&
        tizen.application.getCurrentApplication) {
      tizen.application.getCurrentApplication().exit();
      return;
    }
    toast('Atrás: cierra la app en una TV real');
  }

  function registerKeys() {
    if (!window.tizen || !tizen.tvinputdevice) return;

    [
      'MediaPlayPause',
      'MediaPlay',
      'MediaPause',
      'MediaStop',
      'MediaRewind',
      'MediaFastForward'
    ].forEach(function (key) {
      try { tizen.tvinputdevice.registerKey(key); } catch (e) { /* no soportada */ }
    });
  }

  function onKeyDown(event) {
    var k = event.keyCode;
    var handled = true;

    if (k === KEY.LEFT) move(-1, 0);
    else if (k === KEY.RIGHT) move(1, 0);
    else if (k === KEY.UP) move(0, -1);
    else if (k === KEY.DOWN) move(0, 1);
    else if (k === KEY.ENTER) activate(focus);
    else if (k === KEY.BACK || k === KEY.ESC) exitApp();
    else handled = false;

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function init() {
    registerKeys();
    render();
    updateClock();
    setInterval(updateClock, 1000);
    document.addEventListener('keydown', onKeyDown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
