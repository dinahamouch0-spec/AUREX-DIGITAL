import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { color } from "./theme";

/**
 * The product photograph, treated like a printed object: rounded, lifted off
 * the background with a two-layer shadow, tilted slightly in 3D, and slowly
 * pushed in (Ken Burns) so the frame is never completely still.
 *
 * Timing is local, so this belongs inside a <Sequence>.
 */
export const BookShot: React.FC<{
  durationInFrames: number;
  /** Scale at the start and end of the shot. */
  zoom?: [number, number];
  /** Horizontal pan across the shot, in percent of the frame. */
  pan?: [number, number];
  tilt?: number;
  width?: number;
  /** A light sweep across the surface, starting at this local frame. */
  sheenAt?: number;
  style?: React.CSSProperties;
  /** Callouts drawn on the page itself, positioned in percentages. */
  children?: React.ReactNode;
}> = ({
  durationInFrames,
  zoom = [1, 1.08],
  pan = [0, 0],
  tilt = -3.2,
  width = 720,
  sheenAt,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(progress, [0, 1], zoom);
  const x = interpolate(progress, [0, 1], pan);
  const sheen =
    sheenAt === undefined
      ? null
      : interpolate(frame, [sheenAt, sheenAt + 34], [-140, 240], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <div
      style={{
        width,
        borderRadius: 34,
        overflow: "hidden",
        position: "relative",
        transform: `perspective(1600px) rotateZ(${tilt}deg) rotateY(${tilt / 2}deg) translateX(${x}%)`,
        boxShadow: `0 8px 24px ${color.ink}1f, 0 44px 90px ${color.ink}2e`,
        backgroundColor: color.surface,
        ...style,
      }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "center 42%" }}>
        <Img src={staticFile("img/story.jpg")} style={{ width: "100%", display: "block" }} />
        {children}
      </div>
      {/* Paper sheen: a soft specular band, as if the page catches the light. */}
      {sheen !== null && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(104deg, transparent ${sheen - 26}%, #ffffff96 ${sheen}%, transparent ${sheen + 26}%)`,
            mixBlendMode: "screen",
          }}
        />
      )}
      {/* A hairline inner edge keeps the crop from looking pasted on. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 34,
          boxShadow: `inset 0 0 0 1.5px ${color.ink}14`,
        }}
      />
    </div>
  );
};
