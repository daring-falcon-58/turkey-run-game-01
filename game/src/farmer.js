// The farmer: the chaser behind every run. He has three moods, and the
// player can read all three from the screen and the warning bar:
//  - chase: he gains ground whenever the turkey dawdles or stumbles;
//  - search: the turkey is hidden in a haystack, so he stops, looks around
//    and loses ground while he searches the wrong bales;
//  - corner: he is close enough to lunge, and the turkey must dash or jump
//    away now or be grabbed.
// The gap is measured in pixels behind the turkey; catchGap means caught.
import { FARMER } from './config.js';

export const MOOD_CHASE = 'chase';
export const MOOD_SEARCH = 'search';
export const MOOD_CORNER = 'corner';

export function createFarmer() {
  const state = {
    gap: FARMER.startGap,
    mood: MOOD_CHASE,
    searchTimer: 0,
    lungeTimer: 0,
    gobbleCooldown: 0,
  };

  return {
    state,
    reset() {
      state.gap = FARMER.startGap;
      state.mood = MOOD_CHASE;
      state.searchTimer = 0;
      state.lungeTimer = 0;
      state.gobbleCooldown = 0;
    },
    /** x position of the farmer, given the turkey's x. */
    x(turkeyX) {
      return turkeyX - state.gap - 70;
    },
    isCornered() {
      return state.gap <= FARMER.cornerGap;
    },
    update(dt, hidden, turkeyRunning) {
      state.gobbleCooldown = Math.max(0, state.gobbleCooldown - dt);
      if (hidden) {
        // The turkey vanished into the hay: the farmer stops and searches.
        state.mood = MOOD_SEARCH;
        state.searchTimer = FARMER.searchSeconds;
        state.gap += 26 * dt;
        return { gobble: false };
      }
      if (state.searchTimer > 0) {
        state.searchTimer -= dt;
        state.mood = MOOD_SEARCH;
        state.gap += 10 * dt;
        if (state.searchTimer <= 0) state.mood = MOOD_CHASE;
        return { gobble: false };
      }
      // He gains a little every second, faster when the turkey walks.
      state.gap -= FARMER.gainPerSecond * dt * (turkeyRunning ? 1 : 1.9);
      if (state.gap <= FARMER.cornerGap) {
        state.mood = MOOD_CORNER;
        state.lungeTimer += dt;
        // A cornered farmer lunges in bursts: the gap snaps shut, then he
        // stumbles and the turkey gets a breath.
        if (state.lungeTimer > 0.9) {
          state.gap -= 26;
          state.lungeTimer = 0;
        }
      } else {
        state.mood = MOOD_CHASE;
        state.lungeTimer = 0;
      }
      let gobble = false;
      if (state.gap <= FARMER.cornerGap + 40 && state.gobbleCooldown <= 0) {
        gobble = true;
        state.gobbleCooldown = 1.6;
      }
      return { gobble };
    },
    onHit() {
      // A stumble lets him close in fast.
      state.gap -= FARMER.hitPenalty;
    },
    onDash() {
      state.gap += FARMER.dashReward;
    },
    onCorn() {
      state.gap += FARMER.cornReward;
    },
    caught() {
      return state.gap <= FARMER.catchGap;
    },
  };
}
