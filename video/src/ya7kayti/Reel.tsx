import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Backdrop, Bokeh, Grain, Progress, Watermark } from "./atoms";
import { Captions } from "./Captions";
import { Girl } from "./Girl";
import { Hero, Hook, Outro, Personal, Quality, Reveal } from "./scenes";
import { isSpeaking, scenes } from "./script";
import { color, DISSOLVE, DURATION_IN_FRAMES } from "./theme";
import "./fonts";

export type ReelProps = {
  /** Music bed volume, 0–1. It ducks on its own under a voice. */
  musicVolume: number;
  /**
   * Optional voiceover in public/, e.g. "audio/vo.mp3". With one supplied the
   * music ducks and the illustrated girl mouths the caption track.
   */
  voiceover: string | null;
  /**
   * Footage of a real presenter in public/, e.g. "video/clip.mp4". With one
   * supplied she replaces the illustration: the clip opens full-frame and
   * shrinks into the corner medallion as the product arrives, and its own
   * audio is the voice. Leave null to use the illustration.
   */
  presenterClip: string | null;
  /** Where to hold the crop of that footage, e.g. "50% 30%" for a high face. */
  presenterFocus: string;
};

/** The frames over which the presenter moves from full-frame to medallion. */
const SETTLE: [number, number] = [92, 120];

/**
 * The presenter. Filmed or drawn, she follows the same path: she opens the
 * reel large and settles into a corner badge as the product arrives, so there
 * is one continuous speaker rather than a face that appears between cuts.
 */
const Presenter: React.FC<{ clip: string | null; focus: string }> = ({ clip, focus }) => {
  const frame = useCurrentFrame();

  const at = (a: number, b: number) =>
    interpolate(frame, SETTLE, [a, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Footage opens filling the frame and rounds itself into the badge; the
  // illustration opens as a large medallion, since a square crop of a drawing
  // has nothing in the corners worth showing.
  const width = clip ? at(1080, 244) : at(560, 244);
  const height = clip ? at(1920, 244) : at(560, 244);
  const left = clip ? at(0, 30) : at(540 - 280, 30);
  const top = clip ? at(0, 1150) : at(720 - 280, 1150);
  const radius = clip ? at(0, 122) : at(280, 122);
  const ring = at(clip ? 0 : 12, 5);

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
        left,
        top,
        width,
        height,
        borderRadius: radius,
        overflow: "hidden",
        opacity,
        background: `linear-gradient(160deg, ${color.blush}, ${color.blushDeep})`,
        boxShadow: `0 0 0 ${ring}px #fff, 0 10px 26px ${color.ink}1c, 0 30px 70px ${color.ink}22`,
      }}
    >
      {clip ? (
        <OffthreadVideo
          src={staticFile(clip)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focus }}
        />
      ) : (
        <Girl
          speaking={isSpeaking(frame)}
          excitement={excitement}
          style={{
            position: "absolute",
            left: -width * 0.075,
            top: -width * 0.19,
            width: width * 1.15,
            height: width * 1.457,
          }}
        />
      )}
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

export const Reel: React.FC<ReelProps> = ({
  musicVolume,
  voiceover,
  presenterClip,
  presenterFocus,
}) => (
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
    <Presenter clip={presenterClip} focus={presenterFocus} />
    <Captions />
    <Grain />
    <Watermark />
    <Progress />

    <Audio
      src={staticFile("audio/theme.mp3")}
      volume={(f) =>
        (voiceover || presenterClip ? musicVolume * 0.3 : musicVolume) *
        interpolate(f, [0, 24], [0, 1], { extrapolateRight: "clamp" }) *
        interpolate(f, [DURATION_IN_FRAMES - 46, DURATION_IN_FRAMES], [1, 0], {
          extrapolateLeft: "clamp",
        })
      }
    />
    {voiceover ? <Audio src={staticFile(voiceover)} /> : null}
  </AbsoluteFill>
);
