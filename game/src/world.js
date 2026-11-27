// The world: the turkey, the scrolling farm, the obstacles, the pickups,
// the three stages and the score. One fixed-step update per frame.
// Events are a bitmask so the main loop can play the right sound and the
// right announcement for each thing that happened this step.
import {
  FIELD, STEP, WIN_DISTANCE, TURKEY, FARMER, LIVES, STAGES, OBSTACLE, PICKUP,
} from './config.js';
import { createFarmer } from './farmer.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_WIN = 4;
export const EVENT_PICKUP = 8;
export const EVENT_STAGE = 16;
export const EVENT_GOBBLE = 32;
export const EVENT_DASH = 64;

const KIND_FENCE = 'fence';
const KIND_BALE = 'bale';
const KIND_PUMPKIN = 'pumpkin';
const KIND_OVEN = 'oven';
const KIND_GRAVY = 'gravy';
const KIND_KNIFE = 'knife';

function stageFor(distance) {
  for (let i = 0; i < STAGES.length; i += 1) {
    if (distance < STAGES[i].until) return i;
  }
  return STAGES.length - 1;
}

function obstacleKinds(stageIndex) {
  if (stageIndex === 0) return [KIND_FENCE, KIND_BALE, KIND_PUMPKIN, KIND_GRAVY];
  if (stageIndex === 1) return [KIND_FENCE, KIND_BALE, KIND_PUMPKIN, KIND_GRAVY, KIND_KNIFE];
  return [KIND_FENCE, KIND_BALE, KIND_OVEN, KIND_GRAVY, KIND_KNIFE];
}

export function createWorld(random) {
  const farmer = createFarmer();
  const state = {
    turkey: { x: 240, y: FIELD.groundY - TURKEY.height, vy: 0, grounded: true, jumps: 0, sliding: false, shield: false, invuln: 0, runPhase: 0 },
    distance: 0,
    score: 0,
    scoreFloat: 0,
    lives: LIVES,
    stageIndex: 0,
    stamina: TURKEY.staminaMax,
    dashTimer: 0,
    obstacles: [],
    pickups: [],
    haystacks: [],
    particles: [],
    thrownKnives: [],
    time: 0,
    over: false,
    won: false,
    cause: '',
    hidden: false,
    spawnTimer: 0.8,
    pickupTimer: 1.2,
    hayTimer: 6,
    knifeTimer: 5,
    scroll: 0,
    shake: 0,
  };

  function burst(x, y, colour, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x, y,
        vx: random.range(-160, 160),
        vy: random.range(-260, -40),
        life: random.range(0.3, 0.7),
        max: 0.7,
        colour,
        size: random.range(3, 7),
      });
    }
  }

  function spawnObstacle() {
    const stage = STAGES[state.stageIndex];
    const kind = random.pick(obstacleKinds(state.stageIndex));
    const size = OBSTACLE[kind];
    const obstacle = {
      kind,
      x: FIELD.width + 40,
      width: size.width,
      height: size.height,
      points: size.points,
      passed: false,
      vy: 0,
      y: FIELD.groundY - size.height,
    };
    if (kind === KIND_KNIFE) {
      // A carving knife drops from the sky well ahead of the turkey, slow
      // enough to see coming and step away from — never on top of it.
      obstacle.x = state.turkey.x + random.range(300, 520);
      obstacle.y = -80;
      obstacle.vy = random.range(340, 440) + state.stageIndex * 40;
    }
    if (kind === KIND_GRAVY) obstacle.y = FIELD.groundY - size.height;
    state.obstacles.push(obstacle);
  }

  function spawnPickup() {
    const roll = random.next();
    const kind = roll < 0.55 ? 'corn' : roll < 0.75 ? 'pie' : roll < 0.9 ? 'feather' : 'goldcorn';
    const size = PICKUP[kind];
    state.pickups.push({
      kind,
      x: FIELD.width + 40,
      y: FIELD.groundY - random.range(70, 220),
      size: size.size,
      points: size.points,
      taken: false,
      bob: random.range(0, Math.PI * 2),
    });
  }

  function spawnHaystack() {
    state.haystacks.push({
      x: FIELD.width + 40,
      width: 120,
      height: 78,
      y: FIELD.groundY - 78,
    });
  }

  function throwKnife() {
    state.thrownKnives.push({
      x: FIELD.width + 30,
      y: state.turkey.y + 10,
      vx: -(520 + state.stageIndex * 70),
      width: 46,
      height: 12,
      spin: 0,
    });
  }

  function turkeyBox() {
    const t = state.turkey;
    const height = t.sliding ? TURKEY.slideHeight : TURKEY.height;
    return { x: t.x + 6, y: t.y + (TURKEY.height - height), width: TURKEY.width - 12, height };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function hitTurkey(kind) {
    const t = state.turkey;
    if (t.invuln > 0 || state.over) return EVENT_NONE;
    if (t.shield) {
      t.shield = false;
      t.invuln = 1.2;
      burst(t.x + 32, t.y + 20, '#ffd23f', 14);
      return EVENT_HIT;
    }
    state.lives -= 1;
    t.invuln = 1.6;
    state.shake = 0.35;
    farmer.onHit();
    burst(t.x + 32, t.y + 20, '#ff4d4d', 18);
    if (state.lives <= 0) {
      state.over = true;
      state.cause = kind === 'farmer' ? 'caught' : 'hurt';
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  const world = {
    state,
    farmer,
    reset() {
      state.turkey.x = 240;
      state.turkey.y = FIELD.groundY - TURKEY.height;
      state.turkey.vy = 0;
      state.turkey.grounded = true;
      state.turkey.jumps = 0;
      state.turkey.sliding = false;
      state.turkey.shield = false;
      state.turkey.invuln = 0;
      state.distance = 0;
      state.score = 0;
      state.scoreFloat = 0;
      state.lives = LIVES;
      state.stageIndex = 0;
      state.stamina = TURKEY.staminaMax;
      state.dashTimer = 0;
      state.obstacles = [];
      state.pickups = [];
      state.haystacks = [];
      state.particles = [];
      state.thrownKnives = [];
      state.time = 0;
      state.over = false;
      state.won = false;
      state.cause = '';
      state.hidden = false;
      state.spawnTimer = 0.8;
      state.pickupTimer = 1.2;
      state.hayTimer = 6;
      state.knifeTimer = 5;
      state.scroll = 0;
      state.shake = 0;
      farmer.reset();
    },

    step(dt, move, jump, dash, slide, attract) {
      if (state.over || state.won) return EVENT_NONE;
      let events = EVENT_NONE;
      const t = state.turkey;
      state.time += dt;
      const stage = STAGES[state.stageIndex];
      const dashing = state.dashTimer > 0;
      const speed = stage.speed * (dashing ? TURKEY.dashMultiplier : 1);

      // --- turkey movement -------------------------------------------------
      t.x = Math.min(760, Math.max(90, t.x + move * TURKEY.speed * dt));
      t.sliding = slide && t.grounded;
      if (jump) {
        if (t.grounded) {
          t.vy = -TURKEY.jumpVelocity;
          t.grounded = false;
          t.jumps = 1;
        } else if (t.jumps < 2) {
          t.vy = -TURKEY.doubleJumpVelocity;
          t.jumps = 2;
          burst(t.x + 32, t.y + TURKEY.height, '#fff7e6', 8);
        }
      }
      if (dash && state.stamina >= TURKEY.dashCost && state.dashTimer <= 0) {
        state.dashTimer = TURKEY.dashSeconds;
        state.stamina -= TURKEY.dashCost;
        farmer.onDash();
        events |= EVENT_DASH;
      }
      state.dashTimer = Math.max(0, state.dashTimer - dt);
      state.stamina = Math.min(TURKEY.staminaMax, state.stamina + TURKEY.staminaRegen * dt);
      t.vy = Math.min(TURKEY.maxFall, t.vy + TURKEY.gravity * dt);
      t.y += t.vy * dt;
      if (t.y >= FIELD.groundY - TURKEY.height) {
        t.y = FIELD.groundY - TURKEY.height;
        t.vy = 0;
        t.grounded = true;
        t.jumps = 0;
      }
      t.invuln = Math.max(0, t.invuln - dt);
      t.runPhase += dt * (dashing ? 22 : 13);
      state.shake = Math.max(0, state.shake - dt);

      // --- forward progress: distance, score, stage ------------------------
      const running = move >= 0;
      state.distance += (speed * dt) / 12;
      state.scoreFloat += speed * dt * 0.06;
      state.score = Math.floor(state.scoreFloat);
      state.scroll += speed * dt;
      const nextStage = stageFor(state.distance);
      if (nextStage !== state.stageIndex) {
        state.stageIndex = nextStage;
        events |= EVENT_STAGE;
      }
      if (state.distance >= WIN_DISTANCE) {
        state.won = true;
        state.scoreFloat += 500;
        state.score = Math.floor(state.scoreFloat);
        return events | EVENT_WIN;
      }

      // --- the farmer -------------------------------------------------------
      const inHay = state.haystacks.some((h) => t.sliding && t.x + TURKEY.width > h.x + 10 && t.x < h.x + h.width - 10 && t.grounded);
      state.hidden = inHay;
      const farmerEvents = farmer.update(dt, inHay, running);
      if (farmerEvents.gobble) events |= EVENT_GOBBLE;
      if (farmer.caught()) {
        state.over = true;
        state.cause = 'caught';
        return events | EVENT_OVER;
      }

      // --- spawning ----------------------------------------------------------
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        // Keep a fair gap between obstacles: never spawn into a crowd.
        const crowded = state.obstacles.some((o) => o.x > 950 && o.kind !== KIND_KNIFE);
        if (!crowded) {
          spawnObstacle();
          state.spawnTimer = stage.spawnEvery * random.range(0.85, 1.25);
        } else {
          state.spawnTimer = 0.3;
        }
      }
      state.pickupTimer -= dt;
      if (state.pickupTimer <= 0) {
        spawnPickup();
        state.pickupTimer = random.range(1.1, 2.1);
      }
      state.hayTimer -= dt;
      if (state.hayTimer <= 0 && state.stageIndex < 2) {
        // Haystacks to hide in grow on the farm and in the barn, not in the kitchen.
        spawnHaystack();
        state.hayTimer = random.range(7, 12);
      }
      state.knifeTimer -= dt;
      if (state.knifeTimer <= 0 && state.stageIndex >= 1 && !inHay) {
        throwKnife();
        state.knifeTimer = random.range(3.2, 5.2) - state.stageIndex * 0.5;
      }

      // --- move everything left, cull, collide ------------------------------
      const box = turkeyBox();
      for (const o of state.obstacles) {
        if (o.kind === KIND_KNIFE) {
          o.y += o.vy * dt;
        } else {
          o.x -= speed * dt;
        }
        const oBox = { x: o.x, y: o.y, width: o.width, height: o.height };
        if (!o.passed && o.x + o.width < t.x) {
          o.passed = true;
          state.scoreFloat += o.points;
          state.score = Math.floor(state.scoreFloat);
        }
        if (o.kind === KIND_GRAVY) {
          // Gravy does not hurt: it slows the turkey and lets the farmer gain.
          if (overlaps(box, oBox) && t.grounded) farmer.state.gap -= 14 * dt;
          continue;
        }
        if (overlaps(box, oBox)) {
          o.x = -9999;
          events |= hitTurkey(o.kind);
          if (state.over) return events;
        }
      }
      state.obstacles = state.obstacles.filter((o) => o.x > -200 && o.y < FIELD.height + 120);

      for (const p of state.pickups) {
        p.x -= speed * dt;
        p.bob += dt * 4;
        const pBox = { x: p.x - p.size / 2, y: p.y - p.size / 2, width: p.size, height: p.size };
        if (!p.taken && overlaps(box, pBox)) {
          p.taken = true;
          state.scoreFloat += p.points;
          state.score = Math.floor(state.scoreFloat);
          if (p.kind === 'feather') t.shield = true;
          if (p.kind === 'pie') state.stamina = TURKEY.staminaMax;
          if (p.kind === 'corn' || p.kind === 'goldcorn') farmer.onCorn();
          burst(p.x, p.y, p.kind === 'goldcorn' ? '#ffd23f' : '#f2c94c', 10);
          events |= EVENT_PICKUP;
        }
      }
      state.pickups = state.pickups.filter((p) => !p.taken && p.x > -60);

      for (const h of state.haystacks) h.x -= speed * dt;
      state.haystacks = state.haystacks.filter((h) => h.x > -200);

      for (const k of state.thrownKnives) {
        k.x += k.vx * dt;
        k.spin += dt * 14;
        const kBox = { x: k.x, y: k.y, width: k.width, height: k.height };
        if (overlaps(box, kBox)) {
          k.x = -9999;
          events |= hitTurkey('knife');
          if (state.over) return events;
        }
      }
      state.thrownKnives = state.thrownKnives.filter((k) => k.x > -80);

      for (const p of state.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 500 * dt;
        p.life -= dt;
      }
      state.particles = state.particles.filter((p) => p.life > 0);

      if (attract) {
        // Title-screen demo: the turkey idles and the farm scrolls by.
        state.distance = 0;
        state.score = 0;
        state.scoreFloat = 0;
      }
      return events;
    },
  };
  return world;
}

// Re-exported for shots.js / main.js so callers name one module for events.
export { STEP };
