import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Bokeh, Grain, Progress, Watermark } from "./atoms";
import { Captions } from "./Captions";
import { Girl } from "./Girl";
import { Hero, Hook, Outro, Personal, Quality, Reveal } from "./scenes";
import { isSpeaking, scenes } from "./script";
import { color, DISSOLVE, DURATION_IN_FRAMES } from "./theme";
import "./fonts";

export type ReelProps = {
  /** Music bed volume, 0–1. Drop to ~0.2 once a real voiceover is added. */
  musicVolume: number;
  /**
   * Optional voiceover in public/, e.g. "audio/vo.mp3". With one supplied the
   * music ducks automatically and the girl still mouths the caption track.
   */
  voiceover: string | null;
};

/**
 * Presenter medallion. She starts as a full-frame portrait, then settles into
 * a corner badge for the rest of the reel — one continuous character rather
 * than a face that appears and disappears between cuts.
 */
const Presenter: React.FC = () => {
  const frame = useCurrentFrame();

  const size = interpolate(frame, [92, 120], [560, 244], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // She settles into the lower left, below the book and clear of the captions,
  // so she never covers the child's name printed on the cover.
  const cx = interpolate(frame, [92, 120], [540, 152], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cy = interpolate(frame, [92, 120], [720, 1272], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity =
    interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" }) *
    interpolate(frame, [scenes.outro.from, scenes.outro.from + 26], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // Delighted through the first half, calmer once she is explaining the paper.
  const excitement = interpolate(frame, [0, 120, 560, 700], [1, 0.7, 0.7, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: cx - size / 2,
        top: cy - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        opacity,
        background: `linear-gradient(160deg, ${color.blush}, ${color.blushDeep})`,
        boxShadow: `0 0 0 ${size * 0.022}px #fff, 0 10px 26px ${color.ink}1c, 0 30px 70px ${color.ink}22`,
      }}
    >
      <Girl
        speaking={isSpeaking(frame)}
        excitement={excitement}
        style={{
          position: "absolute",
          left: -size * 0.075,
          top: -size * 0.19,
          width: size * 1.15,
          height: size * 1.457,
        }}
      />
    </div>
  );
};

/** A soft vignette. Keeps the eye in the middle third of a tall frame. */
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(72% 52% at 50% 46%, transparent 55%, ${color.ink}12 100%)`,
    }}
  />
);

export const Reel: React.FC<ReelProps> = ({ musicVolume, voiceover }) => (
  <AbsoluteFill style={{ backgroundColor: color.bg }}>
    <Backdrop />
    <Bokeh />

    {/* Scenes overlap by one dissolve so the fades cross rather than dip to
        the background between shots. */}
    <Sequence from={scenes.hook.from} durationInFrames={scenes.hook.durationInFrames + DISSOLVE}>
      <Hook />
    </Sequence>
    <Sequence from={scenes.reveal.from} durationInFrames={scenes.reveal.durationInFrames + DISSOLVE}>
      <Reveal />
    </Sequence>
    <Sequence
      from={scenes.personal.from}
      durationInFrames={scenes.personal.durationInFrames + DISSOLVE}
    >
      <Personal />
    </Sequence>
    <Sequence from={scenes.hero.from} durationInFrames={scenes.hero.durationInFrames + DISSOLVE}>
      <Hero />
    </Sequence>
    <Sequence
      from={scenes.quality.from}
      durationInFrames={scenes.quality.durationInFrames + DISSOLVE}
    >
      <Quality />
    </Sequence>
    <Sequence from={scenes.outro.from} durationInFrames={scenes.outro.durationInFrames}>
      <Outro />
    </Sequence>

    <Vignette />
    <Presenter />
    <Captions />
    <Grain />
    <Watermark />
    <Progress />

    <Audio
      src={staticFile("audio/theme.mp3")}
      volume={(f) =>
        (voiceover ? musicVolume * 0.35 : musicVolume) *
        interpolate(f, [0, 24], [0, 1], { extrapolateRight: "clamp" }) *
        interpolate(f, [DURATION_IN_FRAMES - 46, DURATION_IN_FRAMES], [1, 0], {
          extrapolateLeft: "clamp",
        })
      }
    />
    {voiceover ? <Audio src={staticFile(voiceover)} /> : null}
  </AbsoluteFill>
);
