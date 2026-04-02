export interface FontFitOptions {
  min: number;
  max: number;
  precision?: number;
  fits: (size: number) => boolean;
}

export function resolveFittingFontSize({ min, max, precision = 0.25, fits }: FontFitOptions) {
  const boundedMin = Math.max(1, Math.min(min, max));
  const boundedMax = Math.max(boundedMin, max);

  if (!fits(boundedMin)) {
    return boundedMin;
  }

  if (fits(boundedMax)) {
    return boundedMax;
  }

  let low = boundedMin;
  let high = boundedMax;
  let best = boundedMin;

  while (high - low > precision) {
    const probe = (low + high) / 2;

    if (fits(probe)) {
      best = probe;
      low = probe;
    } else {
      high = probe;
    }
  }

  return Number(best.toFixed(2));
}
