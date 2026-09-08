/**
 * The spoken script and its caption timing, in one place.
 *
 * The delivery is Lebanese spoken Arabic — a girl talking about her own
 * personalised story — and the captions carry it, so the wording here is what
 * a voice actor would read and what the viewer reads along.
 */

export type Caption = {
  /** Absolute start frame in the reel. */
  from: number;
  /** How long the line stays on screen, in frames. */
  durationInFrames: number;
  /** Lebanese line, as spoken. */
  text: string;
  /** Highlight colour for the emphasised word, when the line has one. */
  emphasis?: string;
};

export type Scene = {
  id: string;
  from: number;
  durationInFrames: number;
};

/** Scene boundaries. Each scene cross-dissolves into the next. */
export const scenes = {
  hook: { id: "hook", from: 0, durationInFrames: 104 },
  reveal: { id: "reveal", from: 104, durationInFrames: 156 },
  personal: { id: "personal", from: 260, durationInFrames: 170 },
  hero: { id: "hero", from: 430, durationInFrames: 150 },
  quality: { id: "quality", from: 580, durationInFrames: 160 },
  outro: { id: "outro", from: 740, durationInFrames: 160 },
} satisfies Record<string, Scene>;

export const captions: Caption[] = [
  { from: 14, durationInFrames: 82, text: "شو هالحلو هيدا اللي وصلني؟!" },
  { from: 112, durationInFrames: 140, text: "قصة… بس مش أي قصة، هيدي قصّتي أنا" },
  { from: 266, durationInFrames: 158, text: "في اسمي عليها، وصورتي جوّاتها!" },
  { from: 436, durationInFrames: 138, text: "صرت أنا بطلة الحكاية" },
  { from: 586, durationInFrames: 148, text: "الرسمات بتجنّن، والورق سميك ومتين" },
  { from: 746, durationInFrames: 146, text: "يا حكايتي… خلّوا ولادكن أبطال حكاياتن" },
];

/** The three quality beats, shown as chips in the fifth scene. */
export const qualityBeats = [
  { text: "اسم ولدك بكل صفحة", icon: "name" },
  { text: "صورته بطل القصة", icon: "photo" },
  { text: "طباعة وورق فخم", icon: "print" },
] as const;

export const outro = {
  brand: "يا حكايتي",
  tagline: "قِصَصٌ تُحكَى بِحُبّ",
  cta: "اطلبوا قصّتكن عالواتساب",
  handle: "ya7kayti.com",
} as const;

/**
 * Splits a caption into words with a start and end frame each, so the active
 * word can be highlighted as it is spoken. Longer words are given
 * proportionally more time, which tracks natural speech closely enough to feel
 * deliberate rather than mechanical.
 */
export const wordTimings = (caption: Caption) => {
  const words = caption.text.split(" ").filter(Boolean);
  const weights = words.map((word) => Math.max(2, word.replace(/[…،؟!.]/g, "").length));
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  let elapsed = 0;
  return words.map((word, index) => {
    const share = (weights[index] / total) * caption.durationInFrames;
    const from = caption.from + elapsed;
    elapsed += share;
    return { word, from, to: caption.from + elapsed, index };
  });
};

/** True while any caption is on screen — drives the presenter's mouth. */
export const isSpeaking = (frame: number) =>
  captions.some((caption) => frame >= caption.from && frame < caption.from + caption.durationInFrames);
