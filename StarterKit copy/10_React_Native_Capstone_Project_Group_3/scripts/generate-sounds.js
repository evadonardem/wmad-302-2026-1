/* eslint-env node */
/**
 * Generates the short theme sounds in assets/sounds/*.wav (played when adding to
 * cart while "Theme sounds" is on). Pure synthesis, so there are no licensing
 * questions. Run: node scripts/generate-sounds.js
 */
const fs = require('fs');
const path = require('path');

const RATE = 22050;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

/** A tone: frequency can glide from `freq` to `to`; `bell` adds inharmonic partials. */
function tone(buffer, { freq, to = freq, start, dur, gain = 0.5, bell = false, vibrato = 0, decay = 6 }) {
  const first = Math.floor(start * RATE);
  const length = Math.floor(dur * RATE);
  let phase = 0;
  for (let i = 0; i < length && first + i < buffer.length; i += 1) {
    const t = i / RATE;
    const progress = i / length;
    const f = freq + (to - freq) * progress + (vibrato ? Math.sin(2 * Math.PI * 6 * t) * vibrato : 0);
    phase += (2 * Math.PI * f) / RATE;
    const attack = Math.min(1, t / 0.005);
    const envelope = attack * Math.exp(-decay * t);
    let sample = Math.sin(phase);
    if (bell) sample = 0.6 * sample + 0.25 * Math.sin(phase * 2.76) + 0.15 * Math.sin(phase * 5.4);
    buffer[first + i] += sample * envelope * gain;
  }
}

const n = (semitonesFromA4) => 440 * 2 ** (semitonesFromA4 / 12);

const SOUNDS = {
  lively: [ // bubbly pop arpeggio
    { freq: n(15), start: 0, dur: 0.12, decay: 18 },
    { freq: n(19), start: 0.07, dur: 0.12, decay: 18 },
    { freq: n(22), start: 0.14, dur: 0.25, decay: 10 },
  ],
  christmas: [ // jingle bells
    { freq: n(19), start: 0, dur: 0.18, bell: true, decay: 14 },
    { freq: n(19), start: 0.15, dur: 0.18, bell: true, decay: 14 },
    { freq: n(19), start: 0.3, dur: 0.4, bell: true, decay: 7 },
  ],
  winter: [ // glassy sparkle
    { freq: n(24), start: 0, dur: 0.5, bell: true, decay: 6, gain: 0.4 },
    { freq: n(31), start: 0.1, dur: 0.45, bell: true, decay: 8, gain: 0.3 },
  ],
  spring: [ // bird chirps
    { freq: 2000, to: 3300, start: 0, dur: 0.09, decay: 4, gain: 0.35 },
    { freq: 2200, to: 3500, start: 0.13, dur: 0.09, decay: 4, gain: 0.35 },
  ],
  summer: [ // bright major arpeggio
    { freq: n(10), start: 0, dur: 0.12, decay: 12 },
    { freq: n(14), start: 0.06, dur: 0.12, decay: 12 },
    { freq: n(17), start: 0.12, dur: 0.12, decay: 12 },
    { freq: n(22), start: 0.18, dur: 0.3, decay: 8 },
  ],
  rainy: [ // two water drops
    { freq: 1500, to: 600, start: 0, dur: 0.08, decay: 20, gain: 0.5 },
    { freq: 1300, to: 500, start: 0.16, dur: 0.08, decay: 20, gain: 0.45 },
  ],
  autumn: [ // wooden knocks
    { freq: n(-12), start: 0, dur: 0.12, decay: 30, gain: 0.7 },
    { freq: n(-5), start: 0.12, dur: 0.16, decay: 25, gain: 0.6 },
  ],
  halloween: [ // spooky falling wail
    { freq: n(5), to: n(0), start: 0, dur: 0.6, vibrato: 12, decay: 3, gain: 0.4 },
    { freq: n(-7), start: 0.35, dur: 0.35, vibrato: 6, decay: 6, gain: 0.25 },
  ],
};

function toWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((value, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32000), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [name, notes] of Object.entries(SOUNDS)) {
  const end = Math.max(...notes.map((note) => note.start + note.dur)) + 0.05;
  const buffer = new Float32Array(Math.ceil(end * RATE));
  notes.forEach((note) => tone(buffer, note));
  fs.writeFileSync(path.join(OUT_DIR, `${name}.wav`), toWav(buffer));
  console.log(`assets/sounds/${name}.wav (${end.toFixed(2)}s)`);
}
