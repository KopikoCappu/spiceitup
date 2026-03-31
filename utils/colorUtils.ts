// utils/colorUtils.ts
// developed by Claude code
export function hexToPastel(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const pastelR = Math.round(r * 0.15 + 255 * 0.85);
  const pastelG = Math.round(g * 0.15 + 255 * 0.85);
  const pastelB = Math.round(b * 0.15 + 255 * 0.85);
  return `rgb(${pastelR}, ${pastelG}, ${pastelB})`;
}