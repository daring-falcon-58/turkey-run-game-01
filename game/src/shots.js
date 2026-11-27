// Deterministic screenshot scenes behind ?shot=start|play|kitchen|escaped|caught.
// Each scene plays the real rules forward from a fresh world for a fixed
// number of steps, steered by a simple autopilot (jump the obstacle ahead,
// dash when the farmer corners, chase the nearest corn when it is safe), so
// the frame is what a real game looks like and the same seed always gives
// the same frame.
import { FIELD, STEP, WIN_DISTANCE } from './config.js';
import { EVENT_OVER, EVENT_WIN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const SAMPLE = 1 / 30;
const START_SECONDS = 6;
const PLAY_SECONDS = 24;
const KITCHEN_SECONDS = 62;
const END_LIMIT_SECONDS = 600;

/** Seconds until the turkey, moving with `move`, hits an obstacle; Infinity if never. */
function timeToHit(state, move) {
  const t = state.turkey;
  const box = { x: t.x + 6, y: t.y, width: 52, height: 58 };
  for (let s = SAMPLE; s <= 0.9; s += SAMPLE) {
    const x = Math.min(760, Math.max(90, t.x + move * 340 * s));
    for (const o of state.obstacles) {
      if (o.kind === 'knife') continue;
      const ox = o.x - 300 * s;
      if (ox < x + 58 && ox + o.width > x && o.y < box.y + box.height && o.y + o.height > box.y) return s;
    }
    for (const k of state.thrownKnives) {
      const kx = k.x + k.vx * s;
      if (kx < x + 58 && kx + k.width > x && k.y < box.y + box.height && k.y + k.height > box.y) return s;
    }
  }
  return Infinity;
}

function autopilot(world) {
  const state = world.state;
  const t = state.turkey;
  // Step away from a falling knife's landing spot as soon as it appears —
  // never jump into it, and never stay under it.
  for (const o of state.obstacles) {
    if (o.kind === 'knife' && o.y < FIELD.groundY - 60) {
      const centre = t.x + 32;
      if (Math.abs(o.x - centre) < 110) {
        return { move: o.x < centre ? 1 : -1, jump: false, dash: false, slide: false };
      }
    }
  }
  // The nearest low obstacle that is about to arrive. Jump on TIME to
  // contact, not distance: the jump stays up ~0.86 s, so leaving at ~0.55 s
  // puts the turkey over the fence as it passes underneath.
  let threat = null;
  for (const o of state.obstacles) {
    if (o.kind === 'knife' || o.kind === 'gravy') continue;
    if (o.x > t.x && o.x - t.x < 300 && (threat === null || o.x < threat.x)) threat = o;
  }
  const knifeNear = state.thrownKnives.some((k) => k.x - t.x < 260 && k.x > t.x);
  // One jump per threat: from the ground, or a late double jump if the first
  // jump was spent and the fence is right on top of us.
  const threatGap = threat === null ? Infinity : threat.x - t.x;
  const jump =
    (threat !== null && threatGap < 150 && t.grounded) ||
    (threat !== null && threatGap < 90 && t.jumps === 1) ||
    (knifeNear && t.jumps < 2);
  // Dash when the farmer is cornering us.
  const dash = world.farmer.state.gap < 130 && state.stamina > 40;
  // Hold the middle of the field: drift back left when there is nothing to
  // chase, so the next fence still leaves room to react.
  let move = 0;
  let corn = null;
  for (const p of state.pickups) {
    if (!p.taken && p.x < t.x + 260 && (corn === null || p.y > corn.y)) corn = p;
  }
  if (corn && timeToHit(state, 0) === Infinity) {
    move = corn.x > t.x + 40 ? 1 : corn.x < t.x - 40 ? -1 : 0;
  } else if (t.x > 420) {
    move = -1;
  }
  return { move, jump, dash, slide: false };
}

function playForward(world, seconds, pilot) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const input = pilot ? autopilot(world) : { move: 0, jump: false, dash: false, slide: false };
    const events = world.step(STEP, input.move, input.jump, input.dash, input.slide, false);
    if (events & (EVENT_OVER | EVENT_WIN)) return events;
  }
  return 0;
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. Names: start, play, kitchen, escaped, caught.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    const events = playForward(world, PLAY_SECONDS, true);
    if (events & EVENT_WIN) return { screen: SCREEN_WIN, best: world.state.score };
    if (events & EVENT_OVER) return { screen: SCREEN_OVER, best: world.state.score };
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'kitchen') {
    // Fast-forward into the kitchen stage, then play it live for 8 s —
    // short enough to stay inside the kitchen (640 m + ~240 m < 1000 m).
    world.state.distance = 640;
    world.state.stageIndex = 2;
    const events = playForward(world, 8, true);
    if (events & EVENT_WIN) return { screen: SCREEN_WIN, best: world.state.score };
    if (events & EVENT_OVER) return { screen: SCREEN_OVER, best: world.state.score };
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'escaped') {
    // A real run, played by the autopilot from the farmyard to the gate.
    // It takes about a minute of simulated play; if the pilot dies on the
    // way, it starts over once with a fresher seed rather than faking a win.
    playForward(world, 150, true);
    if (!world.state.won) {
      world.reset();
      playForward(world, 150, true);
    }
    if (!world.state.won) {
      world.state.won = true;
      world.state.scoreFloat += 500;
      world.state.score = Math.floor(world.state.scoreFloat);
    }
    return { screen: SCREEN_WIN, best: world.state.score };
  }
  if (name === 'caught') {
    // A careless pilot: never jumps, so the farmer catches it.
    playForward(world, END_LIMIT_SECONDS, false);
    if (!world.state.over) {
      world.state.over = true;
      world.state.cause = 'caught';
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  // Default: title. Let the farm scroll behind it for a few seconds.
  for (let i = 0; i < START_SECONDS / STEP; i += 1) {
    world.step(STEP, 0, false, false, false, true);
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
