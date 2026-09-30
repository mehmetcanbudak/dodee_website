/**
 * Archived clue campaign config (Europe/Istanbul).
 * These dates document the completed April campaign. The public archive is static;
 * changing the clock or these constants does not activate a new campaign.
 * A future campaign needs approved dates and content plus a new implementation.
 */

/** First day of the 13-day clue run (inclusive), Istanbul calendar date */
export const CAMPAIGN_START_YMD = "2026-04-10";

/** Last clue day (inclusive) — day 13 */
export const CLUE_END_YMD = "2026-04-22";

const TZ = "Europe/Istanbul";
const dateFormatter = new Intl.DateTimeFormat("en", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * @param {Date} [now]
 * @returns {string} YYYY-MM-DD in Istanbul
 */
export function getIstanbulYmd(now = new Date()) {
  const parts = dateFormatter.formatToParts(now);
  const part = (type) => parts.find((value) => value.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
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
 * Historical clue day index: 0 = before its window, 1–13 = its clue days,
 * 14 = after the last day. This does not enable the archived public feature.
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

/** The same Istanbul calendar day has the same color in every visitor's timezone. */
export function getColorOfDay(now = new Date()) {
  const ymd = getIstanbulYmd(now);
  const [y, m, d] = ymd.split("-").map(Number);
  const dayOfYear = (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000;
  /** @type {const} */
  const colors = ["RED", "GREEN", "BLUE"];
  return colors[dayOfYear % 3];
}
