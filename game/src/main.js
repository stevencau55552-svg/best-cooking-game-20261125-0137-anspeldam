// The Copper Ladle — entry point: game loop, screens, sounds, screenshot mode.
// One clear job: wire input + world + rendering together, nothing else.

import { CANVAS } from './config.js';
import { createWorld, startShift, stepWorld, interact, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER, EVENT_SERVED, EVENT_EXPIRED, EVENT_CHOP_DONE, EVENT_GRILL_DONE, EVENT_BURNT } from './kitchen.js';
import { createInput, attachInput, consumeClick } from './input.js';
import { createAudio, playChop, playPickup, playServe, playDing, playBad, playClick, toggleMute } from './audio.js';
import { renderWorld } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS.width;
canvas.height = CANVAS.height;

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 7);
const shotName = params.get('shot');

const world = createWorld(seed);
const input = createInput();
const audio = createAudio();
let pausedForShot = false;

attachInput(input, canvas, () => {
  if (world.screen === SCREEN_PLAY) interact(world);
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyM') {
    const muted = toggleMute(audio);
    world.message = muted ? 'Sound off (M to turn back on).' : 'Sound on.';
  }
  if (event.code === 'Enter' && world.screen === SCREEN_TITLE) {
    playClick(audio);
    startShift(world);
  }
  if (event.code === 'KeyR' && (world.screen === SCREEN_OVER || world.screen === SCREEN_PLAY)) {
    playClick(audio);
    startShift(world);
  }
});

canvas.addEventListener('pointerdown', () => {
  if (world.screen === SCREEN_TITLE) startShift(world);
});

if (shotName) {
  // Screenshot mode: play the real rules forward to a staged frame, then
  // freeze the clock so the frame is stable for the capture.
  stageShot(shotName, world);
  pausedForShot = true;
  world.paused = true;
  renderWorld(ctx, world);
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (world.screen === SCREEN_PLAY) {
      const click = consumeClick(input);
      const events = stepWorld(world, dt, input.keys, click);
      if (events & EVENT_SERVED) playServe(audio);
      if (events & EVENT_EXPIRED) playBad(audio);
      if (events & EVENT_CHOP_DONE) playChop(audio);
      if (events & EVENT_GRILL_DONE) playDing(audio);
      if (events & EVENT_BURNT) playBad(audio);
      if (input.usePressed) playPickup(audio);
    } else {
      consumeClick(input);
    }
    input.usePressed = false;
    renderWorld(ctx, world);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Keep the page title honest about what is running.
document.title = 'The Copper Ladle — a hectic kitchen rush';
