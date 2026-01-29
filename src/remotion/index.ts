import { Composition } from 'remotion';
import { ViralShort } from './ViralShort';

export const RemotionVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="ViralShort"
        component={ViralShort}
        durationInFrames={900}  // 30 seconds default, will be overridden by props
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          videoUrl: '',
          start: 0,
          end: 30,
          transcript: [],
          headline: ''
        }}
      />
    </>
  );
};

export default RemotionVideo;
