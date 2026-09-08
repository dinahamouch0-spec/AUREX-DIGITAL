import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { color } from "./theme";

const SKIN = "#f2c59a";
const SKIN_SHADE = "#e0ad82";
const HAIR = "#2f2320";
const HAIR_LIGHT = "#4a3730";
const MOUTH = "#8e2247";

/**
 * The girl telling the story: a flat, brand-coloured illustration rather than
 * footage of a real child — a storefront selling personalised products for
 * children should not put an actual child's face in an ad it did not shoot.
 *
 * She breathes, blinks on her own schedule, and her mouth follows the caption
 * track, so she reads as speaking the lines the viewer is reading.
 */
export const Girl: React.FC<{
  speaking: boolean;
  /** 0 → calm, 1 → delighted. Raises the brows and widens the smile. */
  excitement?: number;
  style?: React.CSSProperties;
}> = ({ speaking, excitement = 0, style }) => {
  const frame = useCurrentFrame();

  // Mouth: a new target every three frames, linearly blended between them, so
  // the jaw moves at roughly syllable rate instead of strobing every frame.
  const bucket = Math.floor(frame / 3);
  const openAt = (index: number) =>
    speaking ? 0.2 + random(`mouth-${index}`) * 0.8 : 0;
  const blend = (frame % 3) / 3;
  const open = openAt(bucket) + (openAt(bucket + 1) - openAt(bucket)) * blend;

  // Blink: a quick close roughly every two and a half seconds, offset so it
  // never lands on a scene change.
  const blinkPhase = (frame + 23) % 76;
  const blink = blinkPhase < 5 ? Math.sin((blinkPhase / 5) * Math.PI) : 0;
  const eyeOpen = 1 - blink * 0.94;

  // Idle motion: a slow figure-of-eight, plus a small nod while she talks.
  const bobY = Math.sin(frame / 21) * 5 + (speaking ? Math.sin(frame / 5.5) * 1.6 : 0);
  const tilt = Math.sin(frame / 34) * 2.1;
  const breathe = 1 + Math.sin(frame / 26) * 0.008;

  const browLift = excitement * 7 + (speaking ? Math.sin(frame / 9) * 1.2 : 0);
  const mouthOpacity = interpolate(open, [0.1, 0.28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <svg viewBox="0 0 300 380" style={style}>
      <defs>
        <radialGradient id="cheek" cx="50%" cy="50%">
          <stop offset="0%" stopColor={color.pink} stopOpacity="0.42" />
          <stop offset="100%" stopColor={color.pink} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dress" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color.pinkCta} />
          <stop offset="100%" stopColor={color.pinkDeep} />
        </linearGradient>
      </defs>

      {/* Shoulders sit still; only the head moves. */}
      <path d="M42 380C48 300 96 262 150 262s102 38 108 118Z" fill="url(#dress)" />
      <path d="M126 262h48c0 16-11 27-24 27s-24-11-24-27Z" fill="#ffffff" opacity="0.9" />
      <rect x="132" y="228" width="36" height="42" rx="16" fill={SKIN_SHADE} />

      <g
        transform={`translate(0 ${bobY}) rotate(${tilt} 150 190) scale(${breathe}) translate(${(1 - breathe) * 150} ${(1 - breathe) * 190})`}
      >
        {/* Long curly hair falling behind the shoulders, echoing the girl on
            the story's cover. The back mass sits higher than the chin, or it
            reads as a beard rather than as hair. */}
        <path d="M56 176c0 78-22 108-14 150 28 14 52-24 56-72Z" fill={HAIR} />
        <path d="M244 176c0 78 22 108 14 150-28 14-52-24-56-72Z" fill={HAIR} />
        {[
          [50, 236],
          [62, 288],
          [250, 236],
          [238, 288],
        ].map(([cx, cy]) => (
          <circle key={`curl-${cx}-${cy}`} cx={cx} cy={cy} r="26" fill={HAIR} />
        ))}
        <ellipse cx="150" cy="150" rx="97" ry="98" fill={HAIR} />
        <circle cx="52" cy="118" r="33" fill={HAIR} />
        <circle cx="248" cy="118" r="33" fill={HAIR} />
        <circle cx="52" cy="118" r="33" fill={HAIR_LIGHT} opacity="0.32" />
        <circle cx="248" cy="118" r="33" fill={HAIR_LIGHT} opacity="0.32" />
        <circle cx="68" cy="150" r="12" fill={color.gold} />
        <circle cx="232" cy="150" r="12" fill={color.gold} />

        <ellipse cx="74" cy="180" rx="13" ry="17" fill={SKIN} />
        <ellipse cx="226" cy="180" rx="13" ry="17" fill={SKIN} />
        <ellipse cx="150" cy="168" rx="75" ry="84" fill={SKIN} />

        {/* Fringe, swept to one side, under a headband. */}
        <path
          d="M76 150c0-56 34-90 74-90s74 34 74 90c-12-32-38-46-74-40-34 6-62 14-74 40Z"
          fill={HAIR}
        />
        <path d="M186 70c26 10 40 38 38 70-10-30-28-46-56-52Z" fill={HAIR_LIGHT} opacity="0.4" />
        <path
          d="M78 138c6-52 36-82 72-82s66 30 72 82"
          stroke={color.pinkCta}
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />

        <g transform={`translate(0 ${-browLift})`}>
          <path d="M104 142c9-9 24-10 34-3" stroke={HAIR} strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M162 139c10-7 25-6 34 3" stroke={HAIR} strokeWidth="7" strokeLinecap="round" fill="none" />
        </g>

        <g transform={`translate(120 174) scale(1 ${eyeOpen}) translate(-120 -174)`}>
          <ellipse cx="120" cy="174" rx="18" ry="20" fill="#ffffff" />
          <circle cx="121" cy="176" r="11" fill={HAIR} />
          <circle cx="125" cy="171" r="4" fill="#ffffff" />
        </g>
        <g transform={`translate(180 174) scale(1 ${eyeOpen}) translate(-180 -174)`}>
          <ellipse cx="180" cy="174" rx="18" ry="20" fill="#ffffff" />
          <circle cx="181" cy="176" r="11" fill={HAIR} />
          <circle cx="185" cy="171" r="4" fill="#ffffff" />
        </g>

        <ellipse cx="98" cy="206" rx="20" ry="13" fill="url(#cheek)" />
        <ellipse cx="202" cy="206" rx="20" ry="13" fill="url(#cheek)" />
        <path d="M148 192c4 3 6 6 4 9" stroke={SKIN_SHADE} strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* Closed smile and open mouth, cross-faded rather than swapped. */}
        <g opacity={1 - mouthOpacity}>
          <path
            d={`M128 218c8 ${9 + excitement * 5} 36 ${9 + excitement * 5} 44 0`}
            stroke={MOUTH}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        </g>
        <g opacity={mouthOpacity}>
          <ellipse cx="150" cy="222" rx={19 + open * 5} ry={4 + open * 15} fill={MOUTH} />
          <path
            d={`M${131 - open * 5} 220h${38 + open * 10}a${19 + open * 5} 6 0 0 0 -${38 + open * 10} 0Z`}
            fill="#ffffff"
            opacity="0.92"
          />
          <ellipse cx="150" cy={228 + open * 7} rx={9 + open * 4} ry={3 + open * 5} fill={color.pinkCta} />
        </g>
      </g>
    </svg>
  );
};
