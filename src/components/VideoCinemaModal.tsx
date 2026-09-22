import React, { useState, useEffect, useRef } from 'react';
import { PlayingCardData, LampWarmth } from '../types/card';
import { SuitIcon } from './SuitIcon';
import { parseVideoUrl } from '../utils/videoHelper';
import { X, Sparkles, Maximize2, Minimize2, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoCinemaModalProps {
  card: PlayingCardData | null;
  lampWarmth: LampWarmth;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoCinemaModal: React.FC<VideoCinemaModalProps> = ({
  card,
  lampWarmth,
  isOpen,
  onClose,
}) => {
  // Start directly in fullscreen when modal opens
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modalWrapperRef = useRef<HTMLDivElement | null>(null);

  // When opening, automatically start in fullscreen mode and attempt native Fullscreen if allowed
  useEffect(() => {
    if (isOpen && card) {
      setIsFullscreen(true);
      setIsPlaying(true);

      // Attempt native fullscreen API on open
      const attemptFullscreen = async () => {
        try {
          const target = modalWrapperRef.current;
          if (!document.fullscreenElement && target) {
            if (target.requestFullscreen) {
              await target.requestFullscreen();
            } else if ((target as any).webkitRequestFullscreen) {
              await (target as any).webkitRequestFullscreen();
            }
          }
        } catch {
          // If native fullscreen is restricted by iframe/browser policy,
          // isFullscreen remains true which provides full-viewport fullscreen styling
        }
      };

      const timer = setTimeout(attemptFullscreen, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, card]);

  // Synchronize state when browser enters or leaves native fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeFs = Boolean(document.fullscreenElement);
      // Only set to false if native fullscreen exited
      if (!activeFs && document.fullscreenElement === null) {
        // user pressed ESC on native fullscreen
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!isOpen || !card) return null;

  const toggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !isFullscreen) {
        const target = modalWrapperRef.current;
        if (target && target.requestFullscreen) {
          await target.requestFullscreen();
        } else if (target && (target as any).webkitRequestFullscreen) {
          await (target as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          }
        }
        setIsFullscreen((prev) => !prev);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  const togglePlayPause = () => {
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

  const toggleMute = () => {
    if (videoRef.current) {
      const next = !videoRef.current.muted;
      videoRef.current.muted = next;
      setIsMuted(next);
    }
  };

  const parsed = parseVideoUrl(card.videoUrl);
  const isRedSuit = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitColorClass = isRedSuit ? 'text-rose-500' : card.suit === 'special' ? 'text-amber-400' : 'text-amber-200';

  const glowColor =
    lampWarmth === 'warm-amber'
      ? 'rgba(245, 158, 11, 0.45)'
      : lampWarmth === 'golden-vintage'
      ? 'rgba(250, 204, 21, 0.5)'
      : lampWarmth === 'candle-glow'
      ? 'rgba(249, 115, 22, 0.48)'
      : 'rgba(254, 240, 138, 0.42)';

  return (
    <div
      ref={modalWrapperRef}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg ${
        isFullscreen ? 'p-0 w-screen h-screen' : 'p-3 sm:p-6'
      } transition-all duration-300`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cinema-title"
        className={`relative w-full ${
          isFullscreen
            ? 'h-full w-full rounded-none border-0 max-w-none'
            : 'max-w-5xl rounded-2xl border border-amber-500/40 shadow-2xl'
        } bg-black overflow-hidden flex flex-col transition-all duration-300`}
        style={{
          boxShadow: isFullscreen ? 'none' : `0 0 80px 20px ${glowColor}, 0 25px 50px -12px rgba(0, 0, 0, 0.9)`,
        }}
      >
        {/* Top Header Bar - Highly transparent floating glass HUD */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-white/10 bg-black/10 hover:bg-black/25 transition-all duration-300 z-30 pointer-events-auto group/topbar">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/15 border border-amber-400/20 backdrop-blur-[2px]">
              <span className={`text-sm font-bold font-display ${suitColorClass}`}>
                {card.rank}
              </span>
              <SuitIcon suit={card.suit} className={`w-3.5 h-3.5 ${suitColorClass}`} />
            </div>
            <div>
              <h2 id="cinema-title" className="font-display font-semibold text-xs sm:text-sm text-white/95 leading-tight [text-shadow:0_2px_4px_rgba(0,0,0,0.9)]">
                {card.title}
              </h2>
              <div className="flex items-center gap-1 text-[11px] text-amber-300/90 font-medium [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>REVELAÇÃO RGG CARDS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleBrowserFullscreen}
              title={isFullscreen ? 'Restaurar janela (ESC)' : 'Expandir para Tela Cheia'}
              aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/15 hover:bg-black/35 text-amber-200 hover:text-white border border-white/10 text-xs font-semibold backdrop-blur-[2px] transition-all [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 stroke-[2]" />
                  <span className="hidden sm:inline">Restaurar</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 stroke-[2]" />
                  <span className="hidden sm:inline">Tela Cheia</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                onClose();
              }}
              aria-label="Fechar"
              className="p-1 rounded-lg text-white/80 hover:text-white bg-black/15 hover:bg-black/35 border border-white/10 backdrop-blur-[2px] transition-colors [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Canvas Viewport - fills top to bottom */}
        <div
          className={`relative w-full ${
            isFullscreen ? 'flex-1 h-full' : 'aspect-video'
          } bg-black flex items-center justify-center overflow-hidden`}
        >
          {!parsed.embedUrl ? (
            <div className="flex flex-col items-center justify-center text-amber-200/80 gap-2 p-6 text-center">
              <span className="text-sm text-amber-300 font-medium">Nenhum vídeo disponível</span>
            </div>
          ) : parsed.type === 'youtube' || parsed.type === 'vimeo' ? (
            <iframe
              src={parsed.embedUrl}
              title={card.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={parsed.embedUrl}
                autoPlay
                playsInline
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />

              {/* Floating playback overlay controls - High transparency so video is always visible */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto bg-black/10 hover:bg-black/25 transition-all duration-300 px-3.5 py-1.5 rounded-xl border border-white/10 shadow-sm z-20">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    className="p-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/35 text-amber-300 border border-amber-400/25 transition-all"
                    title={isPlaying ? 'Pausar' : 'Reproduzir'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current stroke-[2]" /> : <Play className="w-3.5 h-3.5 fill-current stroke-[2]" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1.5 rounded-lg bg-black/20 hover:bg-black/35 text-neutral-200 hover:text-white border border-white/10 transition-all"
                    title={isMuted ? 'Ativar som' : 'Silenciar'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400 stroke-[2]" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400 stroke-[2]" />}
                  </button>
                  <span className="text-xs text-white/95 font-medium tracking-wide truncate max-w-[200px] sm:max-w-md [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                    {card.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleBrowserFullscreen}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/15 hover:bg-black/30 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-amber-400/20 transition-all [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]"
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize2 className="w-3 h-3 stroke-[2]" />
                        <span>Sair</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3 h-3 stroke-[2]" />
                        <span>Tela Cheia</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Top ambient filament glow line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none z-30" />
        </div>

        {/* Footer info (hidden in fullscreen) */}
        {!isFullscreen && card.subtitle && (
          <div className="px-5 py-2.5 bg-neutral-900/60 border-t border-amber-500/20 text-xs text-amber-200/75 flex items-center justify-between">
            <span>{card.subtitle}</span>
            <span className="text-[11px] text-neutral-400">
              Pressione ESC para fechar
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
