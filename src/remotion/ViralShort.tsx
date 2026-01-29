import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Video } from '@remotion/core';
import { AutoReframe } from './components/AutoReframe.js';
import { Subtitles } from './components/Subtitles.js';
import { Headline } from './components/Headline.js';

interface Word {
  word: string;
  start: number;
  end: number;
}

interface ViralShortProps {
  videoUrl: string;
  start: number;
  end: number;
  transcript: Word[];
  headline: string;
}

export const ViralShort: React.FC<ViralShortProps> = ({
  videoUrl,
  start,
  end,
  transcript,
  headline
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTime = (frame / fps);

  if (currentTime < start || currentTime > end) {
    return null;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AutoReframe videoUrl={videoUrl} start={start} />
      <Subtitles transcript={transcript} currentTime={currentTime - start} />
      {headline && <Headline text={headline} />}
    </AbsoluteFill>
  );
};
