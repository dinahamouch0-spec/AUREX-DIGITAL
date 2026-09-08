import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { color, DURATION_IN_FRAMES, font } from "./theme";

/**
 * The warm blush ground everything sits on. It drifts very slowly, which stops
 * a 30-second static background from reading as a still image.
 */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 190) * 4;

  return (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at ${50 + drift}% ${12 - drift / 2}%, ${color.blush} 0%, ${color.bg} 58%, ${color.bg} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(80% 60% at ${18 - drift}% 88%, ${color.blushDeep}bb 0%, transparent 62%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 50% at 92% 78%, ${color.purple}14 0%, transparent 60%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Fixed-pattern film grain. It is static rather than animated on purpose: a
 * moving grain fights video compression and turns into visible mush.
 */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.055 }) => (
  <AbsoluteFill style={{ opacity, mixBlendMode: "multiply" }}>
    <svg width="100%" height="100%">
      <filter id="ya7-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#ya7-grain)" />
    </svg>
  </AbsoluteFill>
);

/** Slow out-of-focus discs. Twelve is enough to feel alive and stay cheap. */
export const Bokeh: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  return (
    <AbsoluteFill>
      {new Array(12).fill(true).map((_, index) => {
        const seed = `bokeh-${index}`;
        const size = 26 + random(`${seed}-size`) * 120;
        const x = random(`${seed}-x`) * 100;
        const speed = 0.16 + random(`${seed}-speed`) * 0.34;
        const startY = height + random(`${seed}-y`) * height * 1.6;
        const y = ((startY - frame * speed * 4) % (height + 400)) - 200;
        const tint = index % 3 === 0 ? color.gold : index % 3 === 1 ? color.pinkCta : color.sky;

        return (
          <div
            key={seed}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 30%, ${tint}66, ${tint}00 68%)`,
              filter: "blur(1px)",
              opacity: 0.5,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** A hairline progress bar — the one bit of UI chrome the format expects. */
export const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [0, DURATION_IN_FRAMES], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "#00000010" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${color.pinkCta}, ${color.pink})`,
        }}
      />
    </div>
  );
};

/** Persistent wordmark, top-right so it never collides with the captions. */
export const Watermark: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [10, 30], [0, 0.85], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        top: 54,
        right: 56,
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 14,
        direction: "rtl",
      }}
    >
      <span
        style={{
          fontFamily: font.display,
          fontSize: 40,
          fontWeight: 800,
          color: color.ink,
          letterSpacing: 0,
        }}
      >
        يا حكايتي
      </span>
      <span style={{ width: 12, height: 12, borderRadius: "50%", background: color.pink }} />
    </div>
  );
};

/** Four-point sparkle, the storefront's signature accent. */
export const Sparkle: React.FC<{
  size: number;
  fill: string;
  style?: React.CSSProperties;
}> = ({ size, fill, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={style}>
    <path
      d="M12 0c.7 6.4 4.9 10.6 12 12-7.1 1.4-11.3 5.6-12 12-.7-6.4-4.9-10.6-12-12C7.1 10.6 11.3 6.4 12 0Z"
      fill={fill}
    />
  </svg>
);
