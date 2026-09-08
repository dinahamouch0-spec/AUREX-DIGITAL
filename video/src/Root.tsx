import "./index.css";
import { Composition } from "remotion";
import { Reel } from "./ya7kayti/Reel";
import { DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH } from "./ya7kayti/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Ya7kaytiReel"
      component={Reel}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{
        musicVolume: 0.6,
        // Drop a recording at public/audio/vo.mp3 and set this to "audio/vo.mp3"
        // to put a real voice over the captions; the music ducks on its own.
        voiceover: null,
        // Drop filmed footage at public/video/clip.mp4 and set this to
        // "video/clip.mp4" — she then opens full-frame, her own audio becomes
        // the voice, and the music ducks under her.
        presenterClip: null,
        presenterFocus: "50% 35%",
      }}
    />
  );
};
