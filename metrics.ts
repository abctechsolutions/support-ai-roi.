import { TimeSavedBucket } from "@prisma/client";

export function conservativeMinutes(bucket: TimeSavedBucket): number {
  switch (bucket) {
    case "M1_2": return 1;
    case "M3_5": return 3;
    case "M6_10": return 6;
    case "M11_20": return 11;
    case "M20_PLUS": return 20;
    default: return 0;
  }
}

export function formatHours(minutes: number): string {
  const h = minutes / 60;
  return h.toFixed(h < 10 ? 1 : 0);
}
