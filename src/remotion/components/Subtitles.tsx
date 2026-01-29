import { useCurrentFrame, useVideoConfig } from 'remotion';

interface Word {
  word: string;
  start: number;
  end: number;
}

interface SubtitlesProps {
  transcript: Word[];
  currentTime: number;
}

export const Subtitles: React.FC<SubtitlesProps> = ({ transcript, currentTime }) => {
  const { fps } = useVideoConfig();

  const currentWordIndex = transcript.findIndex(
    word => currentTime >= word.start && currentTime <= word.end
  );

  const visibleWords = transcript.filter(
    word => word.start <= currentTime + 0.5 && word.end >= currentTime - 0.5
  );

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      left: 20,
      right: 20,
      textAlign: 'center',
      zIndex: 10
    }}>
      {visibleWords.map((word, i) => {
        const isActive = currentTime >= word.start && currentTime <= word.end;

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              margin: '0 2px',
              padding: '4px 8px',
              fontSize: '32px',
              fontWeight: 'bold',
              fontFamily: 'Arial Black, sans-serif',
              color: '#fff',
              backgroundColor: isActive ? '#FFD700' : '#000',
              borderRadius: '4px',
              opacity: isActive ? 1 : 0.6,
              transform: `scale(${isActive ? 1.1 : 1})`,
              transformOrigin: 'bottom center',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            {word.word}
          </span>
        );
      })}
    </div>
  );
};
