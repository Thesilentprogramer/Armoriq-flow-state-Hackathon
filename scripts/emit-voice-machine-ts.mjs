import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const svgPath = join(HERE, "../components/landing/voice-machine.svg");
const tsPath = join(HERE, "../components/landing/voice-machine-svg.ts");
const publicPath = join(HERE, "../public/voice-machine.svg");

const svg = readFileSync(svgPath, "utf8").replace(/^<\?xml[^>]*>\s*/, "");
writeFileSync(tsPath, `export const VOICE_MACHINE_SVG = ${JSON.stringify(svg)};\n`);
copyFileSync(svgPath, publicPath);
console.log("emitted", tsPath);
