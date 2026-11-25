// Canvas rendering for The Copper Ladle: kitchen, chef, food, order board, HUD.
// One clear job: draw the world. No game rules live here.

import { CANVAS, COLORS, FLOOR, STATIONS, stationById, stationCenter, stationUsePoint } from './config.js';
import { INGREDIENTS, itemLabel, recipeById } from './recipes.js';
import { SCREEN_TITLE, SCREEN_OVER, nearestStation } from './kitchen.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

// Draw one ingredient as a chunky, readable icon (no images — all vector).
export function drawIngredient(ctx, id, state, x, y, size) {
  const ing = INGREDIENTS[id];
  const r = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'tomato') {
    ctx.fillStyle = state === 'chopped' ? '#f26d5f' : ing.color;
    ctx.beginPath();
    if (state === 'chopped') {
      ctx.moveTo(-r, 0);
      ctx.lineTo(0, -r * 0.9);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, r * 0.9);
      ctx.closePath();
    } else {
      ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.arc(0, -r * 0.85, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(-r * 0.45 + i * r * 0.45, (i % 2) * r * 0.2, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.7, 0.3, Math.PI - 0.3);
    ctx.stroke();
  } else if (id === 'bread') {
    ctx.fillStyle = '#d98e32';
    roundRect(ctx, -r, -r * 0.7, r * 2, r * 1.4, r * 0.5);
    ctx.fill();
    ctx.fillStyle = ing.color;
    roundRect(ctx, -r * 0.82, -r * 0.5, r * 1.64, r, r * 0.4);
    ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(r, r * 0.6);
    ctx.lineTo(r * 0.7, -r * 0.6);
    ctx.lineTo(-r * 0.4, -r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e65100';
    for (const [hx, hy] of [[-0.3, 0.1], [0.3, 0.25], [0.1, -0.3]]) {
      ctx.beginPath();
      ctx.arc(hx * r, hy * r, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = state === 'cooked' ? '#6d3b1f' : '#a86a42';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = state === 'cooked' ? '#4e2812' : '#7c4a26';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.5 - r * 0.3, -r * 0.3);
      ctx.lineTo(i * r * 0.5 + r * 0.3, r * 0.3);
      ctx.stroke();
    }
  } else if (id === 'onion') {
    ctx.fillStyle = '#efe3f2';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b39ddb';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.55 - i * 0.16), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#7cb342';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.lineTo(r * 0.18, -r * 1.15);
    ctx.lineTo(-r * 0.18, -r * 1.15);
    ctx.closePath();
    ctx.fill();
  }
  if (state === 'chopped' && id !== 'tomato') {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.4);
    ctx.lineTo(r * 0.5, r * 0.4);
    ctx.moveTo(r * 0.5, -r * 0.4);
    ctx.lineTo(-r * 0.5, r * 0.4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlate(ctx, items, x, y, size) {
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d7ccc8';
  ctx.lineWidth = 2;
  ctx.stroke();
  const n = items.length;
  items.forEach((item, i) => {
    const ox = n === 1 ? 0 : (i - (n - 1) / 2) * size * 0.55;
    drawIngredient(ctx, item.id, item.state, x + ox, y - size * 0.22, size * 0.62);
  });
}

function drawStation(ctx, station, world) {
  const { x, y, w, h } = station;
  const near = world.screen === 'play' && nearestStation(world) === station;
  ctx.save();
  if (station.kind === 'bin') {
    ctx.fillStyle = near ? '#ffe082' : '#8d6e63';
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 10);
    ctx.fill();
    ctx.fillStyle = COLORS.counterTop;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    drawIngredient(ctx, station.ingredient, 'raw', x + 26, y + h / 2, 34);
    text(ctx, station.label, x + 48, y + h / 2 + 6, 17, COLORS.boardInk);
  } else if (station.kind === 'board') {
    ctx.fillStyle = near ? '#ffe082' : '#a1887f';
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 10);
    ctx.fill();
    ctx.fillStyle = '#f5e6c8';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    text(ctx, '🔪 Chopping', x + 14, y + 34, 17, COLORS.boardInk);
    if (world.chopping) {
      const p = world.chopProgress;
      ctx.fillStyle = '#e0e0e0';
      roundRect(ctx, x + 14, y + 40, w - 28, 10, 5);
      ctx.fill();
      ctx.fillStyle = '#66bb6a';
      roundRect(ctx, x + 14, y + 40, (w - 28) * p, 10, 5);
      ctx.fill();
      drawIngredient(ctx, world.chopping.id, 'raw', x + w - 22, y + 20, 26);
    }
  } else if (station.kind === 'grill') {
    ctx.fillStyle = near ? '#ffe082' : '#616161';
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 10);
    ctx.fill();
    ctx.fillStyle = '#37474f';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = '#90a4ae';
    ctx.lineWidth = 3;
    for (let i = 1; i < 6; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + (w / 6) * i, y + 8);
      ctx.lineTo(x + (w / 6) * i, y + h - 8);
      ctx.stroke();
    }
    world.grill.forEach((slot, i) => {
      if (!slot) return;
      const sx = x + 55 + i * 100;
      drawIngredient(ctx, 'patty', slot.burnt ? 'raw' : slot.progress >= 1 ? 'cooked' : 'raw', sx, y + 22, 36);
      ctx.fillStyle = slot.burnt ? '#c62828' : slot.progress >= 1 ? '#66bb6a' : '#ff9800';
      roundRect(ctx, sx - 24, y + 40, 48, 8, 4);
      ctx.fill();
      if (slot.progress < 1) {
        ctx.fillStyle = '#ff9800';
        roundRect(ctx, sx - 24, y + 40, 48 * slot.progress, 8, 4);
        ctx.fill();
      }
      if (slot.burnt) text(ctx, 'BURNT!', sx, y + 16, 12, '#ff5252', 'center');
    });
    ctx.fillStyle = '#5d4037';
    roundRect(ctx, x + 8, y - 26, 62, 20, 8);
    ctx.fill();
    text(ctx, '🔥 Grill', x + 39, y - 11, 14, '#fff', 'center');
    // (label on a dark pill above the station so it stays readable)
  } else if (station.kind === 'counter') {
    ctx.fillStyle = near ? '#ffe082' : COLORS.counterFront;
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 10);
    ctx.fill();
    ctx.fillStyle = COLORS.counterTop;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    if (world.plate.length > 0) {
      drawPlate(ctx, world.plate, x + w / 2, y + h / 2 + 4, 44);
    } else {
      ctx.strokeStyle = '#bcaaa4';
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2 + 4, 44, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'plate goes here', x + w / 2, y + h / 2 + 8, 13, '#a1887f', 'center');
    }
    ctx.fillStyle = '#5d4037';
    roundRect(ctx, x + w / 2 - 78, y - 26, 156, 20, 8);
    ctx.fill();
    text(ctx, 'Assembly Counter', x + w / 2, y - 11, 14, '#fff', 'center');
  } else if (station.kind === 'trash') {
    ctx.fillStyle = near ? '#ffe082' : '#78909c';
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 10);
    ctx.fill();
    ctx.fillStyle = '#546e7a';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    text(ctx, '🗑 Bin', x + w / 2, y + 34, 17, '#fff', 'center');
  } else if (station.kind === 'window') {
    ctx.fillStyle = near ? '#ffe082' : '#5d4037';
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 12);
    ctx.fill();
    ctx.fillStyle = '#3e2723';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = '#ffecb3';
    roundRect(ctx, x + 10, y + 10, w - 20, 34, 8);
    ctx.fill();
    text(ctx, '🍽 SERVING WINDOW', x + w / 2, y + 33, 18, '#5d4037', 'center');
    ctx.fillStyle = '#8d6e63';
    roundRect(ctx, x + 10, y + 54, w - 20, h - 64, 8);
    ctx.fill();
    text(ctx, 'Serve dishes here (E) — match the ticket!', x + w / 2, y + 92, 14, '#d7ccc8', 'center');
  }
  ctx.restore();
}

function drawChef(ctx, world) {
  const { x, y } = world.chef;
  const bob = world.chef.moving ? Math.sin(world.time * 14) * 3 : 0;
  ctx.save();
  ctx.translate(x, y + bob);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 26 - bob, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  ctx.fillStyle = COLORS.chefShirt;
  roundRect(ctx, -18, -6, 36, 30, 10);
  ctx.fill();
  // apron
  ctx.fillStyle = '#fff';
  roundRect(ctx, -12, 2, 24, 20, 6);
  ctx.fill();
  // head
  ctx.fillStyle = COLORS.chefSkin;
  ctx.beginPath();
  ctx.arc(0, -18, 15, 0, Math.PI * 2);
  ctx.fill();
  // toque
  ctx.fillStyle = COLORS.chefHat;
  ctx.beginPath();
  ctx.arc(-8, -32, 9, 0, Math.PI * 2);
  ctx.arc(0, -36, 10, 0, Math.PI * 2);
  ctx.arc(8, -32, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-14, -32, 28, 7);
  // face
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath();
  ctx.arc(-5 * world.chef.facing, -18, 2, 0, Math.PI * 2);
  ctx.arc(5 * world.chef.facing, -18, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -13, 5, 0.2, Math.PI - 0.2);
  ctx.stroke();
  // held item / plate above the hands
  const held = world.held;
  if (held) {
    if (held.plate !== undefined) {
      drawPlate(ctx, held.plate, 0, -52, 40);
    } else {
      drawIngredient(ctx, held.id, held.state, 0, -50, 34);
      text(ctx, itemLabel(held), 0, -68, 12, '#fff', 'center');
    }
  }
  ctx.restore();
}

function drawOrderBoard(ctx, world) {
  const bx = 948;
  const by = 84;
  const bw = 308;
  const bh = 500;
  ctx.save();
  ctx.fillStyle = COLORS.wall;
  roundRect(ctx, bx - 6, by - 6, bw + 12, bh + 12, 14);
  ctx.fill();
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, bx, by, bw, bh, 10);
  ctx.fill();
  text(ctx, '📋 ORDER BOARD', bx + bw / 2, by + 32, 22, COLORS.boardInk, 'center');
  ctx.strokeStyle = COLORS.ticketEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx + 16, by + 44);
  ctx.lineTo(bx + bw - 16, by + 44);
  ctx.stroke();

  if (world.orders.length === 0) {
    text(ctx, 'No orders yet —', bx + bw / 2, by + 130, 16, '#8d6e63', 'center');
    text(ctx, 'the lunch crowd is coming!', bx + bw / 2, by + 156, 16, '#8d6e63', 'center');
  }
  world.orders.forEach((order, i) => {
    const recipe = recipeById(order.recipeId);
    const ty = by + 60 + i * 142;
    const frac = Math.max(0, order.patience / order.patienceMax);
    const urgent = frac < 0.35;
    ctx.fillStyle = COLORS.ticket;
    roundRect(ctx, bx + 12, ty, bw - 24, 128, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#e53935' : COLORS.ticketEdge;
    ctx.lineWidth = urgent ? 3 : 2;
    ctx.stroke();
    text(ctx, `#${order.id}  ${recipe.name}`, bx + 26, ty + 26, 18, COLORS.boardInk);
    text(ctx, `${recipe.coins} coins`, bx + bw - 26, ty + 26, 16, '#b8860b', 'right');
    // needed items with checkmarks for what the counter plate already covers
    recipe.needs.forEach((need, j) => {
      const ix = bx + 34 + j * 62;
      const covered = world.plate.some((p) => p.id === need.id && p.state === need.state);
      drawIngredient(ctx, need.id, need.state, ix, ty + 58, 36);
      if (covered) {
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(ix + 14, ty + 42, 10, 0, Math.PI * 2);
        ctx.fill();
        text(ctx, '✓', ix + 14, ty + 46, 13, '#fff', 'center');
      }
      text(ctx, need.state === 'raw' ? '' : need.state, ix, ty + 86, 10, '#8d6e63', 'center');
    });
    // patience bar
    ctx.fillStyle = '#e0e0e0';
    roundRect(ctx, bx + 26, ty + 104, bw - 76, 10, 5);
    ctx.fill();
    ctx.fillStyle = urgent ? '#e53935' : frac < 0.65 ? '#fb8c00' : '#66bb6a';
    roundRect(ctx, bx + 26, ty + 104, (bw - 76) * frac, 10, 5);
    ctx.fill();
    text(ctx, `${Math.ceil(order.patience)}s`, bx + bw - 26, ty + 114, 12, urgent ? '#e53935' : '#8d6e63', 'right');
  });
  ctx.restore();
}

function drawHud(ctx, world) {
  ctx.save();
  ctx.fillStyle = COLORS.wallTop;
  ctx.fillRect(0, 0, CANVAS.width, 72);
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(0, 72, CANVAS.width, 6);
  text(ctx, '🍳 THE COPPER LADLE', 24, 46, 26, '#fff');
  text(ctx, 'a hectic kitchen rush', 348, 44, 14, '#ffecb3');
  // coins
  ctx.fillStyle = '#5d4037';
  roundRect(ctx, 560, 12, 150, 48, 10);
  ctx.fill();
  text(ctx, `🪙 ${world.coins} coins`, 635, 44, 22, COLORS.gold, 'center');
  // timer
  const mins = Math.floor(world.timeLeft / 60);
  const secs = Math.floor(world.timeLeft % 60);
  const timerColor = world.timeLeft <= 30 ? COLORS.timerBad : world.timeLeft <= 60 ? COLORS.timerWarn : '#fff';
  ctx.fillStyle = '#5d4037';
  roundRect(ctx, 730, 12, 170, 48, 10);
  ctx.fill();
  text(ctx, `⏱ ${mins}:${String(secs).padStart(2, '0')}`, 815, 44, 24, timerColor, 'center');
  if (world.rush) {
    ctx.fillStyle = '#e53935';
    roundRect(ctx, 920, 12, 130, 48, 10);
    ctx.fill();
    text(ctx, '🔥 RUSH!', 985, 44, 20, '#fff', 'center');
  }
  text(ctx, `served ${world.served}   combo x${world.combo}`, 1070, 30, 15, '#ffecb3', 'left');
  const strikeDots = '●'.repeat(world.strikes) + '○'.repeat(Math.max(0, 3 - world.strikes));
  text(ctx, `strikes ${strikeDots}   M mute · R restart`, 1070, 52, 13, '#d7ccc8', 'left');
  ctx.restore();
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 78, CANVAS.width, 722);
  // tile floor
  for (let ty = 0; ty < 8; ty += 1) {
    for (let tx = 0; tx < 12; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(FLOOR.x + tx * 75, FLOOR.y + ty * 76, 75, 76);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 12; i += 1) {
    ctx.beginPath();
    ctx.moveTo(FLOOR.x + i * 75, FLOOR.y);
    ctx.lineTo(FLOOR.x + i * 75, FLOOR.y + FLOOR.height);
    ctx.stroke();
  }
  // wall clock on the empty stretch of wall beside the bins
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath();
  ctx.arc(892, 110, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(892, 110);
  ctx.lineTo(892, 94);
  ctx.moveTo(892, 110);
  ctx.lineTo(904, 114);
  ctx.stroke();
  // potted herbs for a kitchen of its own
  for (const [px, py] of [[60, 640], [880, 640]]) {
    ctx.fillStyle = '#b5651d';
    ctx.beginPath();
    ctx.moveTo(px - 14, py);
    ctx.lineTo(px + 14, py);
    ctx.lineTo(px + 10, py + 18);
    ctx.lineTo(px - 10, py + 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.arc(px, py - 8, 14, 0, Math.PI * 2);
    ctx.arc(px - 10, py - 2, 9, 0, Math.PI * 2);
    ctx.arc(px + 10, py - 2, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHintBar(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, 24, 764, 900, 28, 8);
  ctx.fill();
  text(ctx, world.hint || '', 40, 783, 14, '#fff');
  if (world.popup) {
    const a = Math.min(1, world.popup.ttl);
    ctx.globalAlpha = a;
    text(ctx, world.popup.text, world.popup.x, world.popup.y, 18, world.popup.color, 'center');
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function renderWorld(ctx, world) {
  ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
  drawFloor(ctx);
  drawHud(ctx, world);
  for (const station of STATIONS) drawStation(ctx, station, world);
  drawOrderBoard(ctx, world);
  drawChef(ctx, world);
  drawHintBar(ctx, world);

  if (world.screen === SCREEN_TITLE) {
    ctx.fillStyle = 'rgba(40,20,8,0.72)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    ctx.fillStyle = '#fff8e7';
    roundRect(ctx, 290, 170, 700, 460, 20);
    ctx.fill();
    text(ctx, '🍳 THE COPPER LADLE', 640, 250, 46, '#5d4037', 'center');
    text(ctx, 'A hectic kitchen rush', 640, 292, 22, '#8d6e63', 'center');
    text(ctx, 'Orders land on the board. Grab ingredients from the bins,', 640, 350, 18, '#3a2a1a', 'center');
    text(ctx, 'chop on the board, grill the patties, build the dish on the', 640, 378, 18, '#3a2a1a', 'center');
    text(ctx, 'assembly counter — then serve it at the window before', 640, 406, 18, '#3a2a1a', 'center');
    text(ctx, 'the ticket runs out. Three walk-outs end the shift!', 640, 434, 18, '#3a2a1a', 'center');
    text(ctx, 'Move: WASD / arrows   •   Use: E (or click a station)', 640, 486, 17, '#5d4037', 'center');
    text(ctx, 'Chop: hold E at the board   •   M: mute   •   R: restart', 640, 514, 17, '#5d4037', 'center');
    ctx.fillStyle = '#2e7d32';
    roundRect(ctx, 490, 545, 300, 56, 12);
    ctx.fill();
    text(ctx, '▶  START SHIFT  (Enter)', 640, 581, 22, '#fff', 'center');
  }

  if (world.screen === SCREEN_OVER) {
    ctx.fillStyle = 'rgba(40,20,8,0.72)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    ctx.fillStyle = '#fff8e7';
    roundRect(ctx, 340, 190, 600, 420, 20);
    ctx.fill();
    text(ctx, 'SHIFT OVER', 640, 270, 44, '#5d4037', 'center');
    text(ctx, world.overReason, 640, 312, 18, '#8d6e63', 'center');
    text(ctx, `🪙 ${world.coins} coins earned`, 640, 372, 26, '#b8860b', 'center');
    text(ctx, `🍽 ${world.served} dishes served    🔥 best combo x${world.bestCombo}`, 640, 414, 20, '#3a2a1a', 'center');
    text(ctx, `Chopped ${world.stats.chopped}  •  Grilled ${world.stats.grilled}  •  Binned ${world.stats.trashed}`, 640, 448, 17, '#8d6e63', 'center');
    ctx.fillStyle = '#2e7d32';
    roundRect(ctx, 490, 490, 300, 56, 12);
    ctx.fill();
    text(ctx, '↻  PLAY AGAIN  (R)', 640, 526, 22, '#fff', 'center');
  }
}
