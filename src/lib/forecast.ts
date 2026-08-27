export type DailyPoint = { day: string; value: number };

export function movingAverageForecast(history: DailyPoint[], minDays = 14) {
  if (history.length < minDays) {
    return {
      insufficient: true as const,
      message: "Insufficient historical data.",
      mean: null,
      low: null,
      high: null,
      confidence: "LOW" as const,
      trend: "UNKNOWN" as const,
    };
  }

  const values = history.map((point) => point.value);
  const window = values.slice(-7);
  const mean = window.reduce((sum, n) => sum + n, 0) / window.length;
  const variance =
    window.reduce((sum, n) => sum + (n - mean) ** 2, 0) / Math.max(window.length - 1, 1);
  const stdev = Math.sqrt(variance);
  const earlier =
    values.slice(-14, -7).reduce((sum, n) => sum + n, 0) / Math.max(values.slice(-14, -7).length, 1);
  const delta = earlier === 0 ? 0 : (mean - earlier) / earlier;
  const trend = delta > 0.05 ? "UP" : delta < -0.05 ? "DOWN" : "STABLE";

  return {
    insufficient: false as const,
    message: null,
    mean: Math.round(mean),
    low: Math.max(0, Math.round(mean - 1.5 * stdev)),
    high: Math.round(mean + 1.5 * stdev),
    confidence: stdev / Math.max(mean, 1) < 0.15 ? ("HIGH" as const) : ("MEDIUM" as const),
    trend,
    delta,
  };
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return (current - previous) / previous;
}
