import React, { useRef, useState, useEffect } from 'react';
import { PlayingCardData, LampWarmth } from '../types/card';
import { SuitIcon } from './SuitIcon';
import { soundEngine } from '../utils/audio';
import { parseVideoUrl } from '../utils/videoHelper';
import { Volume2, VolumeX, Maximize2, Edit3, Sparkles, Lightbulb, Play, Pause } from 'lucide-react';

interface PlayingCardProps {
  card: PlayingCardData;
  lampWarmth: LampWarmth;
  onCardClick: (cardId: string, coords?: { x: number; y: number }) => void;
  onOpenCinema: (card: PlayingCardData) => void;
  onEditCard: (card: PlayingCardData) => void;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  lampWarmth,
  onCardClick,
  onOpenCinema,
  onEditCard,
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const parsed = parseVideoUrl(card.videoUrl);

  const isRedSuit = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitColorClass = isRedSuit ? 'text-rose-500' : card.suit === 'special' ? 'text-amber-400' : 'text-amber-100';

  const lampGlowClass = {
    'warm-amber': 'lamp-glow-amber',
    'golden-vintage': 'lamp-glow-vintage',
    'candle-glow': 'lamp-glow-candle',
    'daylight': 'lamp-glow-daylight',
  }[lampWarmth];

  // Auto-play video when card becomes lit
  useEffect(() => {
    if (card.isLit && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy might require mute
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [card.isLit]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent triggering when clicking control buttons inside lit card
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('iframe') || target.closest('video')) {
      return;
    }

    if (!card.isLit) {
      soundEngine.playCardFlipWhoosh();
      setTimeout(() => {
        soundEngine.playLampSwitchSound(true);
      }, 180);
      onCardClick(card.id, { x: e.clientX, y: e.clientY });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMute = !isMuted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
    }
  };

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.ended) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        setIsPlaying(true);
      } else if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div
      data-card-id={card.id}
      onClick={handleCardClick}
      className={`group relative w-full max-w-[310px] sm:w-[290px] h-[440px] select-none perspective-1000 transition-all duration-300 ${
        !card.isLit ? 'cursor-pointer hover:-translate-y-2' : ''
      }`}
    >
      {/* Table Light Diffusion Halo when lit */}
      {card.isLit && (
        <div
          className="absolute -inset-8 pointer-events-none rounded-[36px] blur-2xl opacity-75 transition-opacity duration-1000"
          style={{
            background:
              lampWarmth === 'warm-amber'
                ? 'radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(180, 83, 9, 0.2) 50%, transparent 75%)'
                : lampWarmth === 'golden-vintage'
                ? 'radial-gradient(circle, rgba(250, 204, 21, 0.5) 0%, rgba(202, 138, 4, 0.25) 50%, transparent 75%)'
                : lampWarmth === 'candle-glow'
                ? 'radial-gradient(circle, rgba(249, 115, 22, 0.5) 0%, rgba(194, 65, 12, 0.22) 50%, transparent 75%)'
                : 'radial-gradient(circle, rgba(254, 240, 138, 0.45) 0%, rgba(234, 179, 8, 0.18) 50%, transparent 75%)',
          }}
        />
      )}

      {/* 3D Card Inner Container with realistic physical turnover */}
      <div
        className={`relative w-full h-full rounded-2xl transform-style-3d card-flip-inner ${
          card.isLit ? 'is-flipped' : ''
        }`}
      >
        {/* =========================================
            CARD BACK (UNLIT STATE - ABAJUR APAGADO)
            ========================================= */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl card-back-pattern card-border-gold ${
            !card.isLit ? 'card-border-gold-hover' : ''
          } backface-hidden flex flex-col justify-between p-4 overflow-hidden shadow-2xl transition-all duration-300`}
        >
          {/* Subtle Vintage Card Texture Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-black/40 pointer-events-none" />

          {/* Premium Gold Sheen Sweep on hover */}
          {!card.isLit && <div className="gold-sheen-sweep" />}

          {/* Top-Left Corner Index */}
          <div className="relative z-10 flex flex-col items-center w-7 text-center">
            <span className={`text-lg font-bold font-display leading-none ${suitColorClass}`}>
              {card.rank}
            </span>
            <div className={`mt-0.5 ${suitColorClass}`}>
              <SuitIcon suit={card.suit} className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Center Medallion: Antique Lamp & Deck Crest */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center px-3">
            <div className="relative w-28 h-28 rounded-full border border-amber-500/40 bg-black/60 flex items-center justify-center p-3 shadow-inner group-hover:border-amber-400/80 transition-colors">
              {/* Concentric ornate rings */}
              <div className="absolute inset-1.5 rounded-full border border-dashed border-amber-500/25" />
              <div className="absolute inset-3 rounded-full border border-amber-500/15" />

              {/* Lamp Icon with ambient cord */}
              <div className="relative flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-300 group-hover:text-amber-200 group-hover:scale-110 transition-transform duration-300">
                  <Lightbulb className="w-6 h-6 stroke-[1.5]" />
                </div>
                {/* Abajur pull-cord decorative indicator */}
                <div className="w-0.5 h-3 bg-amber-400/60 mt-0.5" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
              </div>
            </div>

            {/* Card Label */}
            <h3 className="mt-4 font-display font-semibold text-base text-amber-100 tracking-wider">
              {card.title}
            </h3>
            {card.subtitle && (
              <p className="mt-0.5 text-xs text-amber-300/70 font-medium">
                {card.subtitle}
              </p>
            )}

            {/* Click to Light Up CTA */}
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium tracking-wide group-hover:bg-amber-500/20 group-hover:border-amber-400 transition-colors">
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>Clique para acender</span>
            </div>
          </div>

          {/* Bottom-Right Corner Index (Inverted) */}
          <div className="relative z-10 flex flex-col items-center w-7 text-center self-end rotate-180">
            <span className={`text-lg font-bold font-display leading-none ${suitColorClass}`}>
              {card.rank}
            </span>
            <div className={`mt-0.5 ${suitColorClass}`}>
              <SuitIcon suit={card.suit} className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* =========================================
            CARD FRONT (LIT STATE - REVELAÇÃO DO VÍDEO COM ABAJUR ACESO)
            ========================================= */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl bg-neutral-900 border-2 border-amber-400/80 backface-hidden rotate-y-180 flex flex-col p-3 overflow-hidden transition-all duration-500 ${lampGlowClass}`}
        >
          {/* Warm Ambient Lamp Gradient inside the frame */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/15 via-transparent to-black/80 pointer-events-none" />

          {/* Top Header inside Card: Suit, Rank, Title & Lamp Status */}
          <div className="relative z-10 flex items-center justify-between pb-2 border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 border border-amber-500/40">
                <span className={`text-sm font-bold font-display ${suitColorClass}`}>
                  {card.rank}
                </span>
                <SuitIcon suit={card.suit} className={`w-3.5 h-3.5 ${suitColorClass}`} />
              </div>
              <div className="leading-tight">
                <h4 className="text-xs font-semibold text-amber-100 font-display truncate max-w-[120px]">
                  {card.title}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-amber-300/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Acesa</span>
                </div>
              </div>
            </div>

            {/* Card quick actions: Edit card video & Fullscreen Cinema */}
            <div className="flex items-center gap-1.5 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCard(card);
                }}
                title="Trocar ou editar vídeo da carta"
                className="p-1.5 rounded-lg bg-neutral-950/80 text-amber-200/90 hover:text-white hover:bg-amber-500/30 border border-amber-500/30 hover:border-amber-400 transition-colors shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCinema(card);
                }}
                title="Assistir vídeo em Tela Cheia (Cinema)"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:text-neutral-950 hover:bg-amber-400 border border-amber-400/40 font-medium text-[11px] transition-all shadow-sm"
              >
                <Maximize2 className="w-3 h-3 stroke-[2.5]" />
                <span className="hidden xs:inline font-semibold">Tela Cheia</span>
              </button>
            </div>
          </div>

          {/* Central Video Container Frame */}
          <div className="relative z-10 flex-1 my-2 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-amber-500/30 shadow-inner group/video">
            {!parsed.embedUrl ? (
              <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center text-amber-200/80 gap-2 p-3 text-center">
                <span className="text-xs text-amber-300 font-medium">Nenhum vídeo configurado</span>
                <button
                  type="button"
                  onClick={() => onEditCard(card)}
                  className="px-2.5 py-1 text-xs bg-amber-500/20 border border-amber-500/40 rounded text-amber-200 hover:bg-amber-500/30"
                >
                  Inserir vídeo
                </button>
              </div>
            ) : parsed.type === 'youtube' || parsed.type === 'vimeo' ? (
              <iframe
                src={parsed.embedUrl}
                title={card.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={parsed.embedUrl}
                  playsInline
                  autoPlay
                  muted={isMuted}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onLoadedData={() => setIsVideoLoaded(true)}
                  onError={() => setVideoError(true)}
                  className="w-full h-full object-cover"
                />

                {/* Video controls overlay inside the card */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-90 group-hover/video:opacity-100 transition-opacity z-20">
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    title={isPlaying ? 'Pausar Vídeo' : 'Reproduzir Vídeo'}
                    className="p-1.5 rounded-full bg-black/80 text-amber-200 hover:text-white border border-amber-400/40 backdrop-blur-sm transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={toggleMute}
                    title={isMuted ? 'Ativar Áudio' : 'Mutar Áudio'}
                    className="p-1.5 rounded-full bg-black/80 text-amber-200 hover:text-white border border-amber-400/40 backdrop-blur-sm transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCinema(card);
                    }}
                    title="Assistir em Tela Cheia / Modo Cinema"
                    className="p-1.5 rounded-full bg-black/80 text-amber-200 hover:text-white hover:bg-amber-500/20 border border-amber-400/40 backdrop-blur-sm transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Loading / Error state */}
                {!isVideoLoaded && !videoError && (
                  <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center text-amber-300/80 gap-2 p-3 text-center">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Carregando vídeo...</span>
                  </div>
                )}

                {videoError && (
                  <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center text-amber-200/80 gap-2 p-3 text-center">
                    <span className="text-xs text-rose-300 font-medium">Erro ao carregar vídeo</span>
                    <button
                      onClick={() => onEditCard(card)}
                      className="px-2.5 py-1 text-xs bg-amber-500/20 border border-amber-500/40 rounded text-amber-200 hover:bg-amber-500/30"
                    >
                      Inserir outro vídeo
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Glowing Lamp Filament Line at the top of the video */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80" />
          </div>

          {/* Bottom Card Footer with Card description & Lamp Warmth indicator */}
          <div className="relative z-10 pt-1 flex items-center justify-between text-[11px] text-amber-200/70 border-t border-amber-500/20">
            <span className="truncate max-w-[170px]">
              {card.subtitle || 'Vídeo revelado'}
            </span>
            <div className="flex items-center gap-1 text-amber-300 animate-filament">
              <Sparkles className="w-3 h-3" />
              <span className="font-medium text-[10px]">Iluminado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
