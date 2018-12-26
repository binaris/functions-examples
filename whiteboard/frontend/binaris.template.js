/* eslint-disable key-spacing */
/* eslint-disable no-undef */

/*
 * Fill in the actual Binaris and Pusher credentials and copy 'binaris.template.js' to 'binaris.js'
 */

const BINARIS_ACCOUNT_ID = '%BINARIS_ACCOUNT_ID%';
const PUSHER_KEY         = '%PUSHER_KEY%';
const PUSHER_CLUSTER     = '%PUSHER_CLUSTER%';
const PUSHER_CHANNEL     = 'WHITEBOARD';

const BINARIS_BASE_URL = `https://run-sandbox.binaris.com/v2/run/${BINARIS_ACCOUNT_ID}`;

/**
 * @summary Invokes a Binaris function
 * @param {string} functionName The Binaris function name to be called (see your binaris.yml)
 * @param {Object} [body] JSON-ified and sent as the HTTP body.
 */
async function bn(functionName, body) {
  const options = { method: 'POST' };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const URL = `${BINARIS_BASE_URL}/${functionName}`;
  const resp = await fetch(URL, options);
  return resp.json();
}

/**
 * Sync with the backend (functions with HTTP) and connected boards (Pusher with websockets)
 */
const network = (() => {
  const uuid = uuidv4();
  const message = { uuid, segments: [] };
  const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, encrypted: true });
  const channel = pusher.subscribe(PUSHER_CHANNEL);
  const connectedListeners = [];
  const disconnectedListeners = [];

  let isConnected = false;

  /**
   * Sends the stored segments to the backend, and clear the local buffer.
   */
  function send() {
    bn('public_draw', message);
    message.segments = [];
  }

  /**
   * Groups segments in 50ms for transmission to the backend.
   * @param {Segment} segment
   */
  function coalesce(segment) {
    if (message.segments.length === 0) {
      setTimeout(send, 50);
    }
    message.segments.push(segment);
  }

  /**
   * Add listeners for Pusher websocket connection event (e.g. make canvas visible)
   */
  function onConnected(listener) {
    connectedListeners.push(listener);
  }

  /**
   * Add listeners for Pusher websocket disconnection event (e.g. hide the canvas)
   */
  function onDisconnected(listener) {
    disconnectedListeners.push(listener);
  }

  /**
   * Bind set event listeners (e.g. 'draw', 'clear') to the Pusher Websocket channel.
   */
  function onMessage(event, listener) {
    channel.bind(event, (msg) => {
      if (msg.uuid !== uuid) {
        listener(msg);
      }
    });
  }

  /*
   * Update channel listeners with conenction and disconnection
   */
  channel.bind('pusher:subscription_succeeded', () => {
    if (!isConnected) {
      connectedListeners.forEach(listener => listener());
      isConnected = true;
    }
  });

  pusher.connection.bind('state_change', (states) => {
    if (isConnected && states.current !== 'connected') {
      disconnectedListeners.forEach(listener => listener());
      isConnected = false;
    }
  });

  return { coalesce, onConnected, onDisconnected, onMessage };
})();

/**
 * Set the color buttons ("swatches") at the top bar.
 * @returns {function getLineColor()} That returns the TGB of the currently selected color in RGB hex.
 */
const colorSelector = (() => {
  const COLORS = [
    { black:              '000000' },
    { red:                'FF0000' },
    { 'neon-carrot':      'FF9933' },
    { 'saint-seiya-gold': 'F0F000' },
    { 'delightful-green': '00EE00' },
    { 'aqua-cyan':        '00EEEE' },
    { 'light-royal-blue': '3333FF' },
    { 'piquant-pink':     'EE00EE' },
  ];

  let selectedSwatch;
  let lineColor;
  const colors = document.getElementById('colors');

  /**
   * @summary Selects a swatch (color box) element, and deselects previously seleted swatches.
   * @param {Element} swatch
   */
  function selectSwatch(swatch) {
    if (selectedSwatch) {
      selectedSwatch.classList.remove('selected');
    }
    swatch.classList.add('selected');
    selectedSwatch = swatch;

    const rgb = swatch.style.backgroundColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
      return (`0${parseInt(x, 0).toString(16)}`).slice(-2);
    }
    lineColor = hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
  }

  COLORS.forEach((color) => {
    const swatch = document.createElement('swatch');
    swatch.style.backgroundColor = `#${Object.values(color)[0]}`;
    swatch.addEventListener('click', () => selectSwatch(swatch));
    colors.appendChild(swatch);
    if (!selectedSwatch) {
      selectSwatch(swatch);
    }
  });

  return { getLineColor: () => lineColor };
})();

/**
 * Main drawing canvas functionality.
 */
const drawingCanvas = (() => {
  const canvas = document.getElementById('canvas');
  canvas.setAttribute('width', canvas.offsetWidth);
  canvas.setAttribute('height', canvas.offsetHeight);

  const context = canvas.getContext('2d');
  context.lineWidth = 1;

  const NOWHERE = 0;
  const OUTSIDE = 1;
  const INSIDE = 2;

  let lastX;
  let lastY;
  let where = NOWHERE;

  const drawListeners = [];

  function addDrawListener(listener) {
    drawListeners.push(listener);
  }

  function drawLine(x1, y1, x2, y2, color) {
    context.strokeStyle = `#${color}`;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }

  function draw(x2, y2) {
    const color = colorSelector.getLineColor();
    drawLine(lastX, lastY, x2, y2, color);
    drawListeners.forEach(listener => listener(lastX, lastY, x2, y2, color));
  }

  canvas.addEventListener('mousedown', (ev) => {
    lastX = ev.offsetX;
    lastY = ev.offsetY;
    where = INSIDE;
  });

  canvas.addEventListener('mouseout', (ev) => {
    if (where !== NOWHERE) {
      draw(ev.offsetX, ev.offsetY);
      where = OUTSIDE;
    }
  });

  canvas.addEventListener('mousemove', (ev) => {
    if (where !== NOWHERE) {
      draw(ev.offsetX, ev.offsetY);
      where = INSIDE;
    }
  });

  document.addEventListener('mousemove', (ev) => {
    if (where !== NOWHERE) {
      let x = ev.offsetX;
      let y = ev.offsetY;
      for (let $ = canvas; $ && $ !== ev.target; $ = $.offsetParent) {
        x -= $.offsetLeft;
        y -= $.offsetTop;
      }
      lastX = x;
      lastY = y;
    }
  });

  function release() {
    where = NOWHERE;
  }

  canvas.addEventListener('mouseup', release);
  document.addEventListener('mouseup', release);

  function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function hide() {
    canvas.style.display = 'hidden';
  }

  function show() {
    canvas.style.visibility = 'visible';
  }

  return {
    addDrawListener, clear, drawLine, hide, show,
  };
})();

/**
 * @typedef {Object} Segment
 * @property {number} x1 X coordinate of the first point
 * @property {number} y1 Y coordinate of the first point
 * @property {number} x2 X coordinate of the second point
 * @property {number} y2 Y coordinate of the second point
 */

/**
 * @summary Draw segments on the document canvas.
 * @param {Segment[]} segments An array of segments to be drawn.
 */
function drawSegments(segments) {
  segments.forEach((s) => {
    drawingCanvas.drawLine(s.x1, s.y1, s.x2, s.y2, s.color);
  });
}

/**
 * Initializes netowrk connections and attaches event listeners
 */
async function init() {
  const clearButton = document.getElementById('clearButton');
  const connecting = document.getElementById('connecting');

  clearButton.addEventListener('click', () => bn('public_clear'));

  drawingCanvas.addDrawListener((x1, y1, x2, y2, color) => {
    network.coalesce({
      x1, y1, x2, y2, color,
    });
  });

  network.onConnected(() => {
    connecting.style.display = 'none';
  });

  network.onDisconnected(() => {
    connecting.style.display = 'block';
  });

  network.onMessage('draw', (message) => {
    drawSegments(message.segments);
  });

  network.onMessage('clear', drawingCanvas.clear);

  const segments = await bn('public_get');
  drawSegments(segments);
  drawingCanvas.show();
}

init();
