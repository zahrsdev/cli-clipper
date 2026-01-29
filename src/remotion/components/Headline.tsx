import { AbsoluteFill } from 'remotion';

interface HeadlineProps {
  text: string;
}

export const Headline: React.FC<HeadlineProps> = ({ text }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 60,
      left: 20,
      right: 20,
      textAlign: 'center',
      zIndex: 10,
      padding: '16px',
      background: 'rgba(0,0,0,0.7)',
      borderRadius: '8px',
      border: '2px solid #FFD700'
    }}>
      <span style={{
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#FFD700',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        fontFamily: 'Arial Black, sans-serif',
        textTransform: 'uppercase'
      }}>
        {text}
      </span>
    </div>
  );
};
