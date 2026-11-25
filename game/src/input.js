// Keyboard and mouse input for The Copper Ladle.
// One clear job: turn browser events into a plain keys/click state the world steps on.

export function createInput() {
  return {
    keys: { up: false, down: false, left: false, right: false, use: false },
    usePressed: false, // edge: E was pressed since the last frame
    click: null, // { x, y } canvas coords, consumed by the next step
    anyKey: false,
  };
}

const KEY_MAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyE: 'use', Space: 'use',
};

export function attachInput(input, canvas, onUse) {
  window.addEventListener('keydown', (event) => {
    const name = KEY_MAP[event.code];
    if (name) {
      if (name === 'use' && !input.keys.use) {
        input.usePressed = true;
        if (onUse) onUse();
      }
      input.keys[name] = true;
      input.anyKey = true;
      event.preventDefault();
    }
    if (event.code === 'KeyM') input.anyKey = true;
  });
  window.addEventListener('keyup', (event) => {
    const name = KEY_MAP[event.code];
    if (name) input.keys[name] = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    input.click = { x, y };
    input.anyKey = true;
  });
}

export function consumeClick(input) {
  const click = input.click;
  input.click = null;
  return click;
}
