// The kitchen world: state, movement, stations, orders, timer, scoring.
// One clear job: the rules of the game. Rendering lives in render.js, input in input.js.

import {
  CHEF, FLOOR, STATIONS, stationById, stationUsePoint, CHOP_SECONDS, GRILL_SECONDS,
  BURN_SECONDS, ORDER_PATIENCE_SECONDS, ORDER_RUSH_PATIENCE_SECONDS, ORDER_SPAWN_SECONDS,
  ORDER_RUSH_SPAWN_SECONDS, SHIFT_SECONDS, MAX_ORDERS, STRIKES_TO_END, RUSH_AT_SECONDS_LEFT,
} from './config.js';
import { INGREDIENTS, RECIPES, makeItem, pickRecipe, newOrder, plateMatchesRecipe, recipeById } from './recipes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_OVER = 4;
export const EVENT_CHOP_DONE = 8;
export const EVENT_GRILL_DONE = 16;
export const EVENT_BURNT = 32;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWorld(seed) {
  const random = mulberry32(seed);
  return {
    seed,
    random,
    screen: SCREEN_TITLE,
    time: 0,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    lost: 0,
    strikes: 0,
    combo: 0,
    bestCombo: 0,
    chef: { x: CHEF.startX, y: CHEF.startY, facing: 1, moving: false },
    held: null, // an item, or { plate: [...] } when carrying the plate
    plate: [], // items on the assembly counter
    grill: [null, null], // { item, progress, burnt } per slot
    chopProgress: 0,
    chopping: null,
    orders: [],
    nextOrderId: 1,
    spawnIn: 1.5,
    rush: false,
    popup: null, // { text, x, y, ttl, color }
    message: null, // hint line under the kitchen
    overReason: '',
    stats: { chopped: 0, grilled: 0, trashed: 0 },
  };
}

export function startShift(world) {
  world.screen = SCREEN_PLAY;
  world.time = 0;
  world.timeLeft = SHIFT_SECONDS;
  world.coins = 0;
  world.served = 0;
  world.lost = 0;
  world.strikes = 0;
  world.combo = 0;
  world.bestCombo = 0;
  world.held = null;
  world.plate = [];
  world.grill = [null, null];
  world.chopProgress = 0;
  world.chopping = null;
  world.orders = [];
  world.nextOrderId = 1;
  world.spawnIn = 1.5;
  world.rush = false;
  world.popup = null;
  world.overReason = '';
  spawnOrder(world);
  spawnOrder(world);
}

function spawnOrder(world) {
  if (world.orders.length >= MAX_ORDERS) return;
  const recipe = pickRecipe(world.random, world.time);
  const patience = world.rush ? ORDER_RUSH_PATIENCE_SECONDS : ORDER_PATIENCE_SECONDS;
  world.orders.push(newOrder(world.nextOrderId, recipe, patience));
  world.nextOrderId += 1;
}

export function nearestStation(world) {
  const { x, y } = world.chef;
  let best = null;
  let bestD = 110;
  for (const s of STATIONS) {
    const p = stationUsePoint(s);
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

function showPopup(world, text, color) {
  world.popup = { text, x: world.chef.x, y: world.chef.y - 44, ttl: 1.4, color: color || '#2e7d32' };
}

function stationBusyMessage(station) {
  if (station.kind === 'bin') return `Take ${INGREDIENTS[station.ingredient].name} (E)`;
  if (station.kind === 'board') return 'Chop: hold E';
  if (station.kind === 'grill') return 'Grill: E to place / take';
  if (station.kind === 'counter') return 'Assembly: E to add / take plate';
  if (station.kind === 'trash') return 'Bin: E to throw away';
  if (station.kind === 'window') return 'Serve: E to hand over';
  return '';
}

// The one interaction: what E (or a click) does at the station nearest the chef.
export function interact(world) {
  const station = nearestStation(world);
  if (!station) return 0;
  const held = world.held;
  const carryingPlate = held && held.plate !== undefined;

  if (station.kind === 'bin') {
    if (carryingPlate) { showPopup(world, 'Hands full — plate first!', '#c62828'); return 0; }
    if (held) { showPopup(world, 'Hands full!', '#c62828'); return 0; }
    world.held = makeItem(station.ingredient, 'raw');
    world.message = `${INGREDIENTS[station.ingredient].name} in hand — chop it, grill it, or plate it.`;
    return 0;
  }

  if (station.kind === 'board') {
    if (!held || carryingPlate) { showPopup(world, 'Need a raw ingredient to chop', '#c62828'); return 0; }
    if (!INGREDIENTS[held.id].chopped || held.state !== 'raw') {
      showPopup(world, 'Nothing to chop here', '#c62828');
      return 0;
    }
    world.chopping = held;
    world.chopProgress = 0;
    return 0;
  }

  if (station.kind === 'grill') {
    const slot = world.grill.findIndex((g) => g === null);
    if (held && !carryingPlate && held.id === 'patty' && held.state === 'raw' && slot !== -1) {
      world.grill[slot] = { item: held, progress: 0, burnt: false, announced: false };
      world.held = null;
      world.message = 'Patty on the grill — watch it, it burns!';
      return 0;
    }
    const done = world.grill.findIndex((g) => g !== null && g.progress >= 1 && !g.burnt);
    if (!held && done !== -1) {
      world.held = makeItem('patty', 'cooked');
      world.grill[done] = null;
      world.stats.grilled += 1;
      world.message = 'Grilled patty in hand — plate it fast.';
      return 0;
    }
    const burnt = world.grill.findIndex((g) => g !== null && g.burnt);
    if (!held && burnt !== -1) {
      world.held = makeItem('patty', 'raw');
      world.held.burnt = true;
      world.grill[burnt] = null;
      showPopup(world, 'Burnt! Bin it.', '#c62828');
      return 0;
    }
    if (held && !carryingPlate && held.id === 'patty' && held.state === 'raw') {
      showPopup(world, 'Grill is full!', '#c62828');
    } else {
      showPopup(world, 'Only raw patties go on the grill', '#c62828');
    }
    return 0;
  }

  if (station.kind === 'counter') {
    if (carryingPlate) {
      if (world.plate.length > 0) { showPopup(world, 'Counter already has a plate', '#c62828'); return 0; }
      world.plate = held.plate;
      world.held = null;
      return 0;
    }
    if (held) {
      if (held.burnt) { showPopup(world, 'Burnt food never gets plated', '#c62828'); return 0; }
      if (world.plate.length >= 4) { showPopup(world, 'Plate is full!', '#c62828'); return 0; }
      world.plate.push(held);
      world.held = null;
      world.message = `Plated: ${world.plate.map((i) => i.id).join(' + ')}`;
      return 0;
    }
    if (world.plate.length > 0) {
      world.held = { plate: world.plate };
      world.plate = [];
      world.message = 'Plate in hand — serve it at the window!';
      return 0;
    }
    showPopup(world, 'Plate is empty — add food first', '#c62828');
    return 0;
  }

  if (station.kind === 'trash') {
    if (!held) { showPopup(world, 'Nothing to throw away', '#c62828'); return 0; }
    world.held = null;
    world.stats.trashed += 1;
    world.message = 'Tossed. Fresh start.';
    return 0;
  }

  if (station.kind === 'window') {
    if (!carryingPlate) { showPopup(world, 'Bring a plated dish to serve', '#c62828'); return 0; }
    const plate = held.plate;
    const match = world.orders.find((o) => plateMatchesRecipe(plate, recipeById(o.recipeId)));
    world.held = null;
    if (match) {
      const recipe = recipeById(match.recipeId);
      const tip = world.combo >= 2 ? 3 : 0;
      const earned = recipe.coins + tip;
      world.coins += earned;
      world.served += 1;
      world.combo += 1;
      world.bestCombo = Math.max(world.bestCombo, world.combo);
      world.orders = world.orders.filter((o) => o !== match);
      showPopup(world, `Served! +${earned} coins${tip ? ' (combo tip!)' : ''}`, '#2e7d32');
      world.message = `${recipe.name} served — ${world.combo} in a row!`;
      world.spawnIn = Math.min(world.spawnIn, 2);
      return EVENT_SERVED;
    }
    world.coins += 2;
    world.combo = 0;
    showPopup(world, 'No order matches — +2 coins tip', '#e65100');
    world.message = 'Nobody ordered that. Check the board!';
    return EVENT_SERVED;
  }
  return 0;
}

function finishChop(world) {
  if (!world.chopping) return 0;
  world.chopping.state = 'chopped';
  world.stats.chopped += 1;
  world.chopping = null;
  world.chopProgress = 0;
  world.message = 'Chopped! Now plate it or keep building.';
  return EVENT_CHOP_DONE;
}

function endShift(world, reason) {
  world.screen = SCREEN_OVER;
  world.overReason = reason;
  return EVENT_OVER;
}

// One fixed step of the game. `keys` is { up, down, left, right, use } (use = E held).
// `click` is { x, y } in canvas coords or null; clicking a station sets a walk target.
export function stepWorld(world, dt, keys, click) {
  if (world.screen !== SCREEN_PLAY) return 0;
  let events = 0;
  world.time += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.time);
  if (!world.rush && world.timeLeft <= RUSH_AT_SECONDS_LEFT) {
    world.rush = true;
    world.message = 'RUSH HOUR! Orders pour in — keep the line moving!';
  }

  // Orders: patience drains, expired ones cost a strike.
  for (const order of world.orders.slice()) {
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders = world.orders.filter((o) => o !== order);
      world.lost += 1;
      world.strikes += 1;
      world.combo = 0;
      world.coins = Math.max(0, world.coins - 5);
      showPopup(world, 'Order walked out! -5 coins', '#c62828');
      events |= EVENT_EXPIRED;
      if (world.strikes >= STRIKES_TO_END) return endShift(world, 'Too many walk-outs — the dining room emptied.');
    }
  }
  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    spawnOrder(world);
    world.spawnIn = world.rush ? ORDER_RUSH_SPAWN_SECONDS : ORDER_SPAWN_SECONDS;
  }

  // Click-to-move: remember the target; walking toward it.
  if (click) {
    const station = STATIONS.find((s) => click.x >= s.x - 8 && click.x <= s.x + s.w + 8 && click.y >= s.y - 8 && click.y <= s.y + s.h + 8);
    if (station) {
      world.walkTarget = stationUsePoint(station);
      world.walkTargetStation = station;
    } else if (click.y >= FLOOR.y && click.y <= FLOOR.y + FLOOR.height) {
      world.walkTarget = { x: click.x, y: click.y };
      world.walkTargetStation = null;
    }
  }

  // Movement: keys win over a walk target; arriving at a station target interacts.
  const chef = world.chef;
  let mx = 0;
  let my = 0;
  if (keys.left) mx -= 1;
  if (keys.right) mx += 1;
  if (keys.up) my -= 1;
  if (keys.down) my += 1;
  if (mx !== 0 || my !== 0) world.walkTarget = null;
  else if (world.walkTarget) {
    const dx = world.walkTarget.x - chef.x;
    const dy = world.walkTarget.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 10) {
      const station = world.walkTargetStation;
      world.walkTarget = null;
      world.walkTargetStation = null;
      if (station) events |= interact(world);
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }
  const chopping = world.chopping !== null;
  if (mx !== 0 || my !== 0) {
    if (chopping) { world.chopping = null; world.chopProgress = 0; }
    const len = Math.hypot(mx, my) || 1;
    chef.x += (mx / len) * CHEF.speed * dt;
    chef.y += (my / len) * CHEF.speed * dt;
    chef.x = Math.max(FLOOR.x + CHEF.radius, Math.min(FLOOR.x + FLOOR.width - CHEF.radius, chef.x));
    chef.y = Math.max(FLOOR.y + CHEF.radius, Math.min(FLOOR.y + FLOOR.height - CHEF.radius, chef.y));
    chef.facing = mx < 0 ? -1 : mx > 0 ? 1 : chef.facing;
    chef.moving = true;
  } else {
    chef.moving = false;
  }

  // Chopping: hold E at the board while holding a choppable raw item.
  if (keys.use && world.chopping) {
    const board = stationById('board');
    const p = stationUsePoint(board);
    if (Math.hypot(chef.x - p.x, chef.y - p.y) < 110) {
      world.chopProgress += dt / CHOP_SECONDS;
      if (world.chopProgress >= 1) events |= finishChop(world);
    }
  }

  // Grill: patties cook, then burn if left too long.
  for (let i = 0; i < world.grill.length; i += 1) {
    const slot = world.grill[i];
    if (!slot) continue;
    slot.progress += dt / GRILL_SECONDS;
    if (!slot.burnt && slot.progress >= 1 && !slot.announced) {
      slot.announced = true;
      events |= EVENT_GRILL_DONE;
    }
    if (slot.progress >= 1 + BURN_SECONDS / GRILL_SECONDS) {
      slot.burnt = true;
      events |= EVENT_BURNT;
    }
  }

  if (world.popup) {
    world.popup.ttl -= dt;
    if (world.popup.ttl <= 0) world.popup = null;
  }

  const station = nearestStation(world);
  world.hint = station ? stationBusyMessage(station) : 'WASD / arrows to move — E to use a station — click a station to walk there';

  if (world.timeLeft <= 0) return endShift(world, 'Shift complete!');
  return events;
}

export function plateSummary(world) {
  return world.plate.map((i) => i.id).join(', ');
}
