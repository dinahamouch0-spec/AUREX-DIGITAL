import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BookShot } from "./BookShot";
import { Sparkle } from "./atoms";
import { outro, qualityBeats, scenes } from "./script";
import { color, DISSOLVE, font, SNAPPY, SOFT } from "./theme";

/**
 * Every scene fades and eases through the same 14-frame dissolve. Using one
 * transition everywhere is what makes a set of cuts feel like a single film.
 */
const SceneShell: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  // The fade-out runs past the scene's own length, into the dissolve frames its
  // sequence is padded with, so it overlaps the next scene's fade-in instead of
  // dipping to the background between the two.
  const opacity =
    interpolate(frame, [0, DISSOLVE], [0, 1], { extrapolateRight: "clamp" }) *
    interpolate(frame, [durationInFrames, durationInFrames + DISSOLVE], [1, 0], {
      extrapolateLeft: "clamp",
    });
  const scale = interpolate(frame, [0, DISSOLVE], [1.035, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>{children}</AbsoluteFill>
  );
};

/** Small pill used for kickers and feature beats. */
const Chip: React.FC<{
  children: React.ReactNode;
  delay: number;
  tint?: string;
  style?: React.CSSProperties;
}> = ({ children, delay, tint = color.pink, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: SNAPPY });

  return (
    <div
      style={{
        direction: "rtl",
        fontFamily: font.body,
        fontWeight: 700,
        fontSize: 46,
        color: color.ink,
        background: color.surface,
        border: `3px solid ${tint}33`,
        borderRadius: 999,
        padding: "22px 42px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        boxShadow: `0 2px 6px ${color.ink}10, 0 18px 44px ${color.ink}18`,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 40}px) scale(${0.94 + enter * 0.06})`,
        ...style,
      }}
    >
      <span style={{ width: 16, height: 16, borderRadius: "50%", background: tint, flexShrink: 0 }} />
      {children}
    </div>
  );
};

/**
 * A hand-drawn-feeling ring around a detail on the page. It draws itself on,
 * rather than appearing, so the eye follows it to the thing being pointed at.
 */
const Ring: React.FC<{
  left: string;
  top: string;
  width: string;
  height: string;
  tint: string;
  enter: number;
}> = ({ left, top, width, height, tint, enter }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width,
      height,
      borderRadius: "50%",
      border: `6px dashed ${tint}`,
      boxShadow: `0 0 0 6px ${tint}1f`,
      opacity: enter * 0.92,
      transform: `scale(${0.8 + enter * 0.2}) rotate(${-7 + enter * 7}deg)`,
    }}
  />
);

/** Scene 1 — the hook. She reacts before the product is ever shown. */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 6, fps, config: SNAPPY });

  return (
    <SceneShell durationInFrames={scenes.hook.durationInFrames}>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
        <div style={{ opacity: pop, transform: `translateY(${(1 - pop) * 30}px)` }}>
          <Chip delay={4} tint={color.gold}>
            وصلت اليوم 📦
          </Chip>
        </div>
      </AbsoluteFill>
      {[
        { x: 150, y: 470, size: 78, delay: 10, fill: color.gold },
        { x: 880, y: 560, size: 56, delay: 18, fill: color.pinkCta },
        { x: 240, y: 1150, size: 46, delay: 26, fill: color.sky },
        { x: 830, y: 1080, size: 66, delay: 22, fill: color.gold },
      ].map((sparkle) => {
        const enter = spring({ frame: frame - sparkle.delay, fps, config: SNAPPY });
        return (
          <Sparkle
            key={`${sparkle.x}-${sparkle.y}`}
            size={sparkle.size}
            fill={sparkle.fill}
            style={{
              position: "absolute",
              left: sparkle.x,
              top: sparkle.y,
              opacity: enter * 0.9,
              transform: `scale(${enter}) rotate(${frame * 0.7}deg)`,
            }}
          />
        );
      })}
    </SceneShell>
  );
};

/** Scene 2 — the product arrives, lifted in on a spring. */
export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: SOFT });

  return (
    <SceneShell durationInFrames={scenes.reveal.durationInFrames}>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 186 }}>
        <div
          style={{
            opacity: rise,
            transform: `translateY(${(1 - rise) * 180}px) scale(${0.9 + rise * 0.1})`,
          }}
        >
          <BookShot
            durationInFrames={scenes.reveal.durationInFrames}
            zoom={[1.03, 1.09]}
            tilt={-3.4}
            width={620}
            sheenAt={34}
          />
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};

/** Scene 3 — the two things that make it hers, called out on the page. */
export const Personal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ring = spring({ frame: frame - 26, fps, config: SOFT });
  const ringTwo = spring({ frame: frame - 52, fps, config: SOFT });

  return (
    <SceneShell durationInFrames={scenes.personal.durationInFrames}>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 186 }}>
        <BookShot
          durationInFrames={scenes.personal.durationInFrames}
          zoom={[1.04, 1.12]}
          tilt={2.4}
          width={620}
        >
          {/* Percentages of the page, so the callouts stay on the name and the
              face while the shot pushes in. */}
          <Ring left="9%" top="6%" width="46%" height="22%" tint={color.pink} enter={ring} />
          <Ring left="56%" top="17%" width="30%" height="17%" tint={color.sky} enter={ringTwo} />
        </BookShot>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 1216 }}>
        <div style={{ display: "flex", gap: 26, direction: "rtl" }}>
          <Chip delay={40} tint={color.pink}>
            اسمي
          </Chip>
          <Chip delay={62} tint={color.sky}>
            صورتي
          </Chip>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};

/** Scene 4 — the emotional line, set as display type behind the book. */
export const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 8, fps, config: SOFT });

  return (
    <SceneShell durationInFrames={scenes.hero.durationInFrames}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(78% 48% at 50% 40%, ${color.gold}33 0%, transparent 72%)`,
          opacity: enter,
        }}
      />
      {new Array(7).fill(true).map((_, index) => {
        const angle = (index / 7) * Math.PI * 2 + frame / 90;
        const wobble = Math.sin(frame / 40 + index) * 24;
        return (
          <Sparkle
            key={`halo-${index}`}
            size={index % 2 === 0 ? 46 : 30}
            fill={index % 3 === 0 ? color.gold : color.pinkCta}
            style={{
              position: "absolute",
              left: 540 + Math.cos(angle) * (498 + wobble) - 20,
              top: 690 + Math.sin(angle) * (566 + wobble) - 20,
              opacity: enter * 0.85,
              transform: `rotate(${frame * 0.9 + index * 30}deg)`,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 210 }}>
        <div style={{ opacity: enter, transform: `scale(${0.92 + enter * 0.08})` }}>
          <BookShot
            durationInFrames={scenes.hero.durationInFrames}
            zoom={[1.09, 1.02]}
            tilt={4}
            width={600}
            sheenAt={44}
          />
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};

/** Scene 5 — three reasons to trust the product, staggered. */
export const Quality: React.FC = () => (
  <SceneShell durationInFrames={scenes.quality.durationInFrames}>
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 170 }}>
      <BookShot
        durationInFrames={scenes.quality.durationInFrames}
        zoom={[1.02, 1.09]}
        tilt={-2}
        width={500}
      />
    </AbsoluteFill>
    <AbsoluteFill
      style={{
        alignItems: "flex-end",
        justifyContent: "flex-start",
        paddingTop: 1010,
        paddingRight: 74,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-end" }}>
        {qualityBeats.map((beat, index) => (
          <Chip
            key={beat.icon}
            delay={16 + index * 16}
            tint={[color.pink, color.sky, color.mint][index]}
          >
            {beat.text}
          </Chip>
        ))}
      </div>
    </AbsoluteFill>
  </SceneShell>
);

/** Scene 6 — brand, promise, and the one action to take. */
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mark = spring({ frame: frame - 4, fps, config: SOFT });
  const name = spring({ frame: frame - 16, fps, config: SOFT });
  const cta = spring({ frame: frame - 40, fps, config: SNAPPY });
  const pulse = 1 + Math.sin(Math.max(0, frame - 60) / 11) * 0.022;

  return (
    <SceneShell durationInFrames={scenes.outro.durationInFrames}>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 400 }}>
        <Img
          src={staticFile("img/logo-mark.png")}
          style={{
            width: 420,
            opacity: mark,
            transform: `scale(${0.86 + mark * 0.14}) rotate(${(1 - mark) * -8}deg)`,
          }}
        />
        <div
          style={{
            marginTop: 26,
            fontFamily: font.display,
            fontWeight: 800,
            fontSize: 62,
            color: color.ink,
            direction: "rtl",
            opacity: name,
            transform: `translateY(${(1 - name) * 26}px)`,
          }}
        >
          {outro.tagline}
        </div>

        <div
          style={{
            marginTop: 78,
            direction: "rtl",
            fontFamily: font.body,
            fontWeight: 700,
            fontSize: 54,
            color: "#ffffff",
            background: `linear-gradient(135deg, ${color.pinkCta}, ${color.pink})`,
            borderRadius: 999,
            padding: "30px 62px",
            boxShadow: `0 14px 40px ${color.pinkCta}66`,
            opacity: cta,
            transform: `translateY(${(1 - cta) * 30}px) scale(${pulse})`,
          }}
        >
          {outro.cta}
        </div>
        <div
          style={{
            marginTop: 30,
            display: "flex",
            alignItems: "center",
            gap: 22,
            fontFamily: font.body,
            fontWeight: 700,
            fontSize: 44,
            letterSpacing: 1,
            color: color.purple,
            opacity: cta * 0.95,
          }}
        >
          <span>03 566 434</span>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: color.pinkCta }} />
          <span>{outro.handle}</span>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
