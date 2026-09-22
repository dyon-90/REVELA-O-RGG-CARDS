import React, { useState, useEffect, useRef } from 'react';
import { PlayingCardData, TableSurface, LampWarmth } from './types/card';
import { INITIAL_CARDS } from './data/defaultCards';
import { PlayingCard } from './components/PlayingCard';
import { TableControls } from './components/TableControls';
import { DustMotes } from './components/DustMotes';
import { LightConnectionWeb } from './components/LightConnectionWeb';
import { CardEditorModal } from './components/CardEditorModal';
import { VideoCinemaModal } from './components/VideoCinemaModal';
import { HostingerStorageModal } from './components/HostingerStorageModal';
import { soundEngine } from './utils/audio';
import { getVideoBlob } from './utils/db';
import { fetchCardsFromServer, syncCardsToServer } from './utils/api';
import { Sparkles, Lightbulb, Film, HelpCircle, Plus, Play, Square, Database, Server } from 'lucide-react';

const SESSION_STORAGE_KEY = 'baralho_lit_cards_state';
const LOCAL_STORAGE_CARDS_KEY = 'baralho_custom_deck_cards';

export default function App() {
  // Load custom cards or default cards
  const [cards, setCards] = useState<PlayingCardData[]>(() => {
    try {
      const savedCards = localStorage.getItem(LOCAL_STORAGE_CARDS_KEY);
      const parsedCards: PlayingCardData[] = savedCards ? JSON.parse(savedCards) : INITIAL_CARDS;

      // Restore lit states from session storage ("até eu fechar o programa")
      const sessionLit = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionLit) {
        const litIds: string[] = JSON.parse(sessionLit);
        return parsedCards.map((c) => ({
          ...c,
          isLit: litIds.includes(c.id),
        }));
      }
      return parsedCards;
    } catch {
      return INITIAL_CARDS;
    }
  });

  const [isServerSynced, setIsServerSynced] = useState<boolean>(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState<boolean>(false);

  // Sync with Hostinger backend database on launch
  useEffect(() => {
    async function loadServerCards() {
      const serverCards = await fetchCardsFromServer();
      if (serverCards && serverCards.length > 0) {
        // Preserve session lit status
        const sessionLit = sessionStorage.getItem(SESSION_STORAGE_KEY);
        const litIds: string[] = sessionLit ? JSON.parse(sessionLit) : [];
        const combined = serverCards.map((sc) => ({
          ...sc,
          isLit: litIds.includes(sc.id),
        }));
        setCards(combined);
        setIsServerSynced(true);
        syncLocalCards(combined);
      }
    }
    loadServerCards();
  }, []);

  // Re-hydrate any blob URLs from IndexedDB for local uploaded videos
  useEffect(() => {
    async function restoreBlobs() {
      let changed = false;
      const updated = await Promise.all(
        cards.map(async (c) => {
          if (c.videoBlobKey && (!c.videoUrl || c.videoUrl.startsWith('blob:'))) {
            const blob = await getVideoBlob(c.videoBlobKey);
            if (blob) {
              changed = true;
              return {
                ...c,
                videoUrl: URL.createObjectURL(blob),
              };
            }
          }
          return c;
        })
      );
      if (changed) {
        setCards(updated);
      }
    }
    restoreBlobs();
  }, []);

  const [tableSurface, setTableSurface] = useState<TableSurface>('felt-green');
  const [lampWarmth, setLampWarmth] = useState<LampWarmth>('warm-amber');
  const [filterMode, setFilterMode] = useState<'all' | 'lit' | 'unlit'>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [dustEnabled, setDustEnabled] = useState<boolean>(true);
  const [isTableFullscreen, setIsTableFullscreen] = useState<boolean>(false);
  const [isAutoRevealing, setIsAutoRevealing] = useState<boolean>(false);
  const [autoRevealInterval, setAutoRevealInterval] = useState<number>(2500);
  const [dustRevealTrigger, setDustRevealTrigger] = useState<number>(0);
  const [dustRevealCoords, setDustRevealCoords] = useState<{ x: number; y: number } | null>(null);

  // Modals state
  const [editingCard, setEditingCard] = useState<PlayingCardData | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [cinemaCard, setCinemaCard] = useState<PlayingCardData | null>(null);
  const [isCinemaOpen, setIsCinemaOpen] = useState<boolean>(false);

  // Sync lit status with sessionStorage
  const syncSessionLit = (updatedCards: PlayingCardData[]) => {
    try {
      const litIds = updatedCards.filter((c) => c.isLit).map((c) => c.id);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(litIds));
    } catch (e) {
      console.warn('Could not save lit state to sessionStorage', e);
    }
  };

  // Sync custom cards structure with localStorage
  const syncLocalCards = (updatedCards: PlayingCardData[]) => {
    try {
      // Strip dynamic blob URLs before storing structure in localStorage
      const storable = updatedCards.map((c) => ({
        ...c,
        videoUrl: c.videoBlobKey ? '' : c.videoUrl,
      }));
      localStorage.setItem(LOCAL_STORAGE_CARDS_KEY, JSON.stringify(storable));
    } catch (e) {
      console.warn('Could not save cards to localStorage', e);
    }
  };

  // Card click: turn on lamp and reveal video! Opens directly in fullscreen cinema mode
  const handleCardClick = (cardId: string, coords?: { x: number; y: number }) => {
    // Air displacement shockwave in dust particles
    setDustRevealTrigger((prev) => prev + 1);
    if (coords) {
      setDustRevealCoords(coords);
    } else {
      setDustRevealCoords(null);
    }

    let targetCard: PlayingCardData | null = null;

    setCards((prev) => {
      const next = prev.map((card) => {
        if (card.id === cardId) {
          const litCard = { ...card, isLit: true };
          targetCard = litCard;
          return litCard;
        }
        return card;
      });
      syncSessionLit(next);
      return next;
    });

    // Start video directly in fullscreen (Cinema)
    if (targetCard) {
      handleOpenCinema(targetCard);
    } else {
      const found = cards.find((c) => c.id === cardId);
      if (found) {
        handleOpenCinema({ ...found, isLit: true });
      }
    }
  };

  // Reset all lit cards
  const handleResetAllLit = () => {
    setIsAutoRevealing(false);
    setCards((prev) => {
      const next = prev.map((card) => ({ ...card, isLit: false }));
      syncSessionLit(next);
      return next;
    });
  };

  // Auto-Reveal Presentation Mode: turns on cards one by one in sequence
  const handleToggleAutoReveal = () => {
    setIsAutoRevealing((prev) => {
      const willStart = !prev;
      if (willStart) {
        // If all cards are already lit, reset them first so the presentation plays from start
        const unlitRemaining = cards.some((c) => !c.isLit);
        if (!unlitRemaining) {
          setCards((oldCards) => {
            const resetCards = oldCards.map((c) => ({ ...c, isLit: false }));
            syncSessionLit(resetCards);
            return resetCards;
          });
        }
      }
      return willStart;
    });
  };

  useEffect(() => {
    if (!isAutoRevealing) return;

    // Find the next unlit card
    const nextUnlit = cards.find((c) => !c.isLit);

    if (!nextUnlit) {
      // All cards have been revealed! Stop presentation gracefully
      setIsAutoRevealing(false);
      return;
    }

    const timer = setTimeout(() => {
      // Play turnover whoosh sound followed by lamp switch sound
      soundEngine.playCardFlipWhoosh();
      setTimeout(() => {
        soundEngine.playLampSwitchSound(true);
        // Trigger air burst across dust motes
        setDustRevealTrigger((prev) => prev + 1);
        setDustRevealCoords(null);
      }, 180);

      // Light up the next card
      setCards((prev) => {
        const next = prev.map((card) => {
          if (card.id === nextUnlit.id) {
            return { ...card, isLit: true };
          }
          return card;
        });
        syncSessionLit(next);
        return next;
      });
    }, autoRevealInterval);

    return () => clearTimeout(timer);
  }, [isAutoRevealing, cards, autoRevealInterval]);

  // Save new or edited card
  const handleSaveCard = (cardData: Partial<PlayingCardData> & { id?: string }) => {
    setCards((prev) => {
      let next: PlayingCardData[];
      if (cardData.id) {
        // Edit existing
        next = prev.map((c) => (c.id === cardData.id ? ({ ...c, ...cardData } as PlayingCardData) : c));
      } else {
        // Add new card
        const newCard: PlayingCardData = {
          id: `custom-card-${Date.now()}`,
          rank: cardData.rank || 'A',
          suit: cardData.suit || 'spades',
          title: cardData.title || 'Carta Revelada',
          subtitle: cardData.subtitle || 'Vídeo Especial',
          videoUrl: cardData.videoUrl || '',
          videoType: cardData.videoType || 'direct',
          videoBlobKey: cardData.videoBlobKey,
          isLit: false,
          createdAt: Date.now(),
        };
        next = [newCard, ...prev];
      }
      syncLocalCards(next);
      syncCardsToServer(next);
      return next;
    });
  };

  const handleOpenEditor = (cardToEdit?: PlayingCardData) => {
    setEditingCard(cardToEdit || null);
    setIsEditorOpen(true);
  };

  const handleOpenCinema = (card: PlayingCardData) => {
    setCinemaCard(card);
    setIsCinemaOpen(true);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    soundEngine.enabled = next;
    setSoundEnabled(next);
  };

  // Fullscreen table toggle
  useEffect(() => {
    const handleFsChange = () => {
      setIsTableFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleTableFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Failed to toggle fullscreen:', e);
      setIsTableFullscreen((prev) => !prev);
    }
  };

  const litCount = cards.filter((c) => c.isLit).length;

  const filteredCards = cards.filter((c) => {
    if (filterMode === 'lit') return c.isLit;
    if (filterMode === 'unlit') return !c.isLit;
    return true;
  });

  const surfaceClass = `surface-${tableSurface}`;
  const cardsGridRef = useRef<HTMLDivElement | null>(null);

  // List of IDs of cards currently visible in the grid that are lit
  const litCardIdsInGrid = filteredCards.filter((c) => c.isLit).map((c) => c.id);

  return (
    <div className={`min-h-screen w-full flex flex-col text-neutral-100 ${surfaceClass} transition-all duration-700 relative overflow-x-hidden`}>
      {/* Dynamic Ambient Room Light Bloom based on lit count */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-1000 z-0"
        style={{
          opacity: Math.min(0.9, 0.15 + (litCount / Math.max(cards.length, 1)) * 0.7),
          background:
            lampWarmth === 'warm-amber'
              ? 'radial-gradient(ellipse at 50% 15%, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.08) 55%, transparent 80%)'
              : lampWarmth === 'golden-vintage'
              ? 'radial-gradient(ellipse at 50% 15%, rgba(250, 204, 21, 0.3) 0%, rgba(202, 138, 4, 0.1) 55%, transparent 80%)'
              : lampWarmth === 'candle-glow'
              ? 'radial-gradient(ellipse at 50% 15%, rgba(249, 115, 22, 0.28) 0%, rgba(194, 65, 12, 0.09) 55%, transparent 80%)'
              : 'radial-gradient(ellipse at 50% 15%, rgba(254, 240, 138, 0.25) 0%, rgba(234, 179, 8, 0.08) 55%, transparent 80%)',
        }}
      />

      {/* Floating Dust Particles dancing in the abajur lamp light */}
      <DustMotes
        litCount={litCount}
        totalCount={cards.length}
        lampWarmth={lampWarmth}
        enabled={dustEnabled}
        revealTrigger={dustRevealTrigger}
        revealCoords={dustRevealCoords}
      />

      {/* Top Bar Navigation & Controls */}
      <TableControls
        totalCards={cards.length}
        litCardsCount={litCount}
        tableSurface={tableSurface}
        lampWarmth={lampWarmth}
        filterMode={filterMode}
        soundEnabled={soundEnabled}
        dustEnabled={dustEnabled}
        isTableFullscreen={isTableFullscreen}
        isAutoRevealing={isAutoRevealing}
        autoRevealInterval={autoRevealInterval}
        onSelectSurface={setTableSurface}
        onSelectWarmth={setLampWarmth}
        onFilterChange={setFilterMode}
        onToggleSound={handleToggleSound}
        onToggleDust={() => setDustEnabled((prev) => !prev)}
        onToggleTableFullscreen={handleToggleTableFullscreen}
        onToggleAutoReveal={handleToggleAutoReveal}
        onChangeAutoRevealInterval={setAutoRevealInterval}
        onResetAllLit={handleResetAllLit}
        onAddNewCard={() => handleOpenEditor()}
      />

      {/* Hero Atmosphere & Instructions */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
        <section className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium mb-3">
            <Lightbulb className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Toque na carta para acender a luz</span>
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-4xl text-amber-100 tracking-tight">
            Mesa de Cartas & Revelação de Vídeos
          </h1>

          <p className="mt-2 text-sm sm:text-base text-neutral-300/80 leading-relaxed">
            Cada carta guarda um vídeo secreto. Clique para ligar a iluminação de abajur, iluminar a mesa e revelar o vídeo atrás da carta. Uma vez acesa, ela permanece radiante.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{litCount} de {cards.length} cartas iluminadas</span>
            </span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsStorageModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-700 hover:border-amber-500/50 text-neutral-300 hover:text-amber-300 text-[11px] transition-colors cursor-pointer"
              title="Clique para gerenciar o armazenamento no servidor Hostinger"
            >
              <Server className="w-3 h-3 text-amber-400" />
              <span>{isServerSynced ? 'Servidor Hostinger Ativo (/uploads)' : 'Armazenamento no Servidor'}</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleToggleAutoReveal}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-medium ${
                isAutoRevealing
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-md animate-pulse'
                  : 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
              }`}
            >
              {isAutoRevealing ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Pausar Apresentação</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Apresentação Automática</span>
                </>
              )}
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => handleOpenEditor()}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-amber-400/40 transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Inserir Nova Carta</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleToggleTableFullscreen}
              className="text-amber-300/90 hover:text-amber-200 hover:underline flex items-center gap-1"
            >
              <span>{isTableFullscreen ? 'Sair da tela cheia' : 'Modo tela cheia'}</span>
            </button>
          </div>
        </section>

        {/* Cards Grid with Luminous Light Connection Web */}
        {filteredCards.length > 0 ? (
          <div ref={cardsGridRef} className="relative w-full mb-16">
            {/* Luminous Light Connection Web connecting lit cards */}
            <LightConnectionWeb
              gridContainerRef={cardsGridRef}
              litCardIds={litCardIdsInGrid}
              lampWarmth={lampWarmth}
              isVisible={true}
            />

            <div className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 justify-items-center">
              {filteredCards.map((card) => (
                <PlayingCard
                  key={card.id}
                  card={card}
                  lampWarmth={lampWarmth}
                  onCardClick={handleCardClick}
                  onOpenCinema={handleOpenCinema}
                  onEditCard={(c) => handleOpenEditor(c)}
                />
              ))}

              {/* Quick Add Card Slot directly in the grid */}
              <button
                type="button"
                onClick={() => handleOpenEditor()}
                className="w-72 h-[410px] rounded-2xl border-2 border-dashed border-amber-500/30 hover:border-amber-400 bg-neutral-950/40 hover:bg-amber-500/5 transition-all duration-300 flex flex-col items-center justify-center p-6 text-center group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 group-hover:border-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 flex items-center justify-center text-amber-400 transition-all duration-300 mb-4 shadow-lg">
                  <Plus className="w-7 h-7 stroke-[2.5]" />
                </div>
                <h3 className="font-display font-semibold text-lg text-amber-100 group-hover:text-amber-200 transition-colors">
                  Inserir Nova Carta
                </h3>
                <p className="mt-1.5 text-xs text-neutral-400 group-hover:text-neutral-300 max-w-[200px] leading-relaxed">
                  Adicione um vídeo por link ou faça upload de um arquivo para o baralho
                </p>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md py-16 text-center border border-dashed border-amber-500/30 rounded-2xl bg-neutral-900/40 p-8 my-8">
            <Sparkles className="w-8 h-8 text-amber-400/60 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-amber-100 font-display">Nenhuma carta encontrada</h3>
            <p className="text-xs text-neutral-400 mt-1 mb-4">
              Não há cartas com o filtro selecionado.
            </p>
            <button
              onClick={() => setFilterMode('all')}
              className="px-4 py-2 text-xs bg-amber-500/20 border border-amber-400/40 text-amber-200 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              Exibir todas as cartas
            </button>
          </div>
        )}

        {/* Instructions / Tips Box */}
        <footer className="w-full max-w-3xl mt-auto pt-8 border-t border-amber-500/20 text-center pb-8 text-xs text-neutral-400 space-y-2">
          <div className="flex items-center justify-center gap-2 text-amber-300/80">
            <HelpCircle className="w-4 h-4" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">Como Funciona</span>
          </div>
          <p className="max-w-xl mx-auto leading-relaxed text-neutral-400 text-xs">
            1. Clique no verso de qualquer carta para ativar o interruptor do abajur e girá-la para o vídeo.<br />
            2. Para colocar seus próprios vídeos, clique no botão <strong className="text-amber-300">"Inserir Vídeo em Carta"</strong> no topo ou no ícone de lápis em qualquer carta já revelada.<br />
            3. A carta permanece acesa durante toda a sessão até você fechar o programa ou clicar em "Apagar Cartas".
          </p>
        </footer>
      </main>

      {/* Card Insertion & Editing Modal */}
      <CardEditorModal
        card={editingCard}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingCard(null);
        }}
        onSave={handleSaveCard}
      />

      {/* Expanded Cinema Viewport Modal */}
      <VideoCinemaModal
        card={cinemaCard}
        lampWarmth={lampWarmth}
        isOpen={isCinemaOpen}
        onClose={() => {
          setIsCinemaOpen(false);
          setCinemaCard(null);
        }}
      />

      {/* Hostinger Server Storage & MySQL Modal */}
      <HostingerStorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
      />
    </div>
  );
}
