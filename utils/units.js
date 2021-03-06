export const UNITS = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
export const FRACTIONAL = ['', 'm', 'u', 'n', 'p', 'f', 'a', 'z', 'y']; // milli micro nano pico femto

export function formatSi(inValue, {
  increment = 1000,
  addSuffix = true,
  suffix = '',
  firstSuffix = null,
  startingExponent = 0,
  minExponent = 0,
  maxExponent = 99,
  maxPrecision = 2
} = {}) {
  let val = inValue;
  let exp = startingExponent;

  // TODO More to think about re: min > max
  while ( ( val >= increment && exp + 1 < UNITS.length && exp < maxExponent ) || exp < minExponent ) {
    val = val / increment;
    exp++;
  }

  let out = '';

  if ( val < 10 && maxPrecision >= 2 ) {
    out = `${ Math.round(val * 100) / 100 }`;
  } else if ( val < 100 && maxPrecision >= 1) {
    out = `${ Math.round(val * 10) / 10 }`;
  } else {
    out = `${ Math.round(val) }`;
  }

  if ( addSuffix ) {
    if ( exp === 0 && firstSuffix !== null) {
      out += ` ${ firstSuffix }`;
    } else {
      out += ` ${ UNITS[exp] }${ suffix }` || '';
    }
  }

  return out;
}

export function exponentNeeded(val, increment = 1000) {
  let exp = 0;

  while ( val >= increment ) {
    val = val / increment;
    exp++;
  }

  return exp;
}

export function parseSi(inValue, { increment = null, allowFractional = true } = {}) {
  if ( !inValue || typeof inValue !== 'string' || !inValue.length ) {
    return NaN;
  }

  inValue = inValue.replace(/,/g, '');

  // eslint-disable-next-line prefer-const
  let [, valStr, unit, incStr] = inValue.match(/^([0-9.-]+)\s*([^0-9.-]?)([^0-9.-]?)/);
  const val = parseFloat(valStr);

  if ( !unit ) {
    return val;
  }

  // micro "mu" symbol -> u
  if ( unit.charCodeAt(0) === 181 ) {
    unit = 'u';
  }

  const divide = FRACTIONAL.includes(unit);
  const multiply = UNITS.includes(unit.toUpperCase());

  if ( increment === null ) {
    // Automatically handle 1 KB = 1000B, 1 KiB = 1024B if no increment set
    if ( (multiply || divide) && incStr === 'i' ) {
      increment = 1024;
    } else {
      increment = 1000;
    }
  }

  if ( divide && allowFractional ) {
    const exp = FRACTIONAL.indexOf(unit);

    return val / (increment ** exp);
  }

  if ( multiply ) {
    const exp = UNITS.indexOf(unit.toUpperCase());

    return val * (increment ** exp);
  }

  // Unrecognized unit character
  return val;
}

export function formatFontSize(val, initWidth = 1920) {
  const nowClientWidth = document.documentElement.clientWidth;
  const rate = nowClientWidth < initWidth ? 1.2 : 0.9;

  // return val * (nowClientWidth / initWidth) * rate;

  // just resize for small screen
  if (nowClientWidth < initWidth) {
    return val * (nowClientWidth / initWidth) * rate;
  }

  return val;
}

export function formatCPUValue(cpuValue) {
  const value = parseInt(cpuValue, 10);

  if (!value) {
    return 0;
  }

  if (/n/.test(cpuValue)) {
    return value; // unit n
  } else if (/m/.test(cpuValue)) {
    return value * 1000 * 1000; // unit m
  } else if (/\u/.test(cpuValue)) {
    return value * 1000 * 10; // 100u=1m
  }

  return value * 1000 * 1000 * 1000; // core
}

export function formatMemoryValue(memoryValue) {
  return parseInt(memoryValue, 10) || 0;
}

export default {
  exponentNeeded,
  formatSi,
  parseSi,
  formatFontSize,
  formatCPUValue,
  formatMemoryValue
};
