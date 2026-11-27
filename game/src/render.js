// The renderer: every pixel of Gobble Run is drawn here on one canvas —
// the autumn farm, the barn, the kitchen, the turkey, the farmer, the
// obstacles, the HUD and all four screens. No images, no fonts to fetch.
import { FIELD, WIN_DISTANCE, TURKEY, STAGES, PALETTE, FONT } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const W = FIELD.width;
  const H = FIELD.height;

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    canvas.width = Math.floor(W * scale * dpr);
    canvas.height = Math.floor(H * scale * dpr);
    canvas.style.width = `${Math.floor(W * scale)}px`;
    canvas.style.height = `${Math.floor(H * scale)}px`;
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  }
  fit();
  window.addEventListener('resize', fit);

  function sky(stageIndex) {
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
    if (stageIndex === 0) {
      g.addColorStop(0, PALETTE.skyTop);
      g.addColorStop(0.55, PALETTE.skyMid);
      g.addColorStop(1, PALETTE.skyLow);
    } else if (stageIndex === 1) {
      g.addColorStop(0, '#8fb8d8');
      g.addColorStop(0.6, PALETTE.barnSkyMid);
      g.addColorStop(1, '#e07a5f');
    } else {
      g.addColorStop(0, PALETTE.kitchenTop);
      g.addColorStop(1, PALETTE.kitchenMid);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, FIELD.groundY);
    // Sun / kitchen lamp.
    ctx.fillStyle = stageIndex === 2 ? '#ffd23f' : '#fff3b0';
    ctx.beginPath();
    ctx.arc(stageIndex === 2 ? 640 : 1080, stageIndex === 2 ? 90 : 110, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 243, 176, 0.35)';
    ctx.beginPath();
    ctx.arc(stageIndex === 2 ? 640 : 1080, stageIndex === 2 ? 90 : 110, 70, 0, Math.PI * 2);
    ctx.fill();
  }

  function clouds(scroll) {
    ctx.fillStyle = 'rgba(255, 247, 230, 0.85)';
    for (let i = 0; i < 5; i += 1) {
      const x = ((i * 340 - scroll * 0.15) % 1500 + 1500) % 1500 - 100;
      const y = 60 + (i % 3) * 55;
      ctx.beginPath();
      ctx.ellipse(x, y, 62, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 40, y + 6, 46, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function farmBackdrop(stageIndex, scroll) {
    if (stageIndex === 2) {
      // Kitchen: tiled wall, hanging pots, a window to the farm outside.
      ctx.fillStyle = '#7a4a2b';
      ctx.fillRect(0, 0, W, FIELD.groundY);
      ctx.fillStyle = '#8a5a35';
      for (let y = 0; y < FIELD.groundY; y += 56) {
        for (let x = (y / 56 % 2) * 40; x < W; x += 80) ctx.fillRect(x, y, 76, 52);
      }
      ctx.fillStyle = '#2b1a10';
      ctx.fillRect(90, 70, 220, 160);
      ctx.fillStyle = '#f7b733';
      ctx.fillRect(104, 84, 192, 132);
      ctx.fillStyle = '#5da24a';
      ctx.fillRect(104, 170, 192, 46);
      ctx.fillStyle = '#3a3f4a';
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.arc(480 + i * 90, 60, 26, 0, Math.PI);
        ctx.fill();
      }
      return;
    }
    // Rolling hills, a red barn and a fence line, parallaxed by scroll.
    ctx.fillStyle = stageIndex === 0 ? '#7fb069' : '#6a9a58';
    ctx.beginPath();
    ctx.moveTo(0, 470);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 470 + Math.sin((x + scroll * 0.4) / 260) * 26);
    ctx.lineTo(W, FIELD.groundY);
    ctx.lineTo(0, FIELD.groundY);
    ctx.fill();
    const barnX = ((980 - scroll * 0.55) % 1600 + 1600) % 1600 - 160;
    ctx.fillStyle = '#b23a2e';
    ctx.fillRect(barnX, 330, 190, 170);
    ctx.fillStyle = '#7c271e';
    ctx.beginPath();
    ctx.moveTo(barnX - 12, 330);
    ctx.lineTo(barnX + 95, 268);
    ctx.lineTo(barnX + 202, 330);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff7e6';
    ctx.fillRect(barnX + 70, 400, 50, 100);
    ctx.strokeStyle = '#7c271e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(barnX + 70, 400);
    ctx.lineTo(barnX + 120, 500);
    ctx.moveTo(barnX + 120, 400);
    ctx.lineTo(barnX + 70, 500);
    ctx.stroke();
    // Fence posts along the ground.
    ctx.fillStyle = '#6e4520';
    for (let x = -((scroll * 0.9) % 90); x < W; x += 90) ctx.fillRect(x, 540, 10, 62);
    ctx.fillRect(0, 552, W, 8);
    ctx.fillRect(0, 578, W, 8);
  }

  function ground(stageIndex) {
    ctx.fillStyle = stageIndex === 2 ? '#4a3428' : PALETTE.ground;
    ctx.fillRect(0, FIELD.groundY, W, H - FIELD.groundY);
    ctx.fillStyle = stageIndex === 2 ? '#5d4030' : PALETTE.grass;
    ctx.fillRect(0, FIELD.groundY, W, 14);
    ctx.fillStyle = PALETTE.groundDark;
    for (let i = 0; i < 24; i += 1) {
      const x = ((i * 173 + 40) % W);
      ctx.fillRect(x, FIELD.groundY + 34 + (i % 3) * 26, 26, 5);
    }
  }

  function drawTurkey(t, time) {
    const legSwing = Math.sin(t.runPhase) * (t.grounded ? 10 : 4);
    const bob = t.grounded ? Math.abs(Math.sin(t.runPhase)) * 3 : 0;
    const x = t.x;
    const y = t.y - bob;
    const w = TURKEY.width;
    const h = TURKEY.height;
    ctx.save();
    if (t.invuln > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = 0.45;
    // Tail fan.
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = PALETTE.turkeyTail[i % 4];
      ctx.save();
      ctx.translate(x + 8, y + h * 0.55);
      ctx.rotate(-0.9 + i * 0.42);
      ctx.beginPath();
      ctx.ellipse(-16, -26, 9, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Legs.
    ctx.strokeStyle = '#e8a33c';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 26, y + h - 6);
    ctx.lineTo(x + 26 + legSwing, y + h + 12);
    ctx.moveTo(x + 44, y + h - 6);
    ctx.lineTo(x + 44 - legSwing, y + h + 12);
    ctx.stroke();
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.58, 32, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyDark;
    ctx.beginPath();
    ctx.ellipse(x + w / 2 - 4, y + h * 0.62, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = '#a0622d';
    ctx.beginPath();
    ctx.ellipse(x + w / 2 + 2, y + h * 0.55, 16, 11, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Head + beak + wattle.
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.arc(x + w - 8, y + 12, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a33c';
    ctx.beginPath();
    ctx.moveTo(x + w + 4, y + 10);
    ctx.lineTo(x + w + 20, y + 14);
    ctx.lineTo(x + w + 4, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.ellipse(x + w + 2, y + 24, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d1d1d';
    ctx.beginPath();
    ctx.arc(x + w - 4, y + 8, 2.6, 0, Math.PI * 2);
    ctx.fill();
    if (t.sliding) {
      ctx.fillStyle = 'rgba(255, 247, 230, 0.9)';
      ctx.font = 'bold 15px ' + FONT;
      ctx.fillText('shhh…', x + 6, y - 8);
    }
    // Feather shield ring.
    if (t.shield) {
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 44 + Math.sin(time * 5) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFarmer(x, mood, time) {
    const bob = Math.sin(time * 11) * 3;
    const y = FIELD.groundY - 108 + bob;
    ctx.save();
    // Legs mid-stride.
    ctx.strokeStyle = '#2b3a55';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x + 26, y + 66);
    ctx.lineTo(x + 18, y + 104);
    ctx.moveTo(x + 44, y + 66);
    ctx.lineTo(x + 54, y + 104);
    ctx.stroke();
    // Overalls + shirt.
    ctx.fillStyle = PALETTE.farmerShirt;
    ctx.fillRect(x + 12, y + 34, 48, 38);
    ctx.fillStyle = '#2b3a55';
    ctx.fillRect(x + 16, y + 58, 40, 14);
    // Arms reaching forward with the pitchfork.
    ctx.strokeStyle = '#e8b88a';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x + 52, y + 42);
    ctx.lineTo(x + 84, y + 52);
    ctx.stroke();
    ctx.strokeStyle = '#8a8f98';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 78, y + 20);
    ctx.lineTo(x + 96, y + 84);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 96, y + 84);
    ctx.lineTo(x + 88, y + 62);
    ctx.moveTo(x + 96, y + 84);
    ctx.lineTo(x + 96, y + 62);
    ctx.moveTo(x + 96, y + 84);
    ctx.lineTo(x + 104, y + 62);
    ctx.stroke();
    // Head, beard, hat.
    ctx.fillStyle = '#e8b88a';
    ctx.beginPath();
    ctx.arc(x + 36, y + 20, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.arc(x + 36, y + 30, 11, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerHat;
    ctx.beginPath();
    ctx.ellipse(x + 36, y + 10, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 24, y - 8, 24, 16);
    ctx.fillStyle = '#1d1d1d';
    ctx.beginPath();
    ctx.arc(x + 42, y + 18, 2.4, 0, Math.PI * 2);
    ctx.fill();
    if (mood === 'corner') {
      ctx.fillStyle = '#ff4d4d';
      ctx.font = 'bold 20px ' + FONT;
      ctx.fillText('!', x + 58, y - 6);
    }
    if (mood === 'search') {
      ctx.fillStyle = '#fff7e6';
      ctx.font = 'bold 18px ' + FONT;
      ctx.fillText('?', x + 58, y - 6);
    }
    ctx.restore();
  }

  function drawObstacle(o, time) {
    if (o.kind === 'fence') {
      ctx.fillStyle = '#7a4a26';
      ctx.fillRect(o.x, o.y, 8, o.height);
      ctx.fillRect(o.x + o.width - 8, o.y, 8, o.height);
      ctx.fillRect(o.x, o.y + 12, o.width, 8);
      ctx.fillRect(o.x, o.y + 40, o.width, 8);
    } else if (o.kind === 'bale') {
      ctx.fillStyle = '#d9a441';
      ctx.beginPath();
      ctx.arc(o.x + o.width / 2, o.y + o.height / 2, o.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a87c1f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(o.x + o.width / 2, o.y + o.height / 2, o.width / 2 - 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(o.x + o.width / 2, o.y + o.height / 2, o.width / 4, 0, Math.PI * 2);
      ctx.stroke();
    } else if (o.kind === 'pumpkin') {
      ctx.fillStyle = '#e86a1c';
      ctx.beginPath();
      ctx.ellipse(o.x + o.width / 2, o.y + o.height / 2, 28, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b34d0e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(o.x + o.width / 2, o.y + o.height / 2, 16, 20, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#5da24a';
      ctx.fillRect(o.x + o.width / 2 - 3, o.y - 6, 6, 12);
    } else if (o.kind === 'oven') {
      ctx.fillStyle = PALETTE.oven;
      roundRect(ctx, o.x, o.y, o.width, o.height, 8);
      ctx.fill();
      ctx.fillStyle = '#20242e';
      roundRect(ctx, o.x + 12, o.y + 14, o.width - 24, 46, 6);
      ctx.fill();
      const flick = Math.sin(time * 9 + o.x) * 6;
      ctx.fillStyle = PALETTE.ovenFire;
      ctx.beginPath();
      ctx.moveTo(o.x + 22, o.y + 52);
      ctx.quadraticCurveTo(o.x + o.width / 2, o.y + 6 + flick, o.x + o.width - 22, o.y + 52);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.font = 'bold 15px ' + FONT;
      ctx.fillText('HOT!', o.x + 34, o.y + 96);
    } else if (o.kind === 'gravy') {
      ctx.fillStyle = '#a0622d';
      ctx.beginPath();
      ctx.ellipse(o.x + o.width / 2, o.y + 8, o.width / 2, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c98a4b';
      ctx.beginPath();
      ctx.ellipse(o.x + o.width / 2 - 18, o.y + 7, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.kind === 'knife') {
      // Landing marker on the ground so the player can see where it falls.
      ctx.fillStyle = 'rgba(255, 77, 77, 0.55)';
      ctx.beginPath();
      ctx.ellipse(o.x + o.width / 2, FIELD.groundY + 8, 26, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff4d4d';
      ctx.font = 'bold 18px ' + FONT;
      ctx.fillText('!', o.x + o.width / 2 - 3, FIELD.groundY - 6);
      ctx.save();
      ctx.translate(o.x + o.width / 2, o.y + o.height / 2);
      ctx.fillStyle = '#c9ced6';
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(7, 6);
      ctx.lineTo(-7, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7a4a26';
      ctx.fillRect(-5, 6, 10, 24);
      ctx.restore();
    }
  }

  function drawPickup(p, time) {
    const bobY = Math.sin(p.bob) * 4;
    const x = p.x;
    const y = p.y + bobY;
    if (p.kind === 'corn') {
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath();
      ctx.ellipse(x, y, 9, 15, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5da24a';
      ctx.beginPath();
      ctx.ellipse(x, y + 14, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'goldcorn') {
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.ellipse(x, y, 10, 16, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff7e6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 20 + Math.sin(time * 6) * 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'pie') {
      ctx.fillStyle = '#c98a4b';
      ctx.beginPath();
      ctx.moveTo(x - 15, y + 8);
      ctx.lineTo(x + 15, y + 8);
      ctx.lineTo(x, y - 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e5534b';
      ctx.beginPath();
      ctx.arc(x, y - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Feather shield.
      ctx.fillStyle = '#fff7e6';
      ctx.beginPath();
      ctx.ellipse(x, y, 7, 14, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 12);
      ctx.lineTo(x + 4, y + 12);
      ctx.stroke();
    }
  }

  function drawHaystack(h) {
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.moveTo(h.x, h.y + h.height);
    ctx.quadraticCurveTo(h.x + h.width / 2, h.y - 26, h.x + h.width, h.y + h.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a87c1f';
    ctx.lineWidth = 3;
    for (let i = 1; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(h.x + (h.width * i) / 5, h.y + h.height - 6);
      ctx.quadraticCurveTo(h.x + (h.width * i) / 5 + 8, h.y + 30, h.x + (h.width * i) / 5, h.y + 8);
      ctx.stroke();
    }
    ctx.fillStyle = '#2e1808';
    ctx.font = 'bold 13px ' + FONT;
    ctx.fillText('HIDE — slide here', h.x + 8, h.y + h.height - 8);
  }

  function drawHud(s, best, muted) {
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, 14, 12, 780, 64, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 26px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${s.score}`, 30, 40);
    ctx.font = 'bold 20px ' + FONT;
    ctx.fillText(`${Math.floor(s.distance)} m / ${WIN_DISTANCE} m`, 30, 64);
    ctx.fillStyle = PALETTE.accent;
    ctx.font = 'bold 20px ' + FONT;
    ctx.fillText(STAGES[s.stageIndex].name, 300, 40);
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(`BEST ${best}`, 300, 64);
    // Lives: three hearts, filled red while alive, grey when lost.
    for (let i = 0; i < 3; i += 1) {
      const hx = 612 + i * 36;
      const hy = 36;
      ctx.fillStyle = i < s.lives ? '#ff2e4d' : 'rgba(255,255,255,0.22)';
      ctx.strokeStyle = i < s.lives ? '#7a0e1e' : 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx - 6, hy - 3, 7, 0, Math.PI * 2);
      ctx.arc(hx + 6, hy - 3, 7, 0, Math.PI * 2);
      ctx.moveTo(hx - 12, hy - 2);
      ctx.lineTo(hx + 12, hy - 2);
      ctx.lineTo(hx, hy + 13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // Stamina bar.
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, 596, 56, 120, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#4dd0e1';
    roundRect(ctx, 596, 56, 120 * (s.stamina / 100), 10, 5);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = '13px ' + FONT;
    ctx.fillText('DASH [Shift]', 596, 84);
    // Farmer proximity warning.
    const farmer = s.farmerGap;
    const danger = farmer < 140;
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, W - 330, 12, 316, 64, 12);
    ctx.fill();
    ctx.fillStyle = danger ? PALETTE.danger : PALETTE.text;
    ctx.font = 'bold 19px ' + FONT;
    ctx.fillText(danger ? '⚠ FARMER CLOSE — DASH!' : 'Farmer behind you…', W - 314, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, W - 314, 50, 284, 10, 5);
    ctx.fill();
    ctx.fillStyle = danger ? PALETTE.danger : '#7ee081';
    roundRect(ctx, W - 314, 50, 284 * Math.min(1, farmer / 230), 10, 5);
    ctx.fill();
    if (muted) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 16px ' + FONT;
      ctx.fillText('🔇 M — sound off', W - 314, 100);
    }
    // Distance progress to the forest gate.
    ctx.fillStyle = 'rgba(46, 24, 8, 0.7)';
    roundRect(ctx, 14, H - 30, W - 28, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#7ee081';
    roundRect(ctx, 14, H - 30, (W - 28) * Math.min(1, s.distance / WIN_DISTANCE), 16, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 13px ' + FONT;
    ctx.fillText('🌲 FOREST GATE — freedom!', W - 210, H - 34);
  }

  function panel(title, lines, accent) {
    ctx.fillStyle = 'rgba(20, 10, 4, 0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, W / 2 - 330, 110, 660, 440, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    roundRect(ctx, W / 2 - 330, 110, 660, 440, 18);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = 'bold 52px ' + FONT;
    ctx.fillText(title, W / 2, 190);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '22px ' + FONT;
    lines.forEach((line, i) => ctx.fillText(line, W / 2, 248 + i * 40));
    ctx.textAlign = 'left';
  }

  function draw(state, screen, best, muted = false) {
    const s = state;
    const time = s.time;
    ctx.save();
    if (s.shake > 0) {
      ctx.translate((Math.random() - 0.5) * 14 * s.shake, (Math.random() - 0.5) * 14 * s.shake);
    }
    sky(s.stageIndex);
    if (s.stageIndex !== 2) clouds(s.scroll);
    farmBackdrop(s.stageIndex, s.scroll);
    ground(s.stageIndex);
    for (const h of s.haystacks) drawHaystack(h);
    for (const p of s.pickups) drawPickup(p, time);
    for (const o of s.obstacles) drawObstacle(o, time);
    for (const k of s.thrownKnives) {
      ctx.save();
      ctx.translate(k.x + k.width / 2, k.y + k.height / 2);
      ctx.rotate(k.spin);
      ctx.fillStyle = '#c9ced6';
      ctx.fillRect(-22, -3, 34, 6);
      ctx.fillStyle = '#7a4a26';
      ctx.fillRect(12, -4, 12, 8);
      ctx.restore();
    }
    for (const p of s.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.colour;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
    }
    // The farmer trails the turkey from the left.
    const farmerX = s.turkey.x - s.farmerGap - 70;
    if (farmerX > -120) drawFarmer(farmerX, s.farmerMood, time);
    drawTurkey(s.turkey, time);

    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      drawHud({ ...s, farmerGap: s.farmerGap }, best, muted);
      ctx.fillStyle = PALETTE.text;
      ctx.font = '15px ' + FONT;
      ctx.fillText('← → move · Space jump ×2 · ↓ slide / hide in hay · Shift dash · P pause · M sound', 16, H - 44);
    }
    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(20, 10, 4, 0.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.accent;
      ctx.font = 'bold 84px ' + FONT;
      ctx.fillText('🦃 GOBBLE RUN', W / 2, 180);
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 30px ' + FONT;
      ctx.fillText('The Great Turkey Escape', W / 2, 228);
      ctx.font = '22px ' + FONT;
      ctx.fillText('Thanksgiving is coming. The farmer is coming faster.', W / 2, 272);
      ctx.fillText('Outrun him through the farmyard, the barn and the kitchen —', W / 2, 306);
      ctx.fillText('jump the fences, dodge the carving knives, hide in the hay,', W / 2, 336);
      ctx.fillText('and reach the forest gate 1000 m away. Get caught and you are dinner.', W / 2, 366);
      ctx.fillStyle = '#7ee081';
      ctx.font = 'bold 24px ' + FONT;
      ctx.fillText('← → move · SPACE jump (twice!) · ↓ slide & hide · SHIFT dash', W / 2, 424);
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 28px ' + FONT;
      ctx.fillText('Press SPACE or CLICK to start', W / 2, 480);
      ctx.font = '20px ' + FONT;
      ctx.fillText(`Best score: ${best}   ·   3 lives   ·   corn feeds you, feathers shield you`, W / 2, 520);
      ctx.textAlign = 'left';
    }
    if (screen === SCREEN_PAUSED) {
      panel('PAUSED', ['The farmer waits for no turkey.', 'Press P or Space to keep running.'], PALETTE.accent);
    }
    if (screen === SCREEN_OVER) {
      const caught = s.cause === 'caught';
      panel(caught ? 'CAUGHT!' : 'DINNER TIME…', [
        caught ? 'The farmer grabbed you by the drumstick.' : 'Three hits — the oven wins this round.',
        `You ran ${Math.floor(s.distance)} m and scored ${s.score}.`,
        `Best score: ${Math.max(best, s.score)}`,
        'Press SPACE or CLICK to run again.',
      ], PALETTE.danger);
    }
    if (screen === SCREEN_WIN) {
      panel('🦃 ESCAPED!', [
        'You burst through the forest gate — free!',
        `1000 m in ${s.time.toFixed(1)} s · score ${s.score} (+500 escape bonus)`,
        `Best score: ${Math.max(best, s.score)}`,
        'Press SPACE or CLICK to run again.',
      ], '#7ee081');
    }
    ctx.restore();
  }

  return { draw, fit };
}
