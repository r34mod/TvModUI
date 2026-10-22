/*
 * tvOS style home for webOS: black, a pinned dock row, an app grid, and one glass highlight that
 * springs between tiles. A port of the Android launcher in ../../launcher.
 *
 * webOS does not let third-party apps list installed apps, so sync-apps.ps1 writes them into apps.js.
 */
(function () {
  'use strict';

  var COLUMNS = Math.max(1, CONFIG.columns || 4);
  var TILE_W = 300, TILE_H = 169;
  var CELL_W = (1920 - 2 * 112) / COLUMNS;
  var ROW_PITCH = 259;
  var DOCK_TOP = 708;           // tile top of the dock row: next row peeks in at the bottom
  var DOCK_GAP = 36;            // extra space below the dock
  var FOCUS_SCALE = 1.1;
  var GLASS_PAD = 12;           // room for the glass glow around the scaled tile
  var VIEW_TOP = 80, VIEW_BOTTOM = 1060;    // area grid rows scroll into (the header hides below the dock)

  var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, OK: 13, BACK: 461, ESC: 27 };

  var GREETINGS = [[5, 'Buenas noches'], [12, 'Buenos días'], [20, 'Buenas tardes'], [24, 'Buenas noches']];
  var DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var DAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  var MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre',
    'octubre', 'noviembre', 'diciembre'];

  var ICON_INPUT = 'M18,7V4c0,-1.1 -0.9,-2 -2,-2H8C6.9,2 6,2.9 6,4v3H5v6l3,6v3h8v-3l3,-6V7H18zM8,4h8v3h-2V5h-1v2h-2V5h-1v2H8V4z';
  var ICON_LIVETV = 'M21,6h-7.59l3.29,-3.29L16,2l-4,4l-4,-4l-0.71,0.71L10.59,6H3c-1.1,0 -2,0.89 -2,2v12c0,1.1 0.9,2 2,2h18c1.1,0 2,-0.89 2,-2V8C23,6.89 22.1,6 21,6zM21,20H3V8h18V20zM9,10v8l7,-4L9,10z';

  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), tilesEl = $('tiles'), glass = $('glass'), hero = $('hero');
  var ambients = [$('ambientA'), $('ambientB')], ambientFront = 0, ambientColor = null;
  var wallpaperLayers = [$('wallpaperA'), $('wallpaperB')], wallpaperFront = 0, wallpaperName = '';
  var randomWallpaper = null;
  var pills = [$('btnHome'), $('btnInputs'), $('btnWifi'), $('btnSettings')];
  var panel = $('inputsPanel');
  var haPanel = $('haPanel'), haGrid = $('haGrid'), haStatusEl = $('haStatus');
  var antennaPanel = $('antennaPanel'), antennaGrid = $('antennaGrid'), antennaStatusEl = $('antennaStatus');
  var trainEl = $('train');

  var items = [];               // {app, el, color}
  var zone = 'grid';            // 'grid' | 'top' | 'inputs' | 'ha' | 'antenna'
  var focused = 0, pillFocus = 0, inputFocus = 0, inputRows = [];
  var offset = 0, heroShown = false, glassShown = false;
  var editing = null;           // {item, snapshot} while a tile is being moved
  var HA_COLS = 3, haTiles = [], haFocus = -1, haTimer = null;
  var WEATHER_KEY = 'tvhome.weather.v2';
  var ANTENNA_KEY = 'tvhome.antenna.v1';
  var ANTENNA_LOGOS = [
    { file: 'la1.png', label: 'La 1', short: '1', nameMatch: /la\s*1/i, glow: 'rgba(0, 114, 255, .38)' },
    { file: 'la2.png', label: 'La 2', short: '2', nameMatch: /la\s*2/i, glow: 'rgba(0, 196, 215, .36)' },
    { file: 'antena3.png', label: 'Antena 3', short: 'A3', nameMatch: /antena\s*3/i, glow: 'rgba(255, 79, 0, .38)' },
    { file: 'cuatro.png', label: 'Cuatro', short: 'C', nameMatch: /cuatro/i, glow: 'rgba(255, 0, 0, .34)' },
    { file: 'telecinco.png', label: 'Telecinco', short: 'T5', nameMatch: /telecinco/i, glow: 'rgba(31, 63, 168, .42)' },
    { file: 'lasexta.png', label: 'laSexta', short: '6', nameMatch: /sexta/i, glow: 'rgba(0, 196, 106, .36)' },
    { file: 'fdf.png', label: 'FDF', short: 'F', nameMatch: /fdf|ficci[oó]n/i, glow: 'rgba(122, 184, 0, .36)' },
    { file: 'telemadrid.png', label: 'Telemadrid', short: 'TM', nameMatch: /telemadrid/i, glow: 'rgba(227, 0, 27, .36)' }
  ];
  var antennaChannels = [], antennaFocus = 0, antennaReturn = 0, antennaLoadedAt = 0, antennaLoading = false;

  // ---- luna bus ------------------------------------------------------------------------------

  var bridges = [];   // keep a reference: a collected bridge drops its callback

  function luna(uri, params, cb) {
    try {
      var b = new PalmServiceBridge();
      b.onservicecallback = function (msg) {
        var res;
        try { res = JSON.parse(msg); } catch (e) { res = { returnValue: false }; }
        if (cb) cb(res);
        if (!params || !params.subscribe) bridges.splice(bridges.indexOf(b), 1);
      };
      bridges.push(b);
      b.call(uri, JSON.stringify(params || {}));
    } catch (e) {
      if (cb) cb({ returnValue: false, errorText: String(e) });   // not on a TV (desktop preview)
    }
  }

  /** Runs a shell command as root through the Homebrew Channel (rooted TVs). */
  function execRoot(command, cb) {
    luna('luna://org.webosbrew.hbchannel.service/exec', { command: command }, function (res) {
      var out = res && res.stdoutString ? String(res.stdoutString) : '';
      if (!out && res && res.stdoutBytes) out = b64utf8(String(res.stdoutBytes));
      if (cb) cb(out || '', res);
    });
  }

  function b64utf8(b64) {
    try {
      return decodeURIComponent(Array.prototype.map.call(atob(b64.replace(/\s+/g, '')), function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) {
      try { return atob(b64); } catch (e2) { return ''; }
    }
  }

  function launch(id, title, params) {
    // A sandboxed web app is often refused applicationManager/launch, so on a
    // rooted TV go through the Homebrew Channel (root) first and fall back to
    // the normal sandboxed call.
    var payload = JSON.stringify({ id: id, params: params || {} });
    luna('luna://org.webosbrew.hbchannel.service/exec', {
      command: "luna-send -i -n 1 -w 4000 -f 'luna://com.webos.applicationManager/launch' '" +
        payload.replace(/'/g, "'\\''") + "'"
    }, function (res) {
      var out = res && res.stdoutString ? String(res.stdoutString) : '';
      if (res && res.returnValue !== false && !/returnValue"\s*:\s*false/.test(out)) return;
      launchDirect(id, title, params);
    });
  }

  function launchDirect(id, title, params) {
    luna('luna://com.webos.applicationManager/launch', { id: id, params: params || {} }, function (res) {
      if (res.returnValue === false) toast('No se pudo abrir ' + (title || id));
    });
  }

  var toastTimer;
  function toast(text) {
    var t = $('toast');
    t.textContent = text;
    t.classList.add('shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('shown'); }, 2200);
  }

  // ---- apps ----------------------------------------------------------------------------------

  function orderedApps() {
    var all = (window.TV_APPS && TV_APPS.apps) || [];
    var byId = {};
    all.forEach(function (a) { byId[a.id] = a; });
    var hidden = {};
    (CONFIG.hiddenApps || []).forEach(function (id) { hidden[id] = true; });
    var byTitle = function (a, b) { return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1; };

    // An order arranged on the TV wins, until dockApps in config.js changes.
    var saved = loadOrder();
    if (saved) {
      var placed = [];
      saved.forEach(function (id) {
        if (byId[id] && !hidden[id]) { placed.push(byId[id]); hidden[id] = true; }
      });
      return placed.concat(all.filter(function (a) { return !hidden[a.id]; }).sort(byTitle));
    }

    var dock = [];
    (CONFIG.dockApps || []).forEach(function (id) {
      if (byId[id] && !hidden[id] && dock.length < COLUMNS) { dock.push(byId[id]); hidden[id] = true; }
    });
    var rest = all.filter(function (a) { return !hidden[a.id]; });
    rest.sort(byTitle);
    return dock.concat(rest);
  }

  var ORDER_KEY = 'tvhome.order';

  function loadOrder() {
    try {
      var s = JSON.parse(localStorage.getItem(ORDER_KEY));
      return s && s.dock === (CONFIG.dockApps || []).join(',') ? s.ids : null;
    } catch (e) {
      return null;
    }
  }

  function saveOrder() {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify({
        dock: (CONFIG.dockApps || []).join(','),
        ids: items.map(function (it) { return it.app.id; })
      }));
    } catch (e) { /* storage unavailable: the order lasts until the app restarts */ }
  }

  function rowOf(i) { return Math.floor(i / COLUMNS); }
  function tileLeft(i) { return 112 + (i % COLUMNS) * CELL_W + (CELL_W - TILE_W) / 2; }
  function tileTop(i) { var r = rowOf(i); return DOCK_TOP + r * ROW_PITCH + (r > 0 ? DOCK_GAP : 0); }

  function build() {
    tilesEl.innerHTML = '';
    items = orderedApps().map(function (app) {
      var el = document.createElement('div');
      el.className = 'item';
      var card = document.createElement('div');
      card.className = 'card';
      var img = document.createElement('img');
      var item = { app: app, el: el, card: card, color: null };
      img.onload = function () { paintTile(item, img); };
      img.src = app.icon;
      card.appendChild(img);
      el.appendChild(card);
      var name = document.createElement('div');
      name.className = 'name';
      name.textContent = app.title;
      el.appendChild(name);
      el.addEventListener('mouseover', function () {
        if (zone !== 'inputs' && zone !== 'antenna' && !editing) focusTile(items.indexOf(item));
      });
      el.addEventListener('click', function () {
        if (editing) finishEdit(true);
        else if (app.id === CONFIG.liveTvApp) {
          focused = items.indexOf(item);
          showAntenna();
        } else launch(app.id, app.title);
      });
      tilesEl.appendChild(el);
      return item;
    });
    layout();
  }

  /** Places every tile by its position in items; tiles glide when the order changes. */
  function layout() {
    items.forEach(function (it, i) {
      it.el.style.left = tileLeft(i) + 'px';
      it.el.style.top = tileTop(i) + 'px';
      it.el.classList.toggle('dock', rowOf(i) === 0);   // the dock has no labels: the top shelf names it
    });

    var band = $('dockBand');
    var n = Math.min(COLUMNS, items.length);
    band.style.display = n ? 'block' : 'none';
    band.style.left = (tileLeft(0) - 28) + 'px';
    band.style.top = (DOCK_TOP - 28) + 'px';
    band.style.width = ((n - 1) * CELL_W + TILE_W + 56) + 'px';
    band.style.height = (TILE_H + 56) + 'px';
  }

  function animateIn() {
    items.forEach(function (it, i) {
      it.el.classList.remove('shown');
      setTimeout(function () { it.el.classList.add('shown'); }, 60 + Math.min(i, 16) * 40);
    });
  }

  /**
   * Store icons are square logos on a solid colour: fill the wide tile with that colour so the logo
   * reads as a banner. LG's system icons are glyphs on transparent: use the app's own colour.
   */
  function paintTile(item, img) {
    var px = null, edge = null;
    try {
      var c = document.createElement('canvas');
      c.width = 12; c.height = 12;
      var g = c.getContext('2d');
      g.drawImage(img, 0, 0, 12, 12);
      px = g.getImageData(0, 0, 12, 12).data;
      edge = edgeColor(img);
    } catch (e) { /* tainted canvas: fall back to the app's colour */ }

    var glyphColor = null;
    if (edge && edge[3] > 200) {
      item.card.style.background = 'rgb(' + edge[0] + ',' + edge[1] + ',' + edge[2] + ')';
    } else {
      item.card.classList.add('glyph');
      item.card.style.background = glyphBackground(item.app.iconColor);
      glyphColor = glyphBackground(item.app.iconColor) === '#2c2c2e' ? null : parseColor(item.app.iconColor);
    }
    // A white glyph says nothing about the app: glow in the tile's colour instead.
    item.color = glyphColor || (px ? vividColor(px) : parseColor(item.app.iconColor));
    if (items[focused] === item) setAmbient(item.color);
  }

  /**
   * The icon's background at full size: a corner pixel, or the middle of the left edge for rounded
   * icons whose corners are transparent. A downscaled sample would blend in the logo.
   */
  function edgeColor(img) {
    var w = img.naturalWidth, h = img.naturalHeight;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    var corner = g.getImageData(2, 2, 1, 1).data;
    return corner[3] > 200 ? corner : g.getImageData(2, Math.floor(h / 2), 1, 1).data;
  }

  function glyphBackground(hex) {
    var c = parseColor(hex);
    if (!c) return '#2c2c2e';
    var hsv = rgbToHsv(c);
    if (hsv[1] < 0.15 && (hsv[2] > 0.85 || hsv[2] < 0.1)) return '#2c2c2e';   // white or black glyph colour
    return 'rgb(' + c.join(',') + ')';
  }

  /** A vivid colour from the icon: the most saturated, not too dark pixel, or the lifted average. */
  function vividColor(px) {
    var best = null, bestScore = -1, sum = [0, 0, 0], n = 0;
    for (var i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue;
      var p = [px[i], px[i + 1], px[i + 2]];
      sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2]; n++;
      var hsv = rgbToHsv(p);
      var score = hsv[1] * Math.min(1, hsv[2] * 1.4);
      if (score > bestScore) { bestScore = score; best = p; }
    }
    if (!n) return [68, 68, 68];
    if (bestScore < 0.25) {   // nearly monochrome icon (e.g. white): its average, lifted
      var avg = rgbToHsv([sum[0] / n, sum[1] / n, sum[2] / n]);
      avg[2] = Math.max(avg[2], 0.55);
      return hsvToRgb(avg);
    }
    var h = rgbToHsv(best);
    h[1] = Math.min(1, h[1] * 1.1);
    h[2] = Math.max(0.5, h[2]);
    return hsvToRgb(h);
  }

  function parseColor(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return null;
    var v = parseInt(m[1], 16);
    return [v >> 16 & 255, v >> 8 & 255, v & 255];
  }

  function rgbToHsv(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return [h, max ? d / max : 0, max];
  }

  function hsvToRgb(hsv) {
    var h = hsv[0], s = hsv[1], v = hsv[2];
    var c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c, rgb;
    if (h < 60) rgb = [c, x, 0];
    else if (h < 120) rgb = [x, c, 0];
    else if (h < 180) rgb = [0, c, x];
    else if (h < 240) rgb = [0, x, c];
    else if (h < 300) rgb = [x, 0, c];
    else rgb = [c, 0, x];
    return rgb.map(function (k) { return Math.round((k + m) * 255); });
  }

  // ---- focus & glass -------------------------------------------------------------------------

  function focusTile(i) {
    if (!items.length) return;
    i = Math.max(0, Math.min(i, items.length - 1));
    setZone('grid');
    if (items[focused]) items[focused].el.classList.remove('focused');
    focused = i;
    items[i].el.classList.add('focused');

    var top = tileTop(i), row = rowOf(i);
    if (row === 0) {
      offset = 0;
    } else {
      // Scroll just enough so the whole glass and the name below the tile are visible.
      if (top - offset + TILE_H + 70 > VIEW_BOTTOM) offset = top + TILE_H + 70 - VIEW_BOTTOM;
      if (top - offset - 24 < VIEW_TOP) offset = top - 24 - VIEW_TOP;
    }
    stage.style.transform = 'translateY(' + (-offset) + 'px)';
    // Keep the header until the content (the dock band is topmost) would run into it.
    var header = document.querySelector('header');
    var headerBottom = header.offsetTop + header.offsetHeight;   // layout box: ignores the hide slide
    document.body.classList.toggle('scrolled', DOCK_TOP - 28 - offset < headerBottom + 24);

    var w = TILE_W * FOCUS_SCALE + 2 * GLASS_PAD, h = TILE_H * FOCUS_SCALE + 2 * GLASS_PAD;
    var x = tileLeft(i) + TILE_W / 2 - w / 2, y = top + TILE_H / 2 - h / 2;
    glass.style.width = w + 'px';
    glass.style.height = h + 'px';
    glass.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    if (!glassShown) {
      // First show: jump there without the spring, then fade in.
      glass.style.transition = 'none';
      glass.offsetWidth;   // flush the jump before restoring the transition
      glass.style.transition = '';
      glass.style.opacity = '1';
      glassShown = true;
    }

    if (row === 0) showHero(items[i]);
    else hideHero();
    setAmbient(items[i].color);   // the glow follows the focused tile in every row
  }

  function hideGlass() {
    glassShown = false;
    glass.style.opacity = '0';
  }

  function showHero(item) {
    var label = item.app.title;
    hero.style.top = (DOCK_TOP - 28 - 52 - 96) + 'px';
    if (!heroShown) {
      hero.textContent = label;
      hero.style.transform = 'none';
      hero.style.opacity = '1';
      heroShown = true;
    } else if (hero.textContent !== label) {
      hero.style.opacity = '0';
      hero.style.transform = 'translateX(-24px)';
      clearTimeout(hero.swap);
      hero.swap = setTimeout(function () {
        hero.textContent = label;
        hero.style.transition = 'none';
        hero.style.transform = 'translateX(24px)';
        hero.offsetWidth;
        hero.style.transition = '';
        hero.style.transform = 'none';
        hero.style.opacity = '1';
      }, 120);
    }
    setAmbient(item.color);
  }

  function hideHero() {
    if (!heroShown) return;
    heroShown = false;
    hero.style.opacity = '0';
  }

  /** Crossfades the glow to a new colour by swapping between two layers. */
  function setAmbient(color) {
    if (!color) return;
    var key = color.join(',');
    if (key === ambientColor) return;
    ambientColor = key;
    var back = ambients[1 - ambientFront];
    back.style.background = 'radial-gradient(circle 1190px at 32% 42%, rgba(' + key + ',0.36) 0%, rgba(' +
      key + ',0.15) 50%, rgba(' + key + ',0) 100%)';
    back.style.opacity = '1';
    ambients[ambientFront].style.opacity = '0';
    ambientFront = 1 - ambientFront;
  }

  function focusPill(i) {
    setZone('top');
    document.body.classList.remove('scrolled');
    pills[pillFocus].classList.remove('focused');
    pillFocus = Math.max(0, Math.min(i, pills.length - 1));
    pills[pillFocus].classList.add('focused');
  }

  function setZone(z) {
    if (zone === z) return;
    if (zone === 'top') pills[pillFocus].classList.remove('focused');
    if (zone === 'grid') {
      if (items[focused]) items[focused].el.classList.remove('focused');
      hideGlass();
    }
    zone = z;
  }

  /** The pill straight above a dock tile, by horizontal distance. */
  function pillAbove(i) {
    var cx = tileLeft(i) + TILE_W / 2, best = 0, bestD = Infinity;
    pills.forEach(function (p, k) {
      var r = p.getBoundingClientRect();
      var d = Math.abs(r.left + r.width / 2 - cx);
      if (d < bestD) { bestD = d; best = k; }
    });
    return best;
  }

  // ---- top bar -------------------------------------------------------------------------------

  function updateClock() {
    var now = new Date(), h = now.getHours();
    for (var k = 0; k < GREETINGS.length; k++) {
      if (h < GREETINGS[k][0]) { $('greeting').textContent = GREETINGS[k][1]; break; }
    }
    var m = now.getMinutes(), pad = m < 10 ? '0' : '';
    var clock24 = CONFIG.clock24h !== false;
    document.body.classList.toggle('clock24h', clock24);
    if (clock24) {
      $('clock').textContent = h + ':' + pad + m;
      $('ampm').textContent = '';
    } else {
      $('clock').textContent = ((h % 12) || 12) + ':' + pad + m;
      $('ampm').textContent = h < 12 ? 'am' : 'pm';
    }
    $('date').textContent = DAYS[now.getDay()] + '  ' + now.getDate() + ' de ' + MONTHS[now.getMonth()];
  }

  /** Shows the Wi-Fi network name when the TV reports it, otherwise the connection type. */
  function watchNetwork() {
    luna('luna://com.palm.connectionmanager/getStatus', { subscribe: true }, function (res) {
      if (res.returnValue === false && !res.wifi && !res.wired) return;
      var text = 'Wi-Fi';
      if (res.wired && res.wired.state === 'connected') text = 'Ethernet';
      else if (res.wifi && res.wifi.state === 'connected') text = res.wifi.ssid || 'Wi-Fi';
      else if (res.isInternetConnectionAvailable === false) text = 'Sin conexión';
      $('wifiLabel').textContent = text;
    });
  }

  // ---- weather -------------------------------------------------------------------------------

  var WMO = {
    0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Niebla', 48: 'Niebla helada',
    51: 'Llovizna', 53: 'Llovizna', 55: 'Llovizna', 56: 'Llovizna helada', 57: 'Llovizna helada',
    61: 'Lluvia', 63: 'Lluvia', 65: 'Lluvia', 66: 'Lluvia helada', 67: 'Lluvia helada',
    71: 'Nieve', 73: 'Nieve', 75: 'Nieve', 77: 'Nieve',
    80: 'Chubascos', 81: 'Chubascos', 82: 'Chubascos', 85: 'Chubascos de nieve', 86: 'Chubascos de nieve',
    95: 'Tormenta', 96: 'Tormenta', 99: 'Tormenta'
  };

  function weatherText(code) { return WMO[code] || 'Tiempo'; }

  function weatherSvg(code) {
    if (code === 0 || code === 1) {
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/>' +
        '<path d="M11 1.5h2v3h-2zM11 19.5h2v3h-2zM1.5 11h3v2h-3zM19.5 11h3v2h-3z' +
        'M4.2 3.1l1.4-1.4 2.1 2.1-1.4 1.4zM16.3 15.2l1.4-1.4 2.1 2.1-1.4 1.4z' +
        'M19.8 3.1l-2.1 2.1 1.4 1.4 2.1-2.1zM7.7 15.2l-2.1 2.1 1.4 1.4 2.1-2.1z"/></svg>';
    }
    if (code === 2) {
      return '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3.2"/>' +
        '<path d="M7 1.5h2v2.6h-2zM1.5 7h2.6v2h-2.6zM2.7 2.1l1.4-1.4 1.8 1.8-1.4 1.4z' +
        'M11.9 2.1l-1.8 1.8 1.4 1.4 1.8-1.8z"/>' +
        '<path d="M7.5 19a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18.7 9.5 4.5 4.5 0 0 1 18.5 19z"/></svg>';
    }
    if (code === 45 || code === 48) {
      return '<svg viewBox="0 0 24 24"><path d="M3 7h18v2H3zM3 11h18v2H3zM5 15h14v2H5zM7 19h10v2H7z"/></svg>';
    }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      return '<svg viewBox="0 0 24 24"><path d="M6.5 17a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 17.7 7.5 4.5 4.5 0 0 1 17.5 17z"/>' +
        '<path d="M8 19h2v3H8zM12 19h2v3h-2zM16 19h2v3h-2z"/></svg>';
    }
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
      return '<svg viewBox="0 0 24 24"><path d="M6.5 16a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 17.7 6.5 4.5 4.5 0 0 1 17.5 16z"/>' +
        '<path d="M7 18l2 2-2 2-2-2zM12 18l2 2-2 2-2-2zM17 18l2 2-2 2-2-2z"/></svg>';
    }
    if (code >= 95) {
      return '<svg viewBox="0 0 24 24"><path d="M6.5 15a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 17.7 5.5 4.5 4.5 0 0 1 17.5 15z"/>' +
        '<path d="M13 15l-2 5h2l-1 4 4-6h-2l1-3z"/></svg>';
    }
    return '<svg viewBox="0 0 24 24"><path d="M6.5 19a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 17.7 9.5 4.5 4.5 0 0 1 17.5 19z"/></svg>';
  }

  function readWeather() {
    try {
      var d = JSON.parse(localStorage.getItem(WEATHER_KEY));
      return d && typeof d.temp === 'number' ? d : null;
    } catch (e) { return null; }
  }

  function shortDay(dateStr) {
    var p = String(dateStr).split('-');
    if (p.length !== 3) return '';
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return DAYS_SHORT[d.getDay()] || '';
  }

  function renderWeather(data) {
    $('weatherIcon').innerHTML = weatherSvg(data.code);
    $('weatherTemp').textContent = Math.round(data.temp) + '°';
    $('weatherDesc').textContent = weatherText(data.code);
    $('weatherCity').textContent = data.city ? '· ' + data.city : '';
    $('weatherRow').classList.remove('hidden');

    var fr = $('forecastRow');
    if (data.daily && data.daily.length) {
      fr.innerHTML = '';
      data.daily.forEach(function (day) {
        var el = document.createElement('div');
        el.className = 'fcDay';
        el.innerHTML = '<span class="fcName">' + shortDay(day.date) + '</span>' +
          '<span class="fcIcon">' + weatherSvg(day.code) + '</span>' +
          '<span class="fcTemp">' + day.max + '°<span class="fcMin">/' + day.min + '°</span></span>';
        fr.appendChild(el);
      });
      fr.classList.remove('hidden');
    } else {
      fr.classList.add('hidden');
    }
  }

  function loadWeather() {
    var cfg = CONFIG.weather || {};
    if (cfg.enabled === false) { $('weatherRow').classList.add('hidden'); return; }

    var cached = readWeather();
    if (cached) renderWeather(cached);
    if (cached && Date.now() - (cached.at || 0) < 10 * 60 * 1000) return;

    if (cfg.latitude != null && cfg.longitude != null) {
      fetchForecast(cfg.latitude, cfg.longitude, cfg.city || '');
      return;
    }
    // No coordinates: locate the TV by its public IP, once, then cache the forecast.
    httpGet('https://ipwho.is/', function (text) {
      try {
        var geo = JSON.parse(text);
        if (geo && geo.success !== false && geo.latitude != null) {
          fetchForecast(geo.latitude, geo.longitude, geo.city || cfg.city || '');
        }
      } catch (e) { /* keep the cached forecast */ }
    });
  }

  function fetchForecast(lat, lon, city) {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(lat) +
      '&longitude=' + encodeURIComponent(lon) +
      '&current=temperature_2m,weather_code,is_day' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto';
    httpGet(url, function (text) {
      try {
        var d = JSON.parse(text);
        var c = d && d.current;
        if (!c || typeof c.temperature_2m !== 'number') return;
        var daily = [];
        if (d.daily && d.daily.time && d.daily.time.length) {
          for (var i = 1; i < d.daily.time.length && daily.length < 4; i++) {
            daily.push({
              date: d.daily.time[i],
              code: d.daily.weather_code[i],
              max: Math.round(d.daily.temperature_2m_max[i]),
              min: Math.round(d.daily.temperature_2m_min[i])
            });
          }
        }
        var data = { temp: c.temperature_2m, code: c.weather_code, city: city || '', at: Date.now(), daily: daily };
        try { localStorage.setItem(WEATHER_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
        renderWeather(data);
      } catch (e) { /* keep the cached forecast */ }
    });
  }

  /** fetch first (CORS-friendly APIs), then curl as root if the webview is blocked. */
  function httpGet(url, cb) {
    var done = false;
    function finish(text) {
      if (done) return;
      done = true;
      cb(text || '');
    }
    try {
      if (typeof fetch !== 'function') { curlGet(url, finish); return; }
      fetch(url, { cache: 'no-store' })
        .then(function (r) { return r.text(); })
        .then(finish)
        .catch(function () { curlGet(url, finish); });
      setTimeout(function () { if (!done) curlGet(url, finish); }, 9000);
    } catch (e) {
      curlGet(url, finish);
    }
  }

  function curlGet(url, cb) {
    execRoot("curl -s -m 10 '" + url.replace(/'/g, "'\\''") + "'", function (out) { cb(out); });
  }

  function activatePill(i) {
    if (zone === 'antenna') hideAntenna();
    if (i === 0) showHome();
    else if (i === 1) showInputs();
    else if (i === 2) launch('com.palm.app.settings', 'Ajustes', { target: 'network' });
    else launch('com.palm.app.settings', 'Ajustes');
  }

  // ---- inputs dropdown -----------------------------------------------------------------------

  function showInputs() {
    panel.innerHTML = '';
    inputRows = [];
    var inputs = (window.TV_APPS && TV_APPS.inputs) || [];
    inputs.forEach(function (inp) { addInputRow(ICON_INPUT, inp.label, inp.appId); });
    if (CONFIG.liveTvApp) {
      if (inputRows.length) panel.appendChild(Object.assign(document.createElement('div'), { className: 'separator' }));
      addInputRow(ICON_LIVETV, 'TV en directo', CONFIG.liveTvApp);
    }
    if (!inputRows.length) { toast('No hay entradas'); return; }

    // Hang right below the Inputs pill, at least as wide as it.
    var r = pills[1].getBoundingClientRect();
    panel.style.left = r.left + 'px';
    panel.style.top = (r.bottom + 20) + 'px';
    panel.style.minWidth = Math.max(r.width, 300) + 'px';
    panel.classList.remove('hidden');
    pills[pillFocus].classList.remove('focused');
    zone = 'inputs';
    focusInput(0);
  }

  function addInputRow(icon, label, appId) {
    var row = document.createElement('div');
    row.className = 'inputRow';
    row.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + icon + '"/></svg>';
    row.appendChild(document.createTextNode(label));
    var idx = inputRows.length;
    row.addEventListener('mouseover', function () { focusInput(idx); });
    row.addEventListener('click', function () { hideInputs(); launch(appId, label); });
    row.appId = appId;
    row.label = label;
    inputRows.push(row);
    panel.appendChild(row);
  }

  function focusInput(i) {
    if (inputRows[inputFocus]) inputRows[inputFocus].classList.remove('focused');
    inputFocus = Math.max(0, Math.min(i, inputRows.length - 1));
    inputRows[inputFocus].classList.add('focused');
  }

  function hideInputs() {
    panel.classList.add('hidden');
    zone = 'none';
    focusPill(1);
  }

  // ---- antenna TV channel picker -------------------------------------------------------------

  function baseAntennaChannels() {
    var list = [];
    for (var n = 1; n <= 8; n++) {
      list.push({ number: n, name: ANTENNA_LOGOS[n - 1].label });
    }
    return list;
  }

  function antennaLogoFor(ch) {
    var name = String(ch && ch.name ? ch.name : '');
    for (var i = 0; i < ANTENNA_LOGOS.length; i++) {
      if (ANTENNA_LOGOS[i].nameMatch.test(name)) return ANTENNA_LOGOS[i];
    }
    // Placeholders ("Canal 4") use the known Madrid lineup; an unexpected
    // channel name gets a neutral badge instead of the wrong logo.
    if (name && !/^Canal\s+\d+$/i.test(name)) return null;
    var n = Number(ch && ch.number);
    return n >= 1 && n <= ANTENNA_LOGOS.length ? ANTENNA_LOGOS[n - 1] : null;
  }

  function antennaDisplayName(ch) {
    var name = String(ch && ch.name ? ch.name : '');
    if (name && !/^Canal\s+\d+$/i.test(name)) return name;
    var logo = antennaLogoFor(ch);
    return logo ? logo.label : name || ('Canal ' + (ch && ch.number));
  }

  function antennaNumber(ch) {
    var raw = ch.channelNumber != null ? ch.channelNumber : ch.number;
    var n = parseInt(String(raw == null ? '' : raw).split('-')[0], 10);
    if (!n) n = Number(ch.majorNumber);
    return n >= 1 && n <= 8 ? n : 0;
  }

  function antennaFromList(channelList) {
    var list = Array.isArray(channelList) ? channelList : [];
    // getChannelList also returns radio channels; keep only terrestrial TV.
    var terrestrial = list.filter(function (c) {
      return c.channelMode === 'Terrestrial' &&
        (c.channelTypeId === 1 || c.channelType === 'Terrestrial Digital TV');
    });
    var source = terrestrial.length ? terrestrial : list;
    var byNumber = {};
    source.forEach(function (c) {
      var n = antennaNumber(c);
      if (!n) return;
      if (!byNumber[n] || (c.HDTV && !byNumber[n].HDTV)) byNumber[n] = c;
    });

    var channels = [], found = false;
    for (var n = 1; n <= 8; n++) {
      var c = byNumber[n];
      if (c) found = true;
      channels.push({
        number: n,
        name: c && c.channelName ? String(c.channelName) : 'Canal ' + n,
        channelId: c && c.channelId ? String(c.channelId) : '',
        channelMode: c && c.channelMode ? String(c.channelMode) : 'Terrestrial'
      });
    }
    return { channels: channels, found: found };
  }

  function readAntennaCache() {
    try {
      var data = JSON.parse(localStorage.getItem(ANTENNA_KEY));
      if (data && data.channels && data.channels.length === 8) return data;
    } catch (e) { /* ignore */ }
    return null;
  }

  function saveAntennaCache() {
    try {
      localStorage.setItem(ANTENNA_KEY, JSON.stringify({ at: Date.now(), channels: antennaChannels }));
    } catch (e) { /* ignore */ }
  }

  function setAntennaStatus(text, loading) {
    antennaStatusEl.textContent = text || '';
    antennaStatusEl.classList.toggle('loading', !!loading);
  }

  function renderAntenna() {
    antennaGrid.innerHTML = '';
    antennaChannels.forEach(function (ch, i) {
      var logo = antennaLogoFor(ch);
      var row = document.createElement('div');
      row.className = 'antChannel';
      row.style.setProperty('--glow', logo ? logo.glow : 'rgba(255, 255, 255, .28)');
      row.title = antennaDisplayName(ch);

      var num = document.createElement('span');
      num.className = 'antNum';
      num.textContent = String(ch.number);

      var logoWrap = document.createElement('div');
      logoWrap.className = 'antLogoWrap';
      if (logo) {
        var img = document.createElement('img');
        img.className = 'antLogo';
        img.alt = '';
        img.draggable = false;
        img.src = 'channels/' + logo.file;
        img.addEventListener('error', function () { row.classList.add('noLogo'); });
        logoWrap.appendChild(img);
      } else {
        row.classList.add('noLogo');
      }

      var fallback = document.createElement('span');
      fallback.className = 'antFallback';
      fallback.textContent = logo ? logo.short : String(ch.number);
      logoWrap.appendChild(fallback);

      var name = document.createElement('span');
      name.className = 'antName';
      name.textContent = antennaDisplayName(ch);

      row.appendChild(num);
      row.appendChild(logoWrap);
      row.appendChild(name);
      row.addEventListener('mouseover', function () { focusAntenna(i); });
      row.addEventListener('click', function () { tuneAntenna(i); });
      antennaGrid.appendChild(row);
    });
    focusAntenna(Math.min(antennaFocus, antennaChannels.length - 1));
  }

  function focusAntenna(i) {
    if (!antennaChannels.length) return;
    var children = antennaGrid.children;
    for (var k = 0; k < children.length; k++) children[k].classList.remove('focused');
    antennaFocus = Math.max(0, Math.min(i, antennaChannels.length - 1));
    if (children[antennaFocus]) children[antennaFocus].classList.add('focused');
  }

  function showAntenna() {
    if (!CONFIG.liveTvApp || zone === 'antenna') return;
    antennaReturn = focused;
    setZone('antenna');
    hideHero();
    antennaFocus = 0;
    if (!antennaChannels.length) antennaChannels = baseAntennaChannels();
    if (!antennaGrid.children.length) renderAntenna();
    else focusAntenna(0);
    setAntennaStatus('8 canales');
    antennaPanel.classList.remove('hidden');
    loadAntennaChannels();
  }

  function hideAntenna() {
    if (zone !== 'antenna') return;
    antennaPanel.classList.add('hidden');
    setZone('grid');
    focusTile(antennaReturn);
  }

  function loadAntennaChannels() {
    if (antennaLoading) return;
    if (antennaLoadedAt && Date.now() - antennaLoadedAt < 5 * 60 * 1000) {
      setAntennaStatus('8 canales');
      return;
    }

    var haveChannels = antennaChannels.length === 8 && antennaLoadedAt > 0;
    var cached = readAntennaCache();
    if (cached) {
      antennaChannels = cached.channels;
      antennaLoadedAt = cached.at || 0;
      haveChannels = true;
      renderAntenna();
      // A fresh cache is good enough; don't wake the TV tuner on every launch.
      if (antennaLoadedAt && Date.now() - antennaLoadedAt < 5 * 60 * 1000) {
        setAntennaStatus('8 canales');
        return;
      }
    }

    antennaLoading = true;
    setAntennaStatus(haveChannels ? '8 canales' : 'Buscando canales…', !haveChannels);
    // The API returns the full channel list (~200 KB), so filter it on the TV
    // with Node before sending the result through the root service.
    var node = 'var cp=require("child_process");' +
      'var out=cp.execSync("/usr/bin/luna-send -n 1 -w 15000 -f luna://com.webos.service.apiadapter/tv/getChannelList {}",{encoding:"utf8",maxBuffer:1048576});' +
      'var j=JSON.parse(out);' +
      'if(!j.channelList){process.exit(1);}' +
      'var l=j.channelList.filter(function(c){return c.channelMode==="Terrestrial"&&c.channelTypeId===1;});' +
      'var b={};' +
      'l.forEach(function(c){var n=parseInt(String(c.channelNumber||"").split("-")[0],10);' +
      'if(!(n>=1&&n<=8))return;if(!b[n]||(c.HDTV&&!b[n].HDTV))b[n]=c;});' +
      'var r=[];for(var n=1;n<=8;n++)r.push(b[n]?' +
      '{number:n,channelName:b[n].channelName,channelId:b[n].channelId,channelMode:b[n].channelMode,channelTypeId:1,HDTV:b[n].HDTV}:' +
      '{number:n,channelName:"Canal "+n,channelMode:"Terrestrial",channelTypeId:1});' +
      'console.log(JSON.stringify(r));';
    execRoot("/usr/bin/node -e '" + node + "'", function (out) {
      antennaLoading = false;
      var list = null;
      try {
        var a = out.indexOf('['), b = out.lastIndexOf(']');
        if (a >= 0 && b > a) list = JSON.parse(out.slice(a, b + 1));
      } catch (e) { list = null; }

      if (!Array.isArray(list)) {
        setAntennaStatus(haveChannels ? '8 canales' : 'Sin lista de canales');
        return;
      }
      var parsed = antennaFromList(list);
      antennaChannels = parsed.channels;
      antennaLoadedAt = Date.now();
      renderAntenna();
      setAntennaStatus(parsed.found ? '8 canales' : 'Sin canales');
      if (parsed.found) saveAntennaCache();
    });
  }

  function tuneAntenna(i) {
    var ch = antennaChannels[i];
    if (!ch) return;
    hideAntenna();

    var payload = { channelNumber: String(ch.number) };
    if (ch.channelId) payload.channelId = ch.channelId;
    var json = JSON.stringify(payload);
    execRoot("luna-send -n 1 -w 8000 -f luna://com.webos.service.apiadapter/tv/openChannel '" +
      json.replace(/'/g, "'\\''") + "'", function (out) {
      if (/"returnValue"\s*:\s*false/.test(out)) {
        toast('No se pudo abrir el canal ' + ch.number);
        return;
      }
      // openChannel tunes the channel, but it does not always bring Live TV
      // to the foreground, so open it explicitly after the tune.
      setTimeout(function () { launch(CONFIG.liveTvApp, 'TV en directo'); }, 350);
    });
  }

  // ---- home assistant ------------------------------------------------------------------------

  var HA_PATHS = {
    light: 'M9,21h6v-1H9v1zM12,2C8.14,2 5,5.14 5,9c0,2.38 1.19,4.47 3,5.74V17h8v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z',
    switch: 'M13,3h-2c-1.1,0-2,0.9-2,2v14c0,1.1 0.9,2 2,2h2c1.1,0 2-0.9 2-2V5c0-1.1-0.9-2-2-2zM13,19h-2V5h2V19z',
    sensor: 'M15,13V5c0-1.66-1.34-3-3-3S9,3.34 9,5v8c-1.21,0.91-2,2.37-2,4 0,2.76 2.24,5 5,5s5-2.24 5-5C17,15.37 16.21,13.91 15,13zM12,19c-1.66,0-3-1.34-3-3 0-1.31 0.84-2.42 2-2.83V5c0-0.55 0.45-1 1-1s1,0.45 1,1v8.17C14.16,13.58 15,14.69 15,16 15,17.66 13.66,19 12,19z',
    binary_sensor: 'M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10s10-4.48 10-10S17.52,2 12,2zM12,20c-4.42,0-8-3.58-8-8s3.58-8 8-8s8,3.58 8,8S16.42,20 12,20z',
    scene: 'M12,2l2.4,7.4H22l-6.2,4.5l2.4,7.4L12,16.8l-6.2,4.5l2.4-7.4L2,9.4h7.6L12,2z',
    script: 'M14,2H6C4.9,2 4,2.9 4,4v16c0,1.1 0.9,2 2,2h12c1.1,0 2-0.9 2-2V8L14,2zM14,18H6v-2h8V18zM14,14H6v-2h8V14zM14,10H6V8h8V10z',
    climate: 'M15,13V5c0-1.66-1.34-3-3-3S9,3.34 9,5v8c-1.21,0.91-2,2.37-2,4 0,2.76 2.24,5 5,5s5-2.24 5-5C17,15.37 16.21,13.91 15,13zM12,19c-1.66,0-3-1.34-3-3 0-1.31 0.84-2.42 2-2.83V5c0-0.55 0.45-1 1-1s1,0.45 1,1v8.17C14.16,13.58 15,14.69 15,16 15,17.66 13.66,19 12,19z',
    media_player: 'M8,5v14l11,-7L8,5z',
    cover: 'M19,3H5C3.9,3 3,3.9 3,5v14c0,1.1 0.9,2 2,2h14c1.1,0 2,-0.9 2,-2V5C21,3.9 20.1,3 19,3zM19,19H5V5h14V19z',
    automation: 'M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10s10-4.48 10-10S17.52,2 12,2zM12,20c-4.42,0-8-3.58-8-8s3.58-8 8-8s8,3.58 8,8S16.42,20 12,20z'
  };

  function haIcon(kind) {
    return '<svg viewBox="0 0 24 24"><path d="' + (HA_PATHS[kind] || HA_PATHS.switch) + '"/></svg>';
  }

  function haConfigured() {
    var c = CONFIG.homeAssistant || {};
    return !!(c.url && c.token);
  }

  function setHaStatus(text, kind) {
    haStatusEl.textContent = text || '';
    haStatusEl.className = kind || '';
  }

  function showHome() {
    setZone('ha');
    haPanel.classList.remove('hidden');
    haGrid.innerHTML = '';
    haTiles = [];
    haFocus = -1;
    clearInterval(haTimer);
    haTimer = null;
    setHaStatus('');

    if (!haConfigured()) {
      haGrid.innerHTML = '<div class="haEmpty">' +
        '<div class="haEmptyTitle">Conecta Home Assistant</div>' +
        '<div class="haEmptyText">Abre <b>config.js</b> y rellena <b>homeAssistant.url</b> y ' +
        '<b>homeAssistant.token</b> con la dirección de tu Home Assistant y un token de larga duración.</div>' +
        '<div class="haEmptyHint">Rellena <b>homeAssistant.url</b> en config.js</div></div>';
      return;
    }

    buildHaTiles();
    if (!haTiles.length) return;
    setHaStatus('Conectando…', '');
    loadHa();
    haTimer = setInterval(loadHa, 5000);
  }

  function hideHome() {
    haPanel.classList.add('hidden');
    clearInterval(haTimer);
    haTimer = null;
    haTiles = [];
    haFocus = -1;
    zone = 'none';
    focusPill(0);
  }

  function buildHaTiles() {
    haGrid.innerHTML = '';
    haTiles = [];
    haFocus = -1;
    var list = (CONFIG.homeAssistant && CONFIG.homeAssistant.entities) || [];
    if (!list.length) {
      haGrid.innerHTML = '<div class="haEmpty"><div class="haEmptyText">Añade tus dispositivos en ' +
        '<b>config.js</b> → <b>homeAssistant.entities</b>.</div></div>';
      return;
    }
    list.forEach(function (e) {
      if (!e || !e.entity) return;
      var kind = e.kind || e.entity.split('.')[0];
      var idx = haTiles.length;
      var el = document.createElement('div');
      el.className = 'haTile';
      el.innerHTML = '<div class="haIcon">' + haIcon(kind) + '</div>' +
        '<div class="haInfo"><div class="haName"></div><div class="haState">—</div></div>';
      var nameEl = el.querySelector('.haName');
      nameEl.textContent = e.name || e.entity;
      el.addEventListener('mouseover', function () { focusHa(idx); });
      el.addEventListener('click', function () { toggleHa(idx); });
      haGrid.appendChild(el);
      haTiles.push({
        el: el,
        entity: e.entity,
        kind: kind,
        customName: !!e.name,
        nameEl: nameEl,
        stateEl: el.querySelector('.haState'),
        state: null
      });
    });
    if (haTiles.length) focusHa(0);
  }

  function focusHa(i) {
    if (i < 0 || i >= haTiles.length) return;
    if (haTiles[haFocus]) haTiles[haFocus].el.classList.remove('focused');
    haFocus = i;
    haTiles[i].el.classList.add('focused');
  }

  function haMove(dc, dr) {
    if (!haTiles.length) return;
    var col = haFocus % HA_COLS, row = Math.floor(haFocus / HA_COLS);
    var maxRow = Math.floor((haTiles.length - 1) / HA_COLS);
    var nc = Math.max(0, Math.min(HA_COLS - 1, col + dc));
    var nr = Math.max(0, Math.min(maxRow, row + dr));
    var idx = nr * HA_COLS + nc;
    if (idx >= haTiles.length) idx = haTiles.length - 1;
    focusHa(idx);
  }

  function loadHa() {
    if (!haConfigured() || !haTiles.length) return;
    var pending = haTiles.length, ok = 0, lastErr = null;
    haTiles.forEach(function (t) {
      haRequest('/api/states/' + encodeURIComponent(t.entity), 'GET', null, function (out, err) {
        if (out) {
          try {
            var s = JSON.parse(out);
            if (s && s.entity_id) { updateHaTile(t, s); ok++; }
          } catch (e) { /* ignore this entity */ }
        } else {
          lastErr = err;
        }
        if (--pending === 0) {
          if (ok) setHaStatus('Conectado', 'ok');
          else setHaStatus(lastErr || 'Sin conexión', 'bad');
        }
      });
    });
  }

  function updateHaTile(t, s) {
    if (!s) {
      t.stateEl.textContent = 'No encontrada';
      t.el.classList.add('unavailable');
      t.el.classList.remove('on');
      return;
    }
    t.el.classList.remove('unavailable');
    t.state = s.state;
    var a = s.attributes || {};
    if (!t.customName && a.friendly_name) t.nameEl.textContent = a.friendly_name;
    t.stateEl.textContent = haStateText(t, s);
    t.el.classList.toggle('on', s.state === 'on' || s.state === 'playing' || s.state === 'home');
  }

  function haStateText(t, s) {
    var a = s.attributes || {};
    if (t.kind === 'sensor') return s.state + (a.unit_of_measurement ? ' ' + a.unit_of_measurement : '');
    if (t.kind === 'binary_sensor') {
      if (a.device_class === 'problem') return s.state === 'on' ? 'Problema' : 'OK';
      if (s.state === 'on') return 'Activo';
      if (s.state === 'off') return 'Inactivo';
      return s.state;
    }
    if (t.kind === 'light') {
      if (s.state === 'off') return 'Apagada';
      if (s.state === 'on') {
        return 'Encendida' + (a.brightness != null ? ' · ' + Math.round(a.brightness / 255 * 100) + '%' : '');
      }
      return s.state;
    }
    if (t.kind === 'climate') {
      return s.state + (a.current_temperature != null ? ' · ' + a.current_temperature + '°' : '');
    }
    if (t.kind === 'media_player') {
      if (s.state === 'playing') return 'Reproduciendo' + (a.media_title ? ' · ' + a.media_title : '');
      if (s.state === 'paused') return 'En pausa';
      if (s.state === 'off') return 'Apagado';
      return s.state;
    }
    if (t.kind === 'scene' || t.kind === 'script') return 'OK para activar';
    if (t.kind === 'cover') {
      if (s.state === 'open') return 'Abierta';
      if (s.state === 'closed') return 'Cerrada';
      return s.state;
    }
    if (s.state === 'on') return 'Encendido';
    if (s.state === 'off') return 'Apagado';
    return s.state;
  }

  function toggleHa(i) {
    var t = haTiles[i];
    if (!t) return;
    if (!haConfigured()) { toast('Configura Home Assistant en config.js'); return; }
    var domain = t.entity.split('.')[0];
    if (domain === 'sensor' || domain === 'binary_sensor' || domain === 'weather' ||
        domain === 'person' || domain === 'device_tracker' || domain === 'sun') {
      toast('Sensor de solo lectura');
      return;
    }
    var service;
    if (domain === 'scene') service = 'scene/turn_on';
    else if (domain === 'script') service = 'script/turn_on';
    else if (domain === 'button') service = 'button/press';
    else if (domain === 'automation') service = 'automation/toggle';
    else if (domain === 'lock') service = (t.state === 'locked') ? 'lock/unlock' : 'lock/lock';
    else if (domain === 'climate') service = (t.state === 'off') ? 'climate/turn_on' : 'climate/turn_off';
    else service = domain + '/toggle';

    toast('Enviando…');
    haRequest('/api/services/' + service, 'POST', { entity_id: t.entity }, function (out, err) {
      if (!out) { toast(err || 'No se pudo conectar'); return; }
      setTimeout(loadHa, 700);
    });
  }

  function haRequest(path, method, body, cb) {
    var cfg = CONFIG.homeAssistant || {};
    var base = String(cfg.url || '').replace(/\/+$/, '');
    var token = String(cfg.token || '').replace(/'/g, "'\\''");
    if (!base || !token) { cb(null, 'Falta configurar Home Assistant'); return; }

    var cmd = 'curl -s -m 8 ';
    if (/^https:/i.test(base)) cmd += '-k ';
    cmd += '-H \'Authorization: Bearer ' + token + '\' -H \'Content-Type: application/json\'';
    if (method === 'POST') {
      cmd += ' -X POST -d \'' + JSON.stringify(body || {}).replace(/'/g, "'\\''") + '\'';
    }
    cmd += ' \'' + (base + path).replace(/'/g, "'\\''") + '\'';

    execRoot(cmd, function (out, res) {
      if (res && res.returnValue === false) { cb(null, 'No se pudo ejecutar en la TV'); return; }
      if (!out) { cb(null, 'Home Assistant no responde'); return; }
      var json = null;
      try { json = JSON.parse(out); } catch (e) { /* not JSON */ }
      if (json && json.message) { cb(null, json.message); return; }
      cb(out, null);
    });
  }

  // ---- rearranging ---------------------------------------------------------------------------

  /** Hold OK on a tile: it wiggles, the arrows move it, OK places it, Back puts everything back. */
  function startEdit() {
    var it = items[focused];
    if (!it) return;
    editing = { item: it, snapshot: items.slice() };
    it.el.classList.add('moving');
    document.body.classList.add('editing');
    toast('Flechas para mover  ·  OK para colocar  ·  Atrás para cancelar');
  }

  function moveTo(to) {
    if (to < 0 || to >= items.length || to === focused) return;
    items.splice(to, 0, items.splice(focused, 1)[0]);
    focused = to;
    layout();
    focusTile(to);
  }

  function finishEdit(keep) {
    var it = editing.item;
    if (!keep) {
      items = editing.snapshot;
      layout();
    }
    editing = null;
    it.el.classList.remove('moving');
    document.body.classList.remove('editing');
    if (keep) saveOrder();
    focused = items.indexOf(it);
    focusTile(focused);
  }

  // ---- keys ----------------------------------------------------------------------------------

  var LONG_PRESS_MS = 600;
  var okDown = false, okTimer = null;

  // Five Back presses in a row summon the Cercanías Madrid train.
  var BACK_SEQUENCE_MS = 3000;
  var backPresses = 0, backStarted = 0;
  var trainTimer = null;

  function resetBackSequence() {
    backPresses = 0;
    backStarted = 0;
  }

  function noteBackPress() {
    var now = Date.now();
    if (!backPresses || now - backStarted > BACK_SEQUENCE_MS) {
      backPresses = 0;
      backStarted = now;
    }
    backPresses++;
    if (backPresses < 5) return false;
    resetBackSequence();
    playTrain();
    return true;
  }

  function playTrain() {
    if (!trainEl) return;
    // The train runs over the first visible row of app tiles, so it still
    // looks right if the grid is scrolled.
    var row = 0;
    var rows = Math.ceil(items.length / COLUMNS);
    while (row < rows - 1 && tileTop(row * COLUMNS) - offset + TILE_H < VIEW_TOP) row++;
    var top = tileTop(row * COLUMNS) + TILE_H / 2 - offset - 75;
    trainEl.style.top = Math.max(8, Math.min(1080 - 150 - 8, top)) + 'px';

    // A timer (rather than a CSS animation) is used because it is reliable on
    // older webOS webviews; it only runs for the five seconds of the egg.
    if (trainTimer) clearInterval(trainTimer);
    trainEl.classList.add('running');
    trainEl.style.opacity = '1';
    trainEl.style.transform = 'translateX(-1500px)';
    var started = Date.now();
    trainTimer = setInterval(function () {
      var t = Math.min(1, (Date.now() - started) / 5200);
      trainEl.style.transform = 'translateX(' + (-1500 + 3600 * t) + 'px)';
      if (t < 1) return;
      clearInterval(trainTimer);
      trainTimer = null;
      trainEl.classList.remove('running');
      trainEl.style.opacity = '0';
    }, 16);
  }

  // On tiles OK acts on release, so a held OK can start rearranging instead of opening the app.
  document.addEventListener('keyup', function (e) {
    if (e.keyCode !== KEY.OK) return;
    okDown = false;
    if (!okTimer) return;
    clearTimeout(okTimer);
    okTimer = null;
    var it = items[focused];
    if (zone === 'grid' && it && !editing) {
      if (it.app.id === CONFIG.liveTvApp) showAntenna();
      else launch(it.app.id, it.app.title);
    }
  });

  document.addEventListener('keydown', function (e) {
    var k = e.keyCode;
    if (k === KEY.BACK && e.repeat) { e.preventDefault(); return; }
    if (k !== KEY.BACK) resetBackSequence();
    if (k === KEY.BACK) {
      if (editing || zone === 'inputs' || zone === 'ha' || zone === 'antenna') {
        resetBackSequence();   // this Back closes/undos something, so it doesn't count
      } else if (noteBackPress()) {
        e.preventDefault();
        return;
      }
    }
    if (k === KEY.OK && okDown) { e.preventDefault(); return; }   // key repeat while held
    if (k === KEY.OK) okDown = true;
    if (editing) {
      if (k === KEY.LEFT) moveTo(focused - 1);
      else if (k === KEY.RIGHT) moveTo(focused + 1);
      else if (k === KEY.UP) moveTo(focused - COLUMNS);
      else if (k === KEY.DOWN) moveTo(Math.min(focused + COLUMNS, items.length - 1));
      else if (k === KEY.OK) finishEdit(true);
      else if (k === KEY.BACK || k === KEY.ESC) finishEdit(false);
      else return;
    } else if (zone === 'inputs') {
      if (k === KEY.UP) focusInput(inputFocus - 1);
      else if (k === KEY.DOWN) focusInput(inputFocus + 1);
      else if (k === KEY.OK) { var row = inputRows[inputFocus]; hideInputs(); launch(row.appId, row.label); }
      else if (k === KEY.BACK || k === KEY.ESC || k === KEY.LEFT || k === KEY.RIGHT) hideInputs();
      else return;
    } else if (zone === 'ha') {
      if (k === KEY.LEFT) haMove(-1, 0);
      else if (k === KEY.RIGHT) haMove(1, 0);
      else if (k === KEY.UP) haMove(0, -1);
      else if (k === KEY.DOWN) haMove(0, 1);
      else if (k === KEY.OK) toggleHa(haFocus);
      else if (k === KEY.BACK || k === KEY.ESC) hideHome();
      else return;
    } else if (zone === 'antenna') {
      if (k === KEY.LEFT) { if (antennaFocus > 0) focusAntenna(antennaFocus - 1); }
      else if (k === KEY.RIGHT) {
        if (antennaFocus < antennaChannels.length - 1) focusAntenna(antennaFocus + 1);
      }
      else if (k === KEY.OK) tuneAntenna(antennaFocus);
      else if (k === KEY.BACK || k === KEY.ESC) hideAntenna();
      else if (k >= 49 && k <= 56) tuneAntenna(k - 49);
      else if (k >= 97 && k <= 104) tuneAntenna(k - 97);
      else return;
    } else if (zone === 'top') {
      if (k === KEY.LEFT) focusPill(pillFocus - 1);
      else if (k === KEY.RIGHT) focusPill(pillFocus + 1);
      else if (k === KEY.DOWN) focusTile(rowOf(focused) === 0 ? focused : 0);
      else if (k === KEY.OK) activatePill(pillFocus);
      else if (k === KEY.BACK) { /* home screen: Back goes nowhere */ }
      else return;
    } else {
      var col = focused % COLUMNS, last = items.length - 1;
      if (k === KEY.LEFT) { if (col > 0) focusTile(focused - 1); }
      else if (k === KEY.RIGHT) { if (col < COLUMNS - 1 && focused < last) focusTile(focused + 1); }
      else if (k === KEY.UP) {
        if (rowOf(focused) === 0) focusPill(pillAbove(focused));
        else focusTile(focused - COLUMNS);
      } else if (k === KEY.DOWN) {
        if (rowOf(focused) < rowOf(last)) focusTile(Math.min(focused + COLUMNS, last));
      } else if (k === KEY.OK) {
        okTimer = setTimeout(function () { okTimer = null; startEdit(); }, LONG_PRESS_MS);
      } else if (k === KEY.BACK) { /* home screen: Back goes nowhere */ }
      else return;
    }
    e.preventDefault();
  });

  pills.forEach(function (p, i) {
    p.addEventListener('mouseover', function () { if (zone !== 'inputs' && zone !== 'antenna') focusPill(i); });
    p.addEventListener('click', function () { activatePill(i); });
  });

  // ---- lifecycle -----------------------------------------------------------------------------

  /** Returns the coastal scene phase for the current hour. */
  function coastPhaseForNow() {
    var schedule = CONFIG.coastSchedule || [];
    var h = new Date().getHours();
    for (var i = 0; i < schedule.length; i++) {
      var slot = schedule[i];
      if (!slot || !slot.phase) continue;
      var from = slot.from == null ? 0 : Number(slot.from);
      var to = slot.to == null ? 24 : Number(slot.to);
      if (from === to) continue;
      // from > to means the slot crosses midnight (for example 20 -> 5).
      if (from < to ? (h >= from && h < to) : (h >= from || h < to)) return slot.phase;
    }
    return 'day';
  }

  /** Picks CONFIG.wallpaper: scheduled photos, fixed path, random, or the coastal fallback. */
  function wallpaperForNow() {
    var wp = CONFIG.wallpaper;
    if (wp === 'coast') return null;
    if (wp === 'auto') {
      var schedule = CONFIG.wallpaperSchedule || [];
      var h = new Date().getHours();
      for (var i = 0; i < schedule.length; i++) {
        var slot = schedule[i];
        if (!slot || !slot.image) continue;
        var from = slot.from == null ? 0 : Number(slot.from);
        var to = slot.to == null ? 24 : Number(slot.to);
        if (from === to) continue;
        // from > to means the slot crosses midnight (for example 20 -> 5).
        if (from < to ? (h >= from && h < to) : (h >= from || h < to)) return slot.image;
      }
      return null;
    }
    if (wp === 'random') {
      var list = CONFIG.wallpapers || [];
      if (!randomWallpaper && list.length) {
        randomWallpaper = list[Math.floor(Math.random() * list.length)];
      }
      return randomWallpaper;
    }
    return wp || null;
  }

  function crossfadeMs() {
    var ms = Number(CONFIG.wallpaperCrossfadeMs);
    return ms > 0 ? ms : 1600;
  }

  /** Swaps the two wallpaper layers; the incoming photo is loaded before the fade starts. */
  function setWallpaper(image) {
    if (image === wallpaperName) return;
    var ms = crossfadeMs();

    if (!image) {
      if (!wallpaperName) return;
      wallpaperName = '';
      wallpaperLayers.forEach(function (layer) {
        layer.style.transition = 'opacity ' + ms + 'ms ease';
        layer.style.opacity = '0';
      });
      return;
    }

    if (!wallpaperName) {
      // First wallpaper: show it instantly, without a fade from black.
      var first = wallpaperLayers[0];
      first.style.transition = 'none';
      first.style.backgroundImage = 'url("' + image + '")';
      first.style.opacity = '1';
      wallpaperLayers[1].style.opacity = '0';
      first.offsetWidth;
      first.style.transition = '';
      wallpaperFront = 0;
      wallpaperName = image;
      return;
    }

    var incoming = wallpaperLayers[1 - wallpaperFront];
    var preload = new Image();
    preload.onload = function () {
      incoming.style.transition = 'opacity ' + ms + 'ms ease';
      incoming.style.backgroundImage = 'url("' + image + '")';
      incoming.style.opacity = '1';
      wallpaperLayers[wallpaperFront].style.opacity = '0';
      wallpaperFront = 1 - wallpaperFront;
      wallpaperName = image;
    };
    preload.onerror = function () { /* keep the current wallpaper */ };
    preload.src = image;
  }

  function applyWallpaper() {
    if (CONFIG.wallpaper === 'coast') {
      document.body.classList.remove('photo-wallpaper');
      var phase = coastPhaseForNow();
      if (document.body.getAttribute('data-phase') !== phase) {
        document.body.setAttribute('data-phase', phase);
      }
      setWallpaper(null);
      return;
    }

    // Any non-coast value uses the photo layers (or black if wallpaper is null).
    document.body.classList.add('photo-wallpaper');
    setWallpaper(wallpaperForNow());
  }

  /** Back from another app (or opened again from the shortcut): replay the entrance, keep the tile. */
  function resume() {
    if (editing) finishEdit(false);
    resetBackSequence();
    updateClock();
    applyWallpaper();
    if (zone === 'ha') hideHome();
    if (zone === 'inputs') panel.classList.add('hidden');
    if (zone === 'antenna') hideAntenna();
    loadWeather();
    pills.forEach(function (p) { p.classList.remove('focused'); });
    zone = 'none';
    animateIn();
    focusTile(focused);
  }

  document.addEventListener('webOSRelaunch', resume);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) resume(); });

  build();
  // Build the hidden panel once so opening it later only paints the cached cards.
  antennaChannels = baseAntennaChannels();
  renderAntenna();
  applyWallpaper();
  updateClock();
  setInterval(updateClock, 10000);
  setInterval(applyWallpaper, 60 * 1000);
  loadWeather();
  setInterval(loadWeather, 15 * 60 * 1000);
  // Warm the channel list in the background so the Antena TV panel is instant.
  setTimeout(loadAntennaChannels, 1500);
  watchNetwork();
  animateIn();
  zone = 'none';
  focusTile(0);
})();
