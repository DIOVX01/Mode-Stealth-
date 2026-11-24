// Weighted up/down staircase (Kaernbach 1991): +UP on correct, -DOWN on wrong
// settles where p·UP = (1−p)·DOWN, i.e. ~85% correct (Wilson et al. 2019).
export const UP = 0.15;
export const DOWN = 0.85;

export const step = (level, correct, maxLevel) =>
  Math.min(maxLevel, Math.max(1, level + (correct ? UP : -DOWN)));

export const tier = level => Math.floor(level);
