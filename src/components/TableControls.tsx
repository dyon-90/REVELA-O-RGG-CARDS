import React from 'react';
import { TableSurface, LampWarmth } from '../types/card';
import { soundEngine } from '../utils/audio';
import {
  Plus,
  Volume2,
  VolumeX,
  RotateCcw,
  Lightbulb,
  Palette,
  Sparkles,
  Maximize,
  Minimize,
  Play,
  Square,
} from 'lucide-react';

interface TableControlsProps {
  totalCards: number;
  litCardsCount: number;
  tableSurface: TableSurface;
  lampWarmth: LampWarmth;
  filterMode: 'all' | 'lit' | 'unlit';
  soundEnabled: boolean;
  dustEnabled: boolean;
  isTableFullscreen?: boolean;
  isAutoRevealing?: boolean;
  autoRevealInterval?: number;
  onSelectSurface: (surface: TableSurface) => void;
  onSelectWarmth: (warmth: LampWarmth) => void;
  onFilterChange: (mode: 'all' | 'lit' | 'unlit') => void;
  onToggleSound: () => void;
  onToggleDust: () => void;
  onToggleTableFullscreen?: () => void;
  onToggleAutoReveal?: () => void;
  onChangeAutoRevealInterval?: (intervalMs: number) => void;
  onResetAllLit: () => void;
  onAddNewCard: () => void;
}

export const TableControls: React.FC<TableControlsProps> = ({
  totalCards,
  litCardsCount,
  tableSurface,
  lampWarmth,
  filterMode,
  soundEnabled,
  dustEnabled,
  isTableFullscreen = false,
  isAutoRevealing = false,
  autoRevealInterval = 2500,
  onSelectSurface,
  onSelectWarmth,
  onFilterChange,
  onToggleSound,
  onToggleDust,
  onToggleTableFullscreen,
  onToggleAutoReveal,
  onChangeAutoRevealInterval,
  onResetAllLit,
  onAddNewCard,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-neutral-950/20 backdrop-blur-sm px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <a href="#" className="font-display font-bold text-xl tracking-wider text-amber-200 hover:text-amber-100 flex items-center gap-2">
            <span className="text-amber-400 font-serif">♠</span>
            <span className="tracking-wide">REVELAÇÃO RGG CARDS</span>
          </a>

          {/* Mobile counter indicator */}
          <div className="md:hidden flex items-center gap-2 text-xs text-amber-300/80">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{litCardsCount}/{totalCards} acesas</span>
          </div>
        </div>

        {/* Zone 2: Navigation / Filters / Table Settings */}
        <div className="flex items-center flex-wrap justify-center gap-2 text-xs font-medium text-neutral-300">
          {/* Card Filter Tabs */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-amber-500/20 text-amber-200 font-semibold border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todas ({totalCards})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('lit')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterMode === 'lit'
                  ? 'bg-amber-500/20 text-amber-200 font-semibold border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Acesas ({litCardsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('unlit')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                filterMode === 'unlit'
                  ? 'bg-amber-500/20 text-amber-200 font-semibold border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Apagadas ({totalCards - litCardsCount})
            </button>
          </div>

          {/* Lamp Tone Selector */}
          <div className="relative flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={lampWarmth}
              onChange={(e) => onSelectWarmth(e.target.value as LampWarmth)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
              title="Tom da Luz do Abajur"
            >
              <option value="warm-amber" className="bg-neutral-900 text-neutral-200">Âmbar 2200K</option>
              <option value="golden-vintage" className="bg-neutral-900 text-neutral-200">Dourado 2700K</option>
              <option value="candle-glow" className="bg-neutral-900 text-neutral-200">Luz de Vela</option>
              <option value="daylight" className="bg-neutral-900 text-neutral-200">Luz Suave</option>
            </select>
          </div>

          {/* Table Surface Felt Selector */}
          <div className="relative flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1">
            <Palette className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <select
              value={tableSurface}
              onChange={(e) => onSelectSurface(e.target.value as TableSurface)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
              title="Superfície da Mesa"
            >
              <option value="felt-green" className="bg-neutral-900 text-neutral-200">Feltro Verde</option>
              <option value="royal-blue" className="bg-neutral-900 text-neutral-200">Azul Meia-Noite</option>
              <option value="mahogany" className="bg-neutral-900 text-neutral-200">Mogno Escuro</option>
              <option value="noir" className="bg-neutral-900 text-neutral-200">Carvão Noir</option>
            </select>
          </div>
        </div>

        {/* Zone 3: Primary actions */}
        <div className="flex items-center gap-2">
          {/* Dust motes floating in light toggle */}
          <button
            type="button"
            onClick={onToggleDust}
            title={dustEnabled ? 'Desativar partículas de poeira no ar' : 'Ativar partículas de poeira no ar'}
            className={`p-2 rounded-lg border transition-colors ${
              dustEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Desativar som do abajur' : 'Ativar som do abajur'}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-amber-500/40 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-500" />
            )}
          </button>

          {/* Fullscreen Table View Toggle */}
          {onToggleTableFullscreen && (
            <button
              type="button"
              onClick={onToggleTableFullscreen}
              title={isTableFullscreen ? 'Sair da tela cheia da mesa' : 'Mesa em Tela Cheia (Fullscreen)'}
              aria-label={isTableFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              {isTableFullscreen ? (
                <Minimize className="w-4 h-4 text-amber-400" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Auto-Reveal Presentation Mode */}
          {onToggleAutoReveal && (
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={onToggleAutoReveal}
                title={
                  isAutoRevealing
                    ? 'Pausar modo apresentação de revelação'
                    : 'Iniciar modo de apresentação (revela todas as cartas uma a uma)'
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isAutoRevealing
                    ? 'bg-amber-400 text-neutral-950 font-semibold shadow-sm animate-pulse'
                    : 'text-neutral-300 hover:text-amber-200 hover:bg-neutral-800/80'
                }`}
              >
                {isAutoRevealing ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">Pausar Apresentação</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                    <span className="hidden sm:inline">Revelação Automática</span>
                  </>
                )}
              </button>

              {/* Interval Speed Selector when auto-revealing or on hover */}
              {onChangeAutoRevealInterval && (
                <select
                  value={autoRevealInterval}
                  onChange={(e) => onChangeAutoRevealInterval(Number(e.target.value))}
                  title="Intervalo entre cada revelação de carta"
                  className="bg-transparent text-[11px] text-amber-300/90 hover:text-amber-200 focus:outline-none cursor-pointer pl-1.5 pr-1 border-l border-neutral-800 ml-1 py-1"
                >
                  <option value={1500} className="bg-neutral-900 text-neutral-200">1.5s</option>
                  <option value={2500} className="bg-neutral-900 text-neutral-200">2.5s</option>
                  <option value={4000} className="bg-neutral-900 text-neutral-200">4.0s</option>
                  <option value={6000} className="bg-neutral-900 text-neutral-200">6.0s</option>
                </select>
              )}
            </div>
          )}

          {/* Reset All Lit */}
          {litCardsCount > 0 && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playLampSwitchSound(false);
                onResetAllLit();
              }}
              title="Apagar todas as cartas"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 rounded-lg transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Apagar Cartas</span>
            </button>
          )}

          {/* Add New Card Button */}
          <button
            type="button"
            onClick={onAddNewCard}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Inserir Vídeo em Carta</span>
          </button>
        </div>
      </div>
    </header>
  );
};
