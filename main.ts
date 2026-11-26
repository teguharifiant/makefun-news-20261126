// The World Today — Thursday 26 November 2026.
//
// A program that draws one newspaper front page (1024x1024 PNG) summing up
// the world's news of Thursday 26 November 2026, and writes it to
// /output/entry.png. Pure Node.js standard library, no network, fully
// deterministic: running it twice produces byte-identical output.
//
// The stories on the page (all first reported on 26 November 2026, or
// updated that day):
//   - Cairo: a fuel tanker overturned and exploded on the Giza Ring Road;
//     the death toll rose to at least 30 on 26 November (Reuters, Al Arabiya).
//   - Pyongyang: Kim Jong Un called for tactical nuclear weapons to be
//     deployed "across multiple domains" (KCNA, reported Thursday 26 Nov).
//   - Ras Tanura: the Houthis said they attacked Saudi Arabia's largest
//     refinery; Brent crude settled 3.5% higher at $94.61 (Reuters, 25 Nov
//     close, carried into Thursday's papers).
//   - Washington: the USTR proposed new Section 301 tariffs on 14 trading
//     partners, up to 40% for China (Reuters, 25 Nov).
//   - Savasleyka: Ukraine said it struck a Russian air base, damaging
//     three MiG-31 jets and two Su-34 bombers (Reuters, 25 Nov).
//   - Tiangong: Pakistan's Muhammad Zeeshan Ali became the first foreign
//     astronaut aboard China's space station (Shenzhou-24, 25 Nov).
//   - Mumbai marks 18 years since the 26/11 attacks; the United States
//     celebrates Thanksgiving Day.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const WIDTH = 1024;
const HEIGHT = 1024;

// ---------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------

const PAPER = [248, 244, 232];
const INK = [17, 17, 17];
const SOFT_INK = [68, 64, 56];
const RED = [178, 32, 44];
const DARK_RED = [122, 20, 30];
const BLUE = [28, 58, 96];
const NIGHT = [22, 30, 48];
const FLAME = [242, 120, 24];
const FLAME_YELLOW = [250, 196, 52];
const SMOKE = [120, 118, 112];
const ROAD = [38, 38, 40];
const GOLD = [176, 138, 44];

// ---------------------------------------------------------------------------
// A small 5x7 bitmap font. Every glyph is seven rows of five cells, "#" inked.
// Lowercase is folded to uppercase: the whole page is set in capitals, as a
// broadsheet front page would be.
// ---------------------------------------------------------------------------

type Glyph = string[];

const FONT: Record<string, Glyph> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "...#.", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  '"': [".#.#.", ".#.#.", ".....", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "(": ["...##", "..#..", ".#...", ".#...", ".#...", "..#..", "...##"],
  ")": ["##...", "..#..", "...#.", "...#.", "...#.", "..#..", "##..."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "%": ["#...#", "#..#.", "...#.", "..#..", ".#...", "#..#.", "#...#"],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "=": [".....", ".....", "#####", ".....", "#####", ".....", "....."],
  "*": [".....", ".#.#.", "..#..", "#####", "..#..", ".#.#.", "....."],
  $: ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "#": [".#.#.", ".#.#.", "#####", ".#.#.", "#####", ".#.#.", ".#.#."],
  "@": [".###.", "#...#", "#.###", "#.#.#", "#.###", "#....", ".###."],
  _: [".....", ".....", ".....", ".....", ".....", ".....", "#####"],
};

// ---------------------------------------------------------------------------
// The canvas: a plain RGB byte buffer, with tiny drawing primitives.
// ---------------------------------------------------------------------------

const px = new Uint8Array(WIDTH * HEIGHT * 3);

function fillRect(x: number, y: number, w: number, h: number, c: number[]): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(WIDTH, x + w);
  const y1 = Math.min(HEIGHT, y + h);
  for (let yy = y0; yy < y1; yy++) {
    let off = (yy * WIDTH + x0) * 3;
    for (let xx = x0; xx < x1; xx++) {
      px[off] = c[0];
      px[off + 1] = c[1];
      px[off + 2] = c[2];
      off += 3;
    }
  }
}

function setPixel(x: number, y: number, c: number[]): void {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const off = (y * WIDTH + x) * 3;
  px[off] = c[0];
  px[off + 1] = c[1];
  px[off + 2] = c[2];
}

function fillCircle(cx: number, cy: number, r: number, c: number[]): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPixel(x, y, c);
    }
  }
}

// A filled triangle, scanline by scanline.
function fillTriangle(
  ax: number, ay: number, bx: number, by: number, cx: number, cy: number,
  c: number[],
): void {
  const minY = Math.max(0, Math.min(ay, by, cy));
  const maxY = Math.min(HEIGHT - 1, Math.max(ay, by, cy));
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    const edges: Array<[number, number, number, number]> = [
      [ax, ay, bx, by],
      [bx, by, cx, cy],
      [cx, cy, ax, ay],
    ];
    for (const [x1, y1, x2, y2] of edges) {
      if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
        xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    if (xs.length >= 2) {
      const lo = Math.max(0, Math.floor(Math.min(xs[0], xs[1])));
      const hi = Math.min(WIDTH - 1, Math.ceil(Math.max(xs[0], xs[1])));
      for (let x = lo; x <= hi; x++) setPixel(x, y, c);
    }
  }
}

// ---------------------------------------------------------------------------
// Text. A glyph is 5 cells wide and 7 tall; scale s makes each cell s pixels.
// One blank cell column separates glyphs, so a character advances 6 * s.
// ---------------------------------------------------------------------------

function textWidth(text: string, scale: number): number {
  return text.length * 6 * scale - scale;
}

function drawText(x: number, y: number, text: string, scale: number, c: number[]): void {
  let cx = x;
  for (const raw of text) {
    const ch = raw.toUpperCase();
    const g = FONT[ch] ?? FONT["?"];
    for (let row = 0; row < 7; row++) {
      const line = g[row];
      for (let col = 0; col < 5; col++) {
        if (line[col] === "#") {
          fillRect(cx + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentered(x: number, y: number, w: number, text: string, scale: number, c: number[]): void {
  const tw = textWidth(text, scale);
  drawText(x + Math.floor((w - tw) / 2), y, text, scale, c);
}

// Greedy word wrap: returns the lines that fit inside maxWidth pixels.
function wrapText(text: string, scale: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const trial = cur === "" ? word : cur + " " + word;
    if (textWidth(trial, scale) <= maxWidth || cur === "") {
      cur = trial;
    } else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// Draw wrapped text; returns the y just below the last line.
function drawParagraph(
  x: number, y: number, text: string, scale: number, maxWidth: number,
  c: number[], lineGap = 4,
): number {
  const lines = wrapText(text, scale, maxWidth);
  const lineH = 7 * scale + lineGap;
  for (let i = 0; i < lines.length; i++) {
    drawText(x, y + i * lineH, lines[i], scale, c);
  }
  return y + lines.length * lineH;
}

// ---------------------------------------------------------------------------
// The front page.
// ---------------------------------------------------------------------------

const MARGIN = 32;
const CONTENT_W = WIDTH - 2 * MARGIN;

function rule(y: number, thickness: number, c: number[] = INK): void {
  fillRect(MARGIN, y, CONTENT_W, thickness, c);
}

function kicker(x: number, y: number, text: string): number {
  drawText(x, y, text, 2, RED);
  return y + 7 * 2 + 6;
}

function headline(x: number, y: number, text: string, scale: number, maxWidth: number): number {
  return drawParagraph(x, y, text, scale, maxWidth, INK, 5);
}

function drawMasthead(): void {
  // Paper background.
  fillRect(0, 0, WIDTH, HEIGHT, PAPER);

  // Thin gold frame around the whole page.
  fillRect(10, 10, WIDTH - 20, 3, GOLD);
  fillRect(10, HEIGHT - 13, WIDTH - 20, 3, GOLD);
  fillRect(10, 10, 3, HEIGHT - 20, GOLD);
  fillRect(WIDTH - 13, 10, 3, HEIGHT - 20, GOLD);

  // Dateline row.
  drawText(MARGIN, 30, "VOL. I - NO. 330", 2, SOFT_INK);
  drawTextCentered(MARGIN, 30, CONTENT_W, "THE DAY'S NEWS, IN ONE PAGE", 2, SOFT_INK);
  const rightTag = "PRICE: ONE DAY";
  drawText(WIDTH - MARGIN - textWidth(rightTag, 2), 30, rightTag, 2, SOFT_INK);
  rule(52, 2);

  // Nameplate.
  drawTextCentered(MARGIN, 66, CONTENT_W, "THE WORLD TODAY", 8, INK);
  // Red underline flourish under the nameplate.
  fillRect(MARGIN + 120, 132, CONTENT_W - 240, 4, RED);

  // Date line.
  drawTextCentered(MARGIN, 146, CONTENT_W, "THURSDAY, 26 NOVEMBER 2026", 3, DARK_RED);
  rule(178, 5);
  rule(187, 2);
}

// A small night scene for the lead story: a burning tanker on a ring road.
function drawFireScene(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, NIGHT);
  // Distant city lights.
  for (let i = 0; i < 14; i++) {
    const lx = x + 18 + ((i * 41) % (w - 40));
    const ly = y + 10 + ((i * 23) % 26);
    fillRect(lx, ly, 4, 4, FLAME_YELLOW);
  }
  // Smoke.
  fillCircle(x + Math.floor(w * 0.30), y + 26, 26, SMOKE);
  fillCircle(x + Math.floor(w * 0.34), y + 14, 20, SMOKE);
  fillCircle(x + Math.floor(w * 0.62), y + 30, 22, SMOKE);
  fillCircle(x + Math.floor(w * 0.66), y + 16, 16, SMOKE);
  // Flames rising from the tanker.
  const base = y + h - 34;
  fillTriangle(x + 150, base, x + 210, y + 34, x + 268, base, FLAME);
  fillTriangle(x + 230, base, x + 300, y + 18, x + 372, base, FLAME_YELLOW);
  fillTriangle(x + 330, base, x + 400, y + 44, x + 452, base, FLAME);
  fillTriangle(x + 96, base, x + 140, y + 58, x + 182, base, FLAME_YELLOW);
  // The road.
  fillRect(x, y + h - 30, w, 30, ROAD);
  fillRect(x, y + h - 16, w, 3, [220, 210, 180]);
  // Overturned tanker and cars, picked out in the firelight.
  fillRect(x + 210, y + h - 62, 150, 30, [90, 26, 22]);
  fillRect(x + 230, y + h - 76, 60, 16, [120, 34, 26]);
  fillRect(x + 60, y + h - 52, 70, 20, [200, 190, 170]);
  fillRect(x + 440, y + h - 52, 70, 20, [180, 60, 40]);
  // Ambulance lights.
  fillRect(x + 500, y + h - 56, 44, 24, [240, 240, 235]);
  fillRect(x + 508, y + h - 64, 12, 8, RED);
  fillRect(x + 524, y + h - 64, 12, 8, BLUE);
  // Caption strip.
  fillRect(x, y + h - 30, w, 0, INK);
}

function drawLead(): void {
  const x = MARGIN;
  const w = 608;
  let y = 206;
  y = kicker(x, y, "DISASTER IN CAIRO - LEAD STORY");
  y = headline(x, y, "TANKER FIRE KILLS AT LEAST 30 ON CAIRO RING ROAD", 4, w);
  y += 6;
  y = drawParagraph(
    x, y,
    "A fuel tanker overturned and exploded on the Giza Ring Road late on Wednesday, " +
    "setting cars ablaze and sending a fireball into the night sky. Egypt's Health " +
    "Ministry said at least 30 people were killed and 15 injured, and 39 ambulances " +
    "raced to the scene as firefighters battled the flames.",
    2, w, SOFT_INK, 5,
  );
  y += 10;
  drawFireScene(x, y, w, 168);
  y += 168 + 8;
  drawText(x, y, "FLAMES ENGULF THE RING ROAD IN GIZA AFTER THE TANKER OVERTURNED.", 1, SOFT_INK);
}

function drawSideStories(): void {
  const x = MARGIN + 608 + 24; // 664
  const w = WIDTH - MARGIN - x; // 328
  let y = 206;

  // Story 2: North Korea.
  y = kicker(x, y, "NORTH KOREA");
  y = headline(x, y, "KIM CALLS FOR MORE TACTICAL NUCLEAR ARMS", 3, w);
  y += 4;
  y = drawParagraph(
    x, y,
    "Kim Jong Un told nuclear scientists to deploy tactical nuclear weapons " +
    "\"across multiple domains\", KCNA reported on Thursday.",
    2, w, SOFT_INK, 5,
  );
  y += 14;
  rule(y, 1, SOFT_INK);
  y += 12;

  // Story 3: Oil.
  y = kicker(x, y, "ENERGY - OIL");
  y = headline(x, y, "OIL JUMPS AS HOUTHIS CLAIM SAUDI STRIKE", 3, w);
  y += 4;
  drawParagraph(
    x, y,
    "Brent crude settled 3.5% higher at $94.61 after Yemen's Houthis said they " +
    "hit Saudi Arabia's Ras Tanura refinery. Riyadh said it downed four drones.",
    2, w, SOFT_INK, 5,
  );
}

function drawMiddleBand(): void {
  const y0 = 656;
  rule(y0, 2);
  const colW = Math.floor((CONTENT_W - 24) / 2);
  let y = y0 + 14;

  // Left: tariffs.
  const lx = MARGIN;
  let ly = kicker(lx, y, "TRADE - WASHINGTON");
  ly = headline(lx, ly, "TRUMP UNVEILS NEW TARIFFS ON 14 PARTNERS", 3, colW);
  ly += 4;
  drawParagraph(
    lx, ly,
    "Washington proposed tariffs of up to 40% on 14 trading partners, including " +
    "China, the EU and Japan, in a new Section 301 move. Asian markets fell.",
    2, colW, SOFT_INK, 5,
  );

  // Right: Ukraine.
  const rx = MARGIN + colW + 24;
  let ry = kicker(rx, y, "WAR IN UKRAINE");
  ry = headline(rx, ry, "UKRAINE SAYS IT HIT A RUSSIAN AIR BASE", 3, colW);
  ry += 4;
  drawParagraph(
    rx, ry,
    "Kyiv said its forces struck the Savasleyka air base east of Moscow, knocking " +
    "out three MiG-31 jets and two Su-34 bombers. Moscow did not comment.",
    2, colW, SOFT_INK, 5,
  );
}

function drawBottomBand(): void {
  const y0 = 836;
  rule(y0, 2);
  const colW = Math.floor((CONTENT_W - 48) / 3);
  const y = y0 + 14;

  const blocks: Array<[string, string, string]> = [
    [
      "SPACE",
      "FIRST PAKISTANI IN ORBIT",
      "Muhammad Zeeshan Ali joins China's Tiangong crew aboard Shenzhou-24.",
    ],
    [
      "ANNIVERSARY - MUMBAI",
      "MUMBAI REMEMBERS 26/11",
      "India marks 18 years since the 2008 attacks, in which 166 people died.",
    ],
    [
      "HOLIDAY - AMERICA",
      "THANKSGIVING IN AMERICA",
      "Americans gather for Thanksgiving; US markets are closed for the day.",
    ],
  ];
  for (let i = 0; i < blocks.length; i++) {
    const bx = MARGIN + i * (colW + 24);
    let by = kicker(bx, y, blocks[i][0]);
    by = headline(bx, by, blocks[i][1], 2, colW);
    by += 4;
    drawParagraph(bx, by, blocks[i][2], 2, colW, SOFT_INK, 5);
  }
}

function drawFooter(): void {
  const y0 = 960;
  rule(y0, 2);
  drawTextCentered(
    MARGIN, y0 + 12, CONTENT_W,
    "ALSO: NORTH KOREA EXPELS SWISS ENVOY, ORDERS PYONGYANG OFFICE SHUT IN 48 HOURS.",
    1, SOFT_INK,
  );
  drawTextCentered(
    MARGIN, y0 + 28, CONTENT_W,
    "SOURCES: REUTERS - KCNA - USTR - XINHUA - ALL STORIES REPORTED ON 26 NOVEMBER 2026.",
    1, SOFT_INK,
  );
}

// ---------------------------------------------------------------------------
// Minimal PNG encoder: 8-bit RGB, no ancillary chunks, so the bytes are
// fully determined by the pixels. CRC-32 (IEEE) over chunk type + data.
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // One filter byte (0 = none) per scanline, then the raw RGB rows.
  const raw = Buffer.alloc(HEIGHT * (1 + WIDTH * 3));
  for (let y = 0; y < HEIGHT; y++) {
    raw[y * (1 + WIDTH * 3)] = 0;
    raw.set(px.subarray(y * WIDTH * 3, (y + 1) * WIDTH * 3), y * (1 + WIDTH * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

function main(): void {
  drawMasthead();
  drawLead();
  drawSideStories();
  drawMiddleBand();
  drawBottomBand();
  drawFooter();

  const png = encodePng();
  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.png", png);
}

main();
