/**
 * Anatomy-style isometric Voice Policy machine.
 * Run: node scripts/build-voice-machine.mjs
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../components/landing/voice-machine.svg");
const WIDTH = 720;
const HEIGHT = 340;

const PLATE = { x: -170, y: -55, w: 340, d: 110, r: 6 };
const PLATE_H = 10;
const FOOT_H = 5;

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 70),
    [-140, 0, 55],
    [150, 0, 55],
  ],
  WIDTH,
  HEIGHT,
  { pad: 28, azimuth: 40 },
);

const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const at = (point) => k.iso(point, P);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 18))) {
    out.push(S(k.cylinder(x, y, 6, -PLATE_H - FOOT_H, 1.4, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 4.8, -PLATE_H - FOOT_H + 1.4, FOOT_H - 1.4, P, 24), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 4), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  const strip = { x: -150, y: PLATE.y + PLATE.d - 12, w: 300, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 6, strip.x + strip.w - 6, 5, 5, strip.y + 0.7, 0.6, [2, 3.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  return `<g id="part-base">${out.join("")}</g>`;
}

function rail() {
  const out = [];
  for (const y of [-8, 8]) {
    out.push(S(k.slabOf({ x: -130, y, w: 260, d: 3.5, r: 0.8 }, 0.4, 2.2, P, 3, 0.3), { tone: "lo" }));
  }
  return `<g id="part-rail">${out.join("")}</g>`;
}

function mic() {
  const out = [];
  const base = { x: -148, y: -14, w: 28, d: 28, r: 3 };
  out.push(S(k.slabOf(base, 0, 4, P, 6, 0.6), { tone: "mid" }));
  out.push(S(k.cylinder(-134, 0, 5, 4, 22, P, 24, 0.4), { tone: "hi", lit: true }));
  out.push(S(k.cylinder(-134, 0, 7, 26, 4, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(-134, 0, 11, 30, 3, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(-134, 0, 14, 33, 2, P, 28), { tone: "mid" }));
  out.push(L(k.ring(-134, 0, 14.5, 35, P, 28), { tone: "hi" }));
  return `<g id="part-mic" data-stage="0">${out.join("")}</g>`;
}

function tumblers() {
  const out = [];
  const housing = { x: -100, y: -22, w: 42, d: 44, r: 3 };
  out.push(S(k.slabOf(housing, 0, 48, P, 6, 1), { tone: "mid" }));
  out.push(L(k.sideSeam(housing, 24, P, 6), { tone: "faint" }));
  for (let i = 0; i < 3; i++) {
    const y = -12 + i * 12;
    const slot = { x: -94, y: y - 4, w: 30, d: 8, r: 1 };
    out.push(S(k.slabOf(slot, 8, 2, P, 3), { tone: "lo", crease: "none" }));
    out.push(S(k.cylinder(-80, y, 3.2, 10, 18 + i * 4, P, 16, 0.3), { tone: "hi", lit: true }));
    out.push(S(k.slabOf({ x: -86, y: y - 3, w: 10, d: 6, r: 1 }, 28 + i * 4, 4, P, 3, 0.3), { tone: "lo" }));
  }
  const label = { x: -96, y: 14, w: 34, d: 6, r: 1 };
  out.push(S(k.slabOf(label, 49, 1, P, 3), { tone: "lo" }));
  return `<g id="part-tumblers" data-stage="1">${out.join("")}</g>`;
}

function speaker() {
  const out = [];
  const base = { x: -40, y: -16, w: 32, d: 32, r: 3 };
  out.push(S(k.slabOf(base, 0, 6, P, 6, 0.6), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -34, y: -10, w: 20, d: 20, r: 2 }, 6, 18, P, 5, 0.5), { tone: "hi", lit: true }));
  out.push(S(k.cylinder(-24, 0, 8, 24, 4, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(-24, 0, 12, 28, 3, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(-24, 0, 16, 31, 2.5, P, 28), { tone: "mid" }));
  out.push(L(k.ring(-24, 0, 16.5, 33.5, P, 28), { tone: "hi" }));
  return `<g id="part-speaker" data-stage="2">${out.join("")}</g>`;
}

function key() {
  const out = [];
  const plate = { x: 10, y: -18, w: 36, d: 36, r: 3 };
  out.push(S(k.slabOf(plate, 0, 5, P, 6, 0.6), { tone: "mid" }));
  out.push(S(k.cylinder(28, 0, 10, 5, 6, P, 28, 0.4), { tone: "hi", lit: true }));
  out.push(S(k.cylinder(28, 0, 4, 11, 4, P, 20), { tone: "lo" }));
  out.push(S(k.slabOf({ x: 36, y: -3, w: 18, d: 6, r: 1 }, 12, 3, P, 3, 0.2), { tone: "hi", lit: true }));
  out.push(S(k.slabOf({ x: 48, y: -2, w: 6, d: 4, r: 0.5 }, 12, 5, P, 3), { tone: "lo" }));
  out.push(D([at([28, 0, 15])], { size: 0.8 }));
  return `<g id="part-key" data-stage="3">${out.join("")}</g>`;
}

function gate() {
  const out = [];
  const postL = { x: 70, y: -20, w: 8, d: 40, r: 1 };
  const postR = { x: 98, y: -20, w: 8, d: 40, r: 1 };
  out.push(S(k.slabOf(postL, 0, 52, P, 4, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf(postR, 0, 52, P, 4, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf({ x: 70, y: -20, w: 36, d: 8, r: 1 }, 52, 5, P, 4, 0.4), { tone: "hi", lit: true }));
  out.push(S(k.slabOf({ x: 78, y: -16, w: 20, d: 32, r: 1 }, 4, 44, P, 4, 0.3), { tone: "lo" }));
  for (let i = 0; i < 4; i++) {
    const z = 12 + i * 9;
    out.push(L(k.segment([88, -16, z], [88, 16, z], P), { tone: "faint" }));
  }
  return `<g id="part-gate" data-stage="4">${out.join("")}</g>`;
}

function chutes() {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const x = 118 + i * 18;
    const hopper = { x: x - 6, y: -14, w: 14, d: 28, r: 1.5 };
    out.push(S(k.slabOf(hopper, 28, 8, P, 4, 0.4), { tone: i === 1 ? "lo" : "mid" }));
    out.push(S(k.slabOf({ x: x - 4, y: -10, w: 10, d: 20, r: 1 }, 14, 14, P, 4, 0.3), { tone: "hi", lit: i !== 1 }));
    out.push(S(k.slabOf({ x: x - 3, y: -8, w: 8, d: 16, r: 1 }, 0, 14, P, 3, 0.3), { tone: "mid" }));
    out.push(S(k.slabOf({ x: x - 5, y: -10, w: 12, d: 20, r: 1 }, -2, 2, P, 3), { tone: "lo" }));
    out.push(D([at([x, 0, 36])], { size: 1.1 }));
  }
  return `<g id="part-chutes" data-stage="5">${out.join("")}</g>`;
}

const kitCss = readFileSync(join(HERE, "../kit/iso.css"), "utf8");
const stageCss = `
.iso-svg [data-stage] { opacity: 0.34; transition: opacity 180ms ease; cursor: pointer; }
.iso-svg [data-stage].is-active { opacity: 1; }
.iso-svg.is-all [data-stage] { opacity: 1; }
#part-base, #part-rail { opacity: 1 !important; }
`;

const body = [plate(), rail(), mic(), tumblers(), speaker(), key(), gate(), chutes()].join("");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" class="iso iso-svg" data-theme="light" role="img" aria-label="Isometric Voice Policy machine">
  <style>
${kitCss}
${stageCss}
  </style>
  <rect width="100%" height="100%" fill="var(--anatomy-page)"/>
  ${body}
</svg>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log("wrote", OUT, "bytes", Buffer.byteLength(svg));
