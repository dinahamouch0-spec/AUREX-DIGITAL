/**
 * Generates the reel's music bed from scratch — an original composition
 * synthesised sample by sample, so nothing here is licensed from anyone.
 *
 *   node scripts/make-music.mjs
 *
 * Writes public/audio/theme.wav, then public/audio/theme.mp3 if ffmpeg is on
 * PATH (or at FFMPEG_PATH). Warm, playful, storybook: marimba melody over a
 * soft pad, glockenspiel sparkles, brushed shaker, F major at 96 BPM.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "audio");

const SR = 44100;
const BPM = 96;
const BEAT = 60 / BPM; // 0.625s
const BAR = BEAT * 4; // 2.5s
const BARS = 12;
const DURATION = BAR * BARS; // 30s
const N = Math.ceil(DURATION * SR);

const left = new Float64Array(N);
const right = new Float64Array(N);

/** Equal-tempered pitch from a note name, A4 = 440Hz. */
const SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const hz = (note) => {
  const [, letter, accidental, octave] = /^([A-G])([#b]?)(-?\d)$/.exec(note);
  const semis =
    SEMITONE[letter] +
    (accidental === "#" ? 1 : accidental === "b" ? -1 : 0) +
    (Number(octave) + 1) * 12;
  return 440 * 2 ** ((semis - 69) / 12);
};

/** Adds a mono voice into the stereo buses with constant-power panning. */
const place = (at, samples, gain, pan) => {
  const start = Math.round(at * SR);
  const theta = ((pan + 1) / 2) * (Math.PI / 2);
  const gl = Math.cos(theta) * gain;
  const gr = Math.sin(theta) * gain;
  for (let i = 0; i < samples.length; i++) {
    const j = start + i;
    if (j < 0 || j >= N) continue;
    left[j] += samples[i] * gl;
    right[j] += samples[i] * gr;
  }
};

/** Percussive struck-bar tone: strong fundamental, bright inharmonic partials. */
const marimba = (freq, dur) => {
  const len = Math.ceil(dur * SR);
  const out = new Float64Array(len);
  const partials = [
    [1, 1.0, 0.0],
    [3.98, 0.42, 0.0], // the 4th partial is what makes a marimba a marimba
    [9.6, 0.12, 0.0],
    [2.0, 0.08, 0.0],
  ];
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const attack = 1 - Math.exp(-t * 900);
    let s = 0;
    for (const [ratio, amp, phase] of partials) {
      s += amp * Math.sin(2 * Math.PI * freq * ratio * t + phase) * Math.exp(-t * (5.5 + ratio * 1.6));
    }
    out[i] = s * attack;
  }
  return out;
};

/** Glockenspiel / music-box sparkle: long shimmering decay. */
const bell = (freq, dur) => {
  const len = Math.ceil(dur * SR);
  const out = new Float64Array(len);
  const partials = [
    [1, 1.0],
    [2.76, 0.5],
    [5.4, 0.22],
    [8.93, 0.08],
  ];
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const attack = 1 - Math.exp(-t * 1400);
    let s = 0;
    for (const [ratio, amp] of partials) {
      s += amp * Math.sin(2 * Math.PI * freq * ratio * t) * Math.exp(-t * (1.9 + ratio * 0.5));
    }
    out[i] = s * attack;
  }
  return out;
};

/** Breathing pad: three detuned voices, slow attack, slow release. */
const pad = (freq, dur) => {
  const len = Math.ceil(dur * SR);
  const out = new Float64Array(len);
  const detunes = [0.997, 1, 1.004];
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const attack = Math.min(1, t / 0.75);
    const release = Math.min(1, (dur - t) / 0.9);
    const vibrato = 1 + 0.0016 * Math.sin(2 * Math.PI * 4.6 * t);
    let s = 0;
    for (const d of detunes) {
      const f = freq * d * vibrato;
      s += Math.sin(2 * Math.PI * f * t) + 0.22 * Math.sin(4 * Math.PI * f * t);
    }
    out[i] = (s / detunes.length) * attack * Math.max(0, release);
  }
  return out;
};

/** Round sub-bass with a soft knee, so it supports without booming. */
const bass = (freq, dur) => {
  const len = Math.ceil(dur * SR);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = (1 - Math.exp(-t * 60)) * Math.exp(-t * 2.4);
    out[i] = (Math.sin(2 * Math.PI * freq * t) + 0.18 * Math.sin(4 * Math.PI * freq * t)) * env;
  }
  return out;
};

/** Shaker: noise through a one-pole high-pass, very short decay. */
let noiseSeed = 20260908;
const rand = () => {
  noiseSeed = (noiseSeed * 1664525 + 1013904223) >>> 0;
  return (noiseSeed / 0xffffffff) * 2 - 1;
};
const shaker = (dur) => {
  const len = Math.ceil(dur * SR);
  const out = new Float64Array(len);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const n = rand();
    const hp = n - prev * 0.86;
    prev = n;
    out[i] = hp * Math.exp(-t * 42);
  }
  return out;
};

// --- Arrangement ----------------------------------------------------------
// I - vi - IV - V in F major, three times through. Familiar, warm, unhurried.
const PROGRESSION = [
  { chord: ["F3", "A3", "C4"], bassNote: "F2" },
  { chord: ["D3", "F3", "A3"], bassNote: "D2" },
  { chord: ["Bb2", "D3", "F3"], bassNote: "Bb1" },
  { chord: ["C3", "E3", "G3"], bassNote: "C2" },
];

// Melody per bar, as [scale note, beat offset, length in beats].
const MELODY = [
  [], // bar 1 — let the pad breathe first
  [["A4", 0, 1], ["C5", 1, 1], ["A4", 2, 0.5], ["F4", 2.5, 1.5]],
  [["D5", 0, 1], ["C5", 1.5, 0.5], ["A4", 2, 2]],
  [["F4", 0, 1], ["G4", 1, 1], ["A4", 2, 2]],
  [["C5", 0, 1.5], ["A4", 1.5, 0.5], ["F4", 2, 1], ["G4", 3, 1]],
  [["A4", 0, 1], ["D5", 1, 1], ["C5", 2, 2]],
  [["Bb4", 0, 1], ["A4", 1, 1], ["F4", 2, 1], ["D4", 3, 1]],
  [["C5", 0, 2], ["E5", 2, 2]],
  [["F5", 0, 1], ["E5", 1, 0.5], ["D5", 1.5, 0.5], ["C5", 2, 2]],
  [["D5", 0, 1], ["F5", 1, 1], ["E5", 2, 2]],
  [["D5", 0, 1], ["C5", 1, 1], ["Bb4", 2, 1], ["A4", 3, 1]],
  [["F4", 0, 4]], // resolve, and let it ring out under the end card
];

for (let bar = 0; bar < BARS; bar++) {
  const t0 = bar * BAR;
  const { chord, bassNote } = PROGRESSION[bar % 4];
  const intensity = bar < 2 ? 0.55 : bar < 8 ? 1 : bar < 11 ? 1.1 : 0.8;

  for (const note of chord) {
    place(t0, pad(hz(note), BAR + 0.5), 0.052 * intensity, (chord.indexOf(note) - 1) * 0.35);
  }
  if (bar > 0) place(t0, bass(hz(bassNote), BEAT * 2), 0.3 * intensity, 0);
  if (bar > 1 && bar < 11) place(t0 + BEAT * 2, bass(hz(bassNote), BEAT * 1.5), 0.17 * intensity, 0);

  for (const [note, offset, length] of MELODY[bar]) {
    place(t0 + offset * BEAT, marimba(hz(note), length * BEAT + 0.45), 0.3 * intensity, -0.18);
  }

  // A sparkle on the downbeat once the piece is moving.
  if (bar >= 2 && bar % 2 === 0) {
    place(t0, bell(hz(chord[2].replace(/\d$/, (d) => Number(d) + 1)), 1.6), 0.085, 0.4);
  }

  // Shaker on the offbeats — felt more than heard.
  if (bar >= 3 && bar < 11) {
    for (let eighth = 0; eighth < 8; eighth++) {
      const accent = eighth % 2 === 1 ? 0.03 : 0.014;
      place(t0 + eighth * (BEAT / 2), shaker(0.09), accent * intensity, 0.55);
    }
  }
}

// --- Master ---------------------------------------------------------------
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
const normalise = peak > 0 ? 0.82 / peak : 1;

const FADE_IN = 0.6 * SR;
const FADE_OUT = 2.6 * SR;
const buffer = Buffer.alloc(44 + N * 4);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + N * 4, 4);
buffer.write("WAVEfmt ", 8);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(2, 22);
buffer.writeUInt32LE(SR, 24);
buffer.writeUInt32LE(SR * 4, 28);
buffer.writeUInt16LE(4, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(N * 4, 40);

const clip = (v) => Math.max(-1, Math.min(1, v));
for (let i = 0; i < N; i++) {
  let fade = 1;
  if (i < FADE_IN) fade = i / FADE_IN;
  if (i > N - FADE_OUT) fade = Math.min(fade, (N - i) / FADE_OUT);
  const l = clip(left[i] * normalise * fade);
  const r = clip(right[i] * normalise * fade);
  buffer.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
  buffer.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
}

mkdirSync(OUT_DIR, { recursive: true });
const wav = join(OUT_DIR, "theme.wav");
writeFileSync(wav, buffer);
console.log(`Wrote ${wav} — ${DURATION}s, ${(buffer.length / 1e6).toFixed(1)} MB`);

// MP3 is what the video imports; the WAV is the lossless master and is
// git-ignored. Remotion bundles its own FFmpeg, so no system install is needed.
const mp3 = join(OUT_DIR, "theme.mp3");
const encode = ["-y", "-loglevel", "error", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "192k", mp3];
const remotionBin = join(ROOT, "node_modules", ".bin", "remotion");

if (process.env.FFMPEG_PATH) {
  execFileSync(process.env.FFMPEG_PATH, encode);
} else if (existsSync(remotionBin)) {
  execFileSync(remotionBin, ["ffmpeg", ...encode]);
} else {
  throw new Error("No encoder available — run npm install, or set FFMPEG_PATH.");
}
console.log(`Wrote ${mp3}`);
