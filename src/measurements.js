 function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

export function getMeasurementValue(
  log,
  measurements,
  measurementName,
  fallbackValue,
) {
  const measurementValue = _optionalChain([measurements, 'access', _ => _.find, 'call', _2 => _2((element) => element.name === measurementName), 'optionalAccess', _3 => _3.value]);

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
