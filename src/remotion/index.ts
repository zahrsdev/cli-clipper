import { Composition } from 'remotion';
import { ViralShort } from './ViralShort.js';

export const RemotionVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="ViralShort"
        component={ViralShort}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          videoUrl: '',
          start: 0,
          end: 60,
          transcript: [],
          headline: ''
        }}
      />
    </>
  );
};
