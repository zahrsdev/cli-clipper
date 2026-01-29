import { Video, useCurrentFrame, useVideoConfig } from 'remotion';

interface AutoReframeProps {
  videoUrl: string;
  start: number;
}

export const AutoReframe: React.FC<AutoReframeProps> = ({ videoUrl, start }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const timeOffset = frame / fps + start;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: '#000'
    }}>
      <Video
        src={videoUrl}
        startFrom={start}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scale(1.3)',
          transformOrigin: 'center center'
        }}
      />
    </div>
  );
};
