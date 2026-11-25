// The Copper Ladle — kitchen configuration: canvas, timings, colours, stations.
// One clear job: every number that tunes the game lives here, nothing else.

export const CANVAS = { width: 1280, height: 800 };

export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 3;
export const STRIKES_TO_END = 3;
export const RUSH_AT_SECONDS_LEFT = 60;

export const CHEF = {
  radius: 22,
  speed: 250,
  startX: 560,
  startY: 560,
};

export const CHOP_SECONDS = 1.1;
export const GRILL_SECONDS = 6;
export const BURN_SECONDS = 5;
export const ORDER_PATIENCE_SECONDS = 48;
export const ORDER_RUSH_PATIENCE_SECONDS = 36;
export const ORDER_SPAWN_SECONDS = 9;
export const ORDER_RUSH_SPAWN_SECONDS = 6;

export const COLORS = {
  floorA: '#e8cfa8',
  floorB: '#dfc294',
  wall: '#8a5a3b',
  wallTop: '#a06b45',
  counterTop: '#f4ead6',
  counterFront: '#b07a4f',
  steel: '#c9ced6',
  steelDark: '#9aa1ad',
  board: '#fff8e7',
  boardInk: '#3a2a1a',
  ticket: '#fffdf5',
  ticketEdge: '#e0c98f',
  chefHat: '#ffffff',
  chefShirt: '#3f7d5c',
  chefSkin: '#f2c89b',
  chefPants: '#33415c',
  timerGood: '#2e7d32',
  timerWarn: '#e65100',
  timerBad: '#c62828',
  gold: '#f2b705',
  plate: '#ffffff',
};

// Kitchen floor the chef can walk on (stations sit on the edges, outside this rect).
export const FLOOR = { x: 24, y: 150, width: 900, height: 610 };

// Stations: id, label, kind, rect, and the verb shown in the hint bar.
export const STATIONS = [
  { id: 'bin-tomato', label: 'Tomato', kind: 'bin', ingredient: 'tomato', x: 40, y: 84, w: 120, h: 52 },
  { id: 'bin-lettuce', label: 'Lettuce', kind: 'bin', ingredient: 'lettuce', x: 176, y: 84, w: 120, h: 52 },
  { id: 'bin-bread', label: 'Bread', kind: 'bin', ingredient: 'bread', x: 312, y: 84, w: 120, h: 52 },
  { id: 'bin-cheese', label: 'Cheese', kind: 'bin', ingredient: 'cheese', x: 448, y: 84, w: 120, h: 52 },
  { id: 'bin-patty', label: 'Patty', kind: 'bin', ingredient: 'patty', x: 584, y: 84, w: 120, h: 52 },
  { id: 'bin-onion', label: 'Onion', kind: 'bin', ingredient: 'onion', x: 720, y: 84, w: 120, h: 52 },
  { id: 'board', label: 'Chopping Board', kind: 'board', x: 40, y: 700, w: 200, h: 56 },
  { id: 'grill', label: 'Grill', kind: 'grill', x: 280, y: 700, w: 220, h: 56 },
  { id: 'counter', label: 'Assembly Counter', kind: 'counter', x: 540, y: 700, w: 220, h: 56 },
  { id: 'trash', label: 'Bin', kind: 'trash', x: 800, y: 700, w: 96, h: 56 },
  { id: 'window', label: 'Serving Window', kind: 'window', x: 948, y: 600, w: 308, h: 120 },
];

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

// Where the chef stands to use a station (a point just in front of it).
export function stationUsePoint(station) {
  if (station.kind === 'bin') return { x: station.x + station.w / 2, y: station.y + station.h + 34 };
  if (station.kind === 'window') return { x: station.x - 36, y: station.y + station.h / 2 };
  return { x: station.x + station.w / 2, y: station.y - 34 };
}

export function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}
