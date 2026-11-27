// Keyboard, mouse and touch input. One object, read every frame:
// direction() is -1 / 0 / 1, jump/dash are edge-triggered, slide is held.
// Clicking or tapping the canvas confirms (start / restart) and jumps mid-run.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let jumpQueued = false;
  let dashQueued = false;
  let pointerDown = false;

  function isJump(code) {
    return code === 'Space' || code === 'ArrowUp' || code === 'KeyW';
  }
  function isLeft(code) {
    return code === 'ArrowLeft' || code === 'KeyA';
  }
  function isRight(code) {
    return code === 'ArrowRight' || code === 'KeyD';
  }
  function isSlide(code) {
    return code === 'ArrowDown' || code === 'KeyS';
  }

  window.addEventListener('keydown', (event) => {
    if (isJump(event.code) || isLeft(event.code) || isRight(event.code) || isSlide(event.code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    keys.add(event.code);
    if (isJump(event.code)) jumpQueued = true;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') dashQueued = true;
    if (event.code === 'Enter' || isJump(event.code)) actions |= ACTION_CONFIRM;
    if (event.code === 'KeyP' || event.code === 'Escape') actions |= ACTION_PAUSE;
    if (event.code === 'KeyM') actions |= ACTION_MUTE;
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    pointerDown = true;
    jumpQueued = true;
    actions |= ACTION_CONFIRM;
    try {
      canvas.focus();
    } catch {
      // Focus is a nicety, not a requirement.
    }
  });
  window.addEventListener('pointerup', () => {
    pointerDown = false;
  });
  window.addEventListener('blur', () => {
    keys.clear();
    pointerDown = false;
  });

  return {
    direction() {
      const left = keys.has('ArrowLeft') || keys.has('KeyA') ? -1 : 0;
      const right = keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0;
      return left + right;
    },
    sliding() {
      return keys.has('ArrowDown') || keys.has('KeyS') || pointerDown;
    },
    takeJump() {
      const queued = jumpQueued;
      jumpQueued = false;
      return queued;
    },
    takeDash() {
      const queued = dashQueued;
      dashQueued = false;
      return queued;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
