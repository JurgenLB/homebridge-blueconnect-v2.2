import type { Logging } from 'homebridge';

export function getMeasurementValue(
  log: Logging,
  measurements: Array<{ name: string; value: string | number }>,
  measurementName: string,
  fallbackValue: number,
): number {
  const measurementValue = measurements.find((element) => element.name === measurementName)?.value;

  if (measurementValue == null) {
    log.warn(`Missing ${measurementName} measurement, keeping previous value: ${fallbackValue}`);

    return fallbackValue;
  }

  const numericValue = Number(measurementValue);

  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  log.warn(`Invalid ${measurementName} measurement value, keeping previous value: ${fallbackValue}`);

  return fallbackValue;
}
