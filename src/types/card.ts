export type CardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs' | 'special';

export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | '★';

export type VideoSourceType = 'direct' | 'youtube' | 'vimeo' | 'blob';

export interface PlayingCardData {
  id: string;
  rank: CardRank;
  suit: CardSuit;
  title: string;
  subtitle?: string;
  videoUrl: string;
  videoType: VideoSourceType;
  videoBlobKey?: string; // Key in IndexedDB for uploaded user videos
  isLit: boolean; // Once clicked, stays lit
  accentColor?: string;
  createdAt: number;
}

export type TableSurface = 'felt-green' | 'royal-blue' | 'mahogany' | 'noir';

export type LampWarmth = 'warm-amber' | 'golden-vintage' | 'candle-glow' | 'daylight';
