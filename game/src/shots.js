// Screenshot scenes for The Copper Ladle: ?shot=cover|chop|serve|end.
// One clear job: stage each shot by playing the real rules forward with a
// scripted cook (walk to a station, press E, hold E to chop) — never by
// painting a fake frame. The same seed always gives the same frame.

import { stationById, stationUsePoint } from './config.js';
import { startShift, stepWorld, interact, SCREEN_PLAY, SCREEN_OVER } from './kitchen.js';

const STEP = 1 / 60;

// Walk the chef toward a station's use point until close, then press E once.
function walkTo(world, stationId, keys) {
  const target = stationUsePoint(stationById(stationId));
  for (let i = 0; i < 600; i += 1) {
    const dx = target.x - world.chef.x;
    const dy = target.y - world.chef.y;
    if (Math.hypot(dx, dy) < 24) break;
    keys.left = dx < -8;
    keys.right = dx > 8;
    keys.up = dy < -8;
    keys.down = dy > 8;
    stepWorld(world, STEP, keys, null);
    keys.left = keys.right = keys.up = keys.down = false;
  }
}

function pressE(world, keys) {
  // The bot presses E the same way a player does: interact() is what the
  // keydown handler calls; merely holding keys.use only feeds the chop timer.
  interact(world);
  stepWorld(world, STEP, keys, null);
}

// Hold E at the chopping board until the held item is chopped.
function chopHeld(world, keys) {
  for (let i = 0; i < 300; i += 1) {
    if (!world.chopping) break;
    keys.use = true;
    stepWorld(world, STEP, keys, null);
    keys.use = false;
  }
}

function idle(world, seconds, keys) {
  for (let i = 0; i < seconds / STEP; i += 1) stepWorld(world, STEP, keys, null);
}

function takeFromBin(world, binId, keys) {
  walkTo(world, binId, keys);
  pressE(world, keys);
}

function chopIngredient(world, binId, keys) {
  takeFromBin(world, binId, keys);
  walkTo(world, 'board', keys);
  pressE(world, keys);
  chopHeld(world, keys);
}

function plateHeld(world, keys) {
  walkTo(world, 'counter', keys);
  pressE(world, keys);
}

function grillPatty(world, keys) {
  takeFromBin(world, 'bin-patty', keys);
  walkTo(world, 'grill', keys);
  pressE(world, keys);
  idle(world, 7, keys); // patty cooks (6s) and the grill dings
}

// Stage the cover state through real play: a Copper Burger half-built —
// chopped lettuce and a grilled patty on the plate, a second patty sizzling
// on the grill, the chef carrying a chopped tomato toward the counter.
function stageCoverState(world, keys) {
  chopIngredient(world, 'bin-lettuce', keys);
  plateHeld(world, keys);
  grillPatty(world, keys);
  walkTo(world, 'grill', keys);
  pressE(world, keys); // pick up the grilled patty
  plateHeld(world, keys);
  takeFromBin(world, 'bin-patty', keys);
  walkTo(world, 'grill', keys);
  pressE(world, keys); // second patty on the grill
  chopIngredient(world, 'bin-tomato', keys);
  walkTo(world, 'counter', keys); // chef waits by the counter, tomato in hand
}

// The full serve: build the cover state, bin the stray tomato, finish the
// burger with bread, take the plate and hand it over at the window.
function serveBurger(world, keys) {
  stageCoverState(world, keys);
  // Wait until a Copper Burger ticket is actually on the board, so the
  // serve pays full price instead of a consolation tip.
  for (let waited = 0; waited < 45; waited += 5) {
    if (world.orders.some((o) => o.recipeId === 'burger')) break;
    idle(world, 5, keys);
  }
  // The tomato does not belong in the burger: bin it, add bread, serve.
  walkTo(world, 'trash', keys);
  pressE(world, keys);
  takeFromBin(world, 'bin-bread', keys);
  plateHeld(world, keys);
  walkTo(world, 'counter', keys);
  pressE(world, keys); // take the plate
  walkTo(world, 'window', keys);
  pressE(world, keys); // serve!
}

/**
 * Set `world` to the named scene and return the screen to draw.
 * cover: burger mid-assembly, patty on the grill, tickets live.
 * chop: chef mid-chop at the board, tomato in hand.
 * serve: the finished burger served at the window, coins popping.
 * end: a served burger, then the shift-over screen.
 */
export function stageShot(name, world) {
  const keys = { up: false, down: false, left: false, right: false, use: false };
  startShift(world);
  if (name === 'chop') {
    takeFromBin(world, 'bin-tomato', keys);
    walkTo(world, 'board', keys);
    pressE(world, keys);
    keys.use = true;
    for (let i = 0; i < 30; i += 1) stepWorld(world, STEP, keys, null);
    keys.use = false;
    world.screen = SCREEN_PLAY;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'serve') {
    serveBurger(world, keys);
    world.screen = SCREEN_PLAY;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'end') {
    serveBurger(world, keys);
    world.time = 149;
    world.timeLeft = 1;
    idle(world, 2, keys);
    world.screen = SCREEN_OVER;
    return { screen: SCREEN_OVER };
  }
  // cover (default): dish mid-assembly, grill hot, tickets ticking.
  stageCoverState(world, keys);
  world.screen = SCREEN_PLAY;
  return { screen: SCREEN_PLAY };
}
