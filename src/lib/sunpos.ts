// Helper constants
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

// Julian day
function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function julianCentury(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

// Core solar calculations
function geomMeanLongSun(t: number): number {
  return (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
}

function geomMeanAnomalySun(t: number): number {
  return 357.52911 + t * (35999.05029 - 0.0001537 * t);
}

function eccentEarthOrbit(t: number): number {
  return 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
}

function sunEqOfCenter(t: number): number {
  const m = geomMeanAnomalySun(t) * RAD;
  return Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t))
       + Math.sin(2 * m) * (0.019993 - 0.000101 * t)
       + Math.sin(3 * m) * 0.000289;
}

function sunTrueLong(t: number): number {
  return geomMeanLongSun(t) + sunEqOfCenter(t);
}

function sunAppLong(t: number): number {
  const omega = 125.04 - 1934.136 * t;
  return sunTrueLong(t) - 0.00569 - 0.00478 * Math.sin(omega * RAD);
}

function meanObliqEcliptic(t: number): number {
  return 23 + (26 + ((21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60)) / 60;
}

function obliqCorr(t: number): number {
  const omega = 125.04 - 1934.136 * t;
  return meanObliqEcliptic(t) + 0.00256 * Math.cos(omega * RAD);
}

function sunDeclination(t: number): number {
  const e = obliqCorr(t) * RAD;
  const lambda = sunAppLong(t) * RAD;
  return Math.asin(Math.sin(e) * Math.sin(lambda)) * DEG;
}

function eqOfTime(t: number): number {
  const epsilon = obliqCorr(t) * RAD;
  const l0 = geomMeanLongSun(t) * RAD;
  const e = eccentEarthOrbit(t);
  const m = geomMeanAnomalySun(t) * RAD;

  const y = Math.tan(epsilon / 2) ** 2;

  return 4 * DEG * (y * Math.sin(2 * l0)
    - 2 * e * Math.sin(m)
    + 4 * e * y * Math.sin(m) * Math.cos(2 * l0)
    - 0.5 * y * y * Math.sin(4 * l0)
    - 1.25 * e * e * Math.sin(2 * m));
}

// Main function
export function getSubsolarCoordinates(date: Date): [number, number] {
  const jd = julianDay(date);
  const t = julianCentury(jd);
  const decl = sunDeclination(t);

  const utcMidnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const deltaDays = (utcMidnight.getTime() - date.getTime()) / 86400000;

  const lng = ((deltaDays * 360) - eqOfTime(t) / 4 + 540) % 360 - 180; // normalize [-180,180]

  return [lng, decl];
}
