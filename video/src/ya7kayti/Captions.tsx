import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captions, wordTimings } from "./script";
import { color, font } from "./theme";

/**
 * Burned-in Arabic captions, RTL, with the spoken word lifted as it lands.
 *
 * They sit clear of the bottom of the frame: Instagram and TikTok both overlay
 * their own UI over the last ~15% of a reel, and a caption underneath it is a
 * caption nobody reads.
 */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const active = captions.find(
    (caption) => frame >= caption.from - 8 && frame < caption.from + caption.durationInFrames + 12,
  );
  if (!active) return null;

  const local = frame - active.from;
  const enter = spring({ frame: local + 8, fps, config: { damping: 200, stiffness: 130, mass: 0.8 } });
  const exit = interpolate(local, [active.durationInFrames, active.durationInFrames + 12], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const words = wordTimings(active);

  return (
    <div
      style={{
        position: "absolute",
        left: 88,
        right: 88,
        bottom: 268,
        display: "flex",
        justifyContent: "center",
        opacity: enter * exit,
        transform: `translateY(${(1 - enter) * 34}px)`,
      }}
    >
      <div
        style={{
          direction: "rtl",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 16px",
          padding: "26px 44px",
          borderRadius: 34,
          background: "#fffdfbf2",
          boxShadow: `0 2px 8px ${color.ink}12, 0 24px 60px ${color.ink}1c`,
          border: `2px solid ${color.blushDeep}`,
        }}
      >
        {words.map(({ word, from, to, index }) => {
          const spoken = frame >= from;
          const lift = interpolate(frame, [from, from + 7], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const current = frame >= from && frame < to;

          return (
            <span
              key={`${word}-${index}`}
              style={{
                fontFamily: font.body,
                fontWeight: 700,
                fontSize: 62,
                lineHeight: 1.45,
                color: spoken ? (current ? color.pink : color.ink) : `${color.inkSoft}88`,
                transform: `translateY(${(1 - lift) * 10}px) scale(${1 + (current ? 0.045 : 0)})`,
                display: "inline-block",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
