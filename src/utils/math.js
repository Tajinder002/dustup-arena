export function randomInteger(maximum) {
  return Math.floor(Math.random() * maximum);
}

export function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}
