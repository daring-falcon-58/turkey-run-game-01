// Gobble Run — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720, groundY: 600 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** Distance in metres the turkey must cover to escape into the forest. */
export const WIN_DISTANCE = 1000;

export const TURKEY = {
  width: 64,
  height: 58,
  slideHeight: 34,
  speed: 340,
  jumpVelocity: 820,
  doubleJumpVelocity: 680,
  gravity: 1900,
  maxFall: 900,
  dashMultiplier: 1.75,
  dashSeconds: 0.45,
  dashCost: 30,
  staminaMax: 100,
  staminaRegen: 16,
};

export const FARMER = {
  startGap: 230,
  catchGap: 46,
  cornerGap: 110,
  gainPerSecond: 7,
  hitPenalty: 55,
  dashReward: 26,
  cornReward: 9,
  searchSeconds: 2.2,
};

export const LIVES = 3;

/** One stage per leg of the escape: farmyard, barn, then the kitchen. */
export const STAGES = [
  { name: 'FARMYARD', until: 300, speed: 265, spawnEvery: 1.2, knifeChance: 0.10 },
  { name: 'BARN', until: 650, speed: 315, spawnEvery: 0.95, knifeChance: 0.22 },
  { name: 'KITCHEN', until: WIN_DISTANCE, speed: 360, spawnEvery: 0.75, knifeChance: 0.34 },
];

export const OBSTACLE = {
  fence: { width: 26, height: 74, points: 2 },
  bale: { width: 78, height: 88, points: 3 },
  pumpkin: { width: 52, height: 46, points: 2 },
  oven: { width: 110, height: 118, points: 5 },
  gravy: { width: 120, height: 16, points: 2 },
  knife: { width: 14, height: 64, points: 4 },
};

export const PICKUP = {
  corn: { size: 26, points: 10 },
  pie: { size: 30, points: 25 },
  feather: { size: 30, points: 15 },
  goldcorn: { size: 26, points: 50 },
};

export const PALETTE = {
  skyTop: '#f7b733',
  skyMid: '#fc8a4c',
  skyLow: '#e86a92',
  barnSkyTop: '#7fb069',
  barnSkyMid: '#e9c46a',
  kitchenTop: '#3d2b1f',
  kitchenMid: '#6b4226',
  ground: '#8a5a2b',
  groundDark: '#6e4520',
  grass: '#5da24a',
  text: '#fff7e6',
  panel: 'rgba(46, 24, 8, 0.82)',
  accent: '#ffd23f',
  danger: '#ff4d4d',
  turkeyBody: '#8a5a2b',
  turkeyDark: '#6e4520',
  turkeyTail: ['#d2691e', '#e8a33c', '#a0522d', '#c0392b'],
  farmerShirt: '#4a7c59',
  farmerHat: '#d9a441',
  oven: '#3a3f4a',
  ovenFire: '#ff7b24',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-run.best';
