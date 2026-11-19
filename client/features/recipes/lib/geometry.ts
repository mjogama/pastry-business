/** §4.1 carousel geometry for a card at signed distance `d` from the center (in cards). */
export function cardGeometry(d: number) {
  const ad = Math.abs(d);
  const x = ad <= 1 ? d : Math.sign(d) * (1 + (ad - 1) * 0.78); // in `spacing` units
  return {
    x,
    scale: 1 - Math.min(ad, 2.2) * 0.17,
    rotate: Math.min(7, Math.max(-7, d * 3.5)),
    opacity: Math.max(0, 1 - Math.min(ad, 3) * 0.3),
    brightness: 1 - Math.min(ad, 1) * 0.32,
    zIndex: 100 - Math.round(ad * 10),
    hidden: ad > 2.6,
  };
}
