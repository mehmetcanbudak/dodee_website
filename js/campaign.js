/**
 * Launch + campaign config (Europe/Istanbul).
 * Adjust CAMPAIGN_START_YMD / CLUE_END_YMD if the clue window changes.
 */

/** Episode 1 air time in Turkey */
export const LAUNCH_ISO = "2026-04-23T09:00:00+03:00";

/** First day of the 13-day clue run (inclusive), Istanbul calendar date */
export const CAMPAIGN_START_YMD = "2026-04-10";

/** Last clue day (inclusive) — day 13 */
export const CLUE_END_YMD = "2026-04-22";

const TZ = "Europe/Istanbul";

/**
 * @param {Date} [now]
 * @returns {string} YYYY-MM-DD in Istanbul
 */
export function getIstanbulYmd(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Previous calendar day in Istanbul (for streak continuity).
 * @param {Date} [now]
 * @returns {string} YYYY-MM-DD
 */
export function getIstanbulYesterdayYmd(now = new Date()) {
  const ymd = getIstanbulYmd(now);
  const [y, m, d] = ymd.split("-").map(Number);
  const utcNoon = Date.UTC(y, m - 1, d, 12, 0, 0);
  return getIstanbulYmd(new Date(utcNoon - 86400000));
}

/**
 * @param {string} ymd
 * @returns {number}
 */
function ymdToUtcNoonMs(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d, 12, 0, 0);
}

/**
 * Clue day index: 0 = before campaign, 1–13 = active, 14 = after last clue day
 * @param {Date} [now]
 * @returns {number}
 */
export function getClueDayIndex(now = new Date()) {
  const ymd = getIstanbulYmd(now);
  if (ymd < CAMPAIGN_START_YMD) return 0;
  if (ymd > CLUE_END_YMD) return 14;
  const start = ymdToUtcNoonMs(CAMPAIGN_START_YMD);
  const cur = ymdToUtcNoonMs(ymd);
  const diffDays = Math.round((cur - start) / 86400000);
  return diffDays + 1;
}

/** @typedef {'RED' | 'GREEN' | 'BLUE'} DodeeColor */

/** Simple deterministic color from Istanbul date */
export function getColorOfDay(now = new Date()) {
  const ymd = getIstanbulYmd(now);
  let hash = 0;
  for (let i = 0; i < ymd.length; i++) {
    hash = (hash * 31 + ymd.charCodeAt(i)) | 0;
  }
  const mod = Math.abs(hash) % 3;
  /** @type {const} */
  const colors = ["RED", "GREEN", "BLUE"];
  return colors[mod];
}

export function getLaunchInstantMs() {
  return Date.parse(LAUNCH_ISO);
}
