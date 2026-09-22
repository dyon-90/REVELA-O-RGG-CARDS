import React, { useState, useRef, useEffect } from 'react';
import { PlayingCardData, CardRank, CardSuit } from '../types/card';
import { SuitIcon } from './SuitIcon';
import { parseVideoUrl } from '../utils/videoHelper';
import { saveVideoBlob } from '../utils/db';
import { uploadVideoToServer, fetchServerStoredVideos, StoredServerVideo } from '../utils/api';
import { soundEngine } from '../utils/audio';
import { X, Upload, Link, Film, Check, AlertCircle, Server, HardDrive, RefreshCw } from 'lucide-react';

interface CardEditorModalProps {
  card: PlayingCardData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Partial<PlayingCardData> & { id?: string }) => void;
}

const SAMPLE_VIDEOS = [
  {
    name: 'Fogo & Chamas',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    subtitle: 'Chamas crepitantes',
  },
  {
    name: 'Oceano e Ondas',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    subtitle: 'Maré cinematográfica',
  },
  {
    name: 'Cosmos & Estrelas',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    subtitle: 'Navegação pelas estrelas',
  },
  {
    name: 'Horizonte Aberto',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    subtitle: 'Ficção e tecnologia',
  },
  {
    name: 'Fuga Noturna',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    subtitle: 'Estrada ao crepúsculo',
  },
  {
    name: 'Velocidade e Ação',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    subtitle: 'Adrenalina pura',
  },
];

const RANKS: CardRank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', '★'];
const SUITS: { suit: CardSuit; label: string }[] = [
  { suit: 'spades', label: 'Espadas (♠)' },
  { suit: 'hearts', label: 'Copas (♥)' },
  { suit: 'diamonds', label: 'Ouros (♦)' },
  { suit: 'clubs', label: 'Paus (♣)' },
  { suit: 'special', label: 'Coringa (★)' },
];

export const CardEditorModal: React.FC<CardEditorModalProps> = ({
  card,
  isOpen,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(card);

  const [title, setTitle] = useState(card?.title || 'Nova Carta');
  const [subtitle, setSubtitle] = useState(card?.subtitle || 'Vídeo Misterioso');
  const [rank, setRank] = useState<CardRank>(card?.rank || 'A');
  const [suit, setSuit] = useState<CardSuit>(card?.suit || 'spades');
  const [videoUrl, setVideoUrl] = useState(card?.videoUrl || '');
  const [sourceTab, setSourceTab] = useState<'url' | 'upload' | 'server' | 'samples'>('upload');
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [isServerStored, setIsServerStored] = useState(false);
  const [serverVideos, setServerVideos] = useState<StoredServerVideo[]>([]);
  const [isLoadingServerVideos, setIsLoadingServerVideos] = useState(false);
  const [failedFile, setFailedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadServerVideos = async () => {
    setIsLoadingServerVideos(true);
    const list = await fetchServerStoredVideos();
    setServerVideos(list);
    setIsLoadingServerVideos(false);
  };

  // Sync when card changes
  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setSubtitle(card.subtitle || '');
      setRank(card.rank);
      setSuit(card.suit);
      setVideoUrl(card.videoUrl);
      const isServerVideo = card.videoUrl.startsWith('/uploads/');
      setIsServerStored(isServerVideo);
      setUploadFileName(card.videoBlobKey ? 'Vídeo Local Salvo' : isServerVideo ? 'Vídeo Armazenado no Servidor' : null);
      if (isServerVideo) {
        setSourceTab('server');
      }
    } else {
      setTitle('Ás de Ouros');
      setSubtitle('Segredo Iluminado');
      setRank('A');
      setSuit('diamonds');
      setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      setUploadFileName(null);
      setIsServerStored(false);
      setSourceTab('upload');
    }
    setUploadError(null);
    setUploadSuccessMsg(null);
    setFailedFile(null);
    loadServerVideos();
  }, [card, isOpen]);

  if (!isOpen) return null;

  const parsed = parseVideoUrl(videoUrl);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setUploadError('Por favor selecione um arquivo de vídeo válido (.mp4, .webm, .mov, etc.)');
      return;
    }

    setUploadError(null);
    setUploadSuccessMsg(null);
    setFailedFile(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload directly to backend storage (/public/uploads)
      const serverResult = await uploadVideoToServer(file, card?.id, (percent) => {
        setUploadProgress(percent);
      });

      if (serverResult.success && serverResult.videoUrl) {
        setVideoUrl(serverResult.videoUrl);
        setUploadFileName(file.name);
        setIsServerStored(true);
        setIsUploading(false);
        setUploadProgress(null);
        setUploadSuccessMsg(`Vídeo gravado com sucesso no servidor: ${serverResult.videoUrl}`);
        loadServerVideos();
        return;
      }

      // If server upload failed, report the actual reason
      const errMsg = serverResult.error || 'O servidor não aceitou o arquivo.';
      setUploadError(`Falha ao gravar no servidor: ${errMsg}`);
      setFailedFile(file);
      setIsUploading(false);
      setUploadProgress(null);
    } catch (err: any) {
      console.error(err);
      setUploadError(`Erro de conexão com o servidor: ${err?.message || 'Falha de rede'}.`);
      setFailedFile(file);
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleSaveLocallyAsFallback = async () => {
    if (!failedFile) return;
    try {
      setIsUploading(true);
      const blobKey = `video_${Date.now()}_${failedFile.name}`;
      await saveVideoBlob(blobKey, failedFile);
      const objectUrl = URL.createObjectURL(failedFile);
      setVideoUrl(objectUrl);
      setUploadFileName(failedFile.name);
      setIsServerStored(false);
      setIsUploading(false);
      setUploadError(null);
      setUploadSuccessMsg('Vídeo salvo temporariamente no navegador (IndexedDB).');
      setFailedFile(null);
    } catch {
      setUploadError('Não foi possível salvar nem no navegador.');
      setIsUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      setUploadError('Por favor, informe uma URL de vídeo ou faça o upload de um arquivo.');
      return;
    }

    soundEngine.playCardFlickSound();
    onSave({
      ...(card ? { id: card.id } : {}),
      title: title.trim() || 'Carta sem título',
      subtitle: subtitle.trim(),
      rank,
      suit,
      videoUrl: videoUrl.trim(),
      videoType: isServerStored ? 'direct' : parsed.type,
      videoBlobKey: isServerStored ? undefined : (uploadFileName ? `video_${Date.now()}` : undefined),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-editor-title"
        className="relative w-full max-w-2xl bg-neutral-900 border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden text-neutral-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 id="card-editor-title" className="font-display font-bold text-lg text-amber-100">
                {isEditing ? 'Configurar Vídeo da Carta' : 'Adicionar Nova Carta com Vídeo'}
              </h2>
              <p className="text-xs text-neutral-400">
                Personalize os dados da carta e o vídeo que será revelado quando ela acender.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Card Appearance (Rank, Suit, Title) */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
              Aparência da Carta de Baralho
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Título da Carta
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Ás Secreto"
                  className="w-full px-3 py-2 text-sm bg-neutral-950 border border-neutral-800 rounded-lg focus:border-amber-400 focus:outline-none text-white transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Subtítulo / Descrição
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex: Revelação de cinema"
                  className="w-full px-3 py-2 text-sm bg-neutral-950 border border-neutral-800 rounded-lg focus:border-amber-400 focus:outline-none text-white transition-colors"
                />
              </div>
            </div>

            {/* Rank and Suit Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Rank */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Valor / Posto da Carta
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-950 border border-neutral-800 rounded-lg">
                  {RANKS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRank(r)}
                      className={`min-w-8 h-8 px-1.5 text-xs font-bold rounded font-display transition-all ${
                        rank === r
                          ? 'bg-amber-500 text-neutral-950 shadow-md font-black scale-105'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suit */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Naipe do Baralho
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-neutral-950 border border-neutral-800 rounded-lg">
                  {SUITS.map((s) => (
                    <button
                      key={s.suit}
                      type="button"
                      onClick={() => setSuit(s.suit)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-all ${
                        suit === s.suit
                          ? 'bg-amber-500/20 border border-amber-400 text-amber-300 font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-transparent'
                      }`}
                    >
                      <SuitIcon suit={s.suit} className="w-3.5 h-3.5" />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Video Insertion Source Selection */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
                Vídeo que fica Atrás da Carta
              </h3>
              <span className="text-[11px] text-neutral-400">
                Reproduzido quando o abajur acender
              </span>
            </div>

            {/* Source Tab switcher */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
              <button
                type="button"
                onClick={() => setSourceTab('upload')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium rounded-lg transition-colors ${
                  sourceTab === 'upload'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Servidor</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSourceTab('server');
                  loadServerVideos();
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium rounded-lg transition-colors ${
                  sourceTab === 'server'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Vídeos Gravados ({serverVideos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceTab('url')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium rounded-lg transition-colors ${
                  sourceTab === 'url'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span>Link URL</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceTab('samples')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium rounded-lg transition-colors ${
                  sourceTab === 'samples'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Modelos</span>
              </button>
            </div>

            {/* Tab 1: Upload File directly to Server Storage */}
            {sourceTab === 'upload' && (
              <div className="space-y-3 p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-xl p-6 text-center cursor-pointer bg-neutral-900/50 hover:bg-amber-500/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-100">
                    Clique aqui para enviar um vídeo do seu computador
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    O arquivo será gravado na pasta física <code className="text-amber-300">/uploads</code> do servidor Hostinger e registrado no banco
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-2">
                    Formatos aceitos: MP4, WebM, MOV, OGG (até 300MB)
                  </p>
                </div>

                {uploadProgress !== null && isUploading && (
                  <div className="space-y-1.5 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex justify-between text-xs text-amber-300 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 animate-pulse" />
                        Gravando vídeo no servidor da Hostinger...
                      </span>
                      <span className="font-mono font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadSuccessMsg && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-emerald-200">Armazenado no Servidor com Sucesso!</p>
                      <p className="text-[11px] text-emerald-400/90 font-mono mt-0.5 break-all">{uploadSuccessMsg}</p>
                    </div>
                  </div>
                )}

                {uploadFileName && !uploadSuccessMsg && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex-1 truncate">
                      <span>Vídeo: <strong>{uploadFileName}</strong></span>
                      {isServerStored && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                          <Server className="w-2.5 h-2.5" /> No Servidor
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {isUploading && uploadProgress === null && (
                  <div className="text-xs text-amber-300 animate-pulse flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    Gravando arquivo e gerando rota...
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Stored Server Videos */}
            {sourceTab === 'server' && (
              <div className="space-y-3 p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-neutral-300 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-amber-400" />
                    <span>Vídeos gravados na pasta <code>/uploads</code> do servidor</span>
                  </div>
                  <button
                    type="button"
                    onClick={loadServerVideos}
                    disabled={isLoadingServerVideos}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 p-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingServerVideos ? 'animate-spin' : ''}`} />
                    Atualizar
                  </button>
                </div>

                {isLoadingServerVideos ? (
                  <div className="py-6 text-center text-xs text-neutral-400">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Consultando pasta do servidor...
                  </div>
                ) : serverVideos.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-800 rounded-lg p-4">
                    <HardDrive className="w-6 h-6 text-neutral-600 mx-auto mb-1.5" />
                    <p>Nenhum arquivo de vídeo foi gravado ainda nesta pasta.</p>
                    <button
                      type="button"
                      onClick={() => setSourceTab('upload')}
                      className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-neutral-950 font-bold rounded-lg text-xs hover:bg-amber-400"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Enviar Primeiro Vídeo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {serverVideos.map((sv) => {
                      const isSelected = videoUrl === sv.url;
                      const sizeMb = (sv.size / (1024 * 1024)).toFixed(1);
                      return (
                        <div
                          key={sv.filename}
                          className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-white'
                              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold truncate text-amber-300">
                                {sv.filename}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] bg-amber-500 text-neutral-950 font-bold px-1.5 py-0.2 rounded">
                                  Selecionado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5">
                              <span>Tamanho: {sizeMb} MB</span>
                              <span>•</span>
                              <span>Rota: <code className="text-neutral-300">{sv.url}</code></span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setVideoUrl(sv.url);
                              setUploadFileName(sv.filename);
                              setIsServerStored(true);
                              setUploadError(null);
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-amber-500 text-neutral-950 font-bold'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                            }`}
                          >
                            {isSelected ? 'Em Uso' : 'Usar Vídeo'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: URL input */}
            {sourceTab === 'url' && (
              <div className="space-y-2 p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl">
                <label className="block text-xs font-medium text-neutral-300">
                  Insira o link do vídeo
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    setUploadFileName(null);
                    setUploadError(null);
                    setIsServerStored(e.target.value.startsWith('/uploads/'));
                  }}
                  placeholder="Ex: https://www.youtube.com/watch?v=... ou link direto .mp4"
                  className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-lg focus:border-amber-400 focus:outline-none text-white font-mono text-xs"
                />
                <p className="text-[11px] text-neutral-400">
                  Suporta vídeos diretos (.mp4, .webm), YouTube, YouTube Shorts e Vimeo.
                </p>
              </div>
            )}

            {/* Tab 4: Curated Samples */}
            {sourceTab === 'samples' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl max-h-48 overflow-y-auto">
                {SAMPLE_VIDEOS.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => {
                      setVideoUrl(sample.url);
                      setSubtitle(sample.subtitle);
                      setUploadFileName(null);
                      setIsServerStored(false);
                    }}
                    className={`flex flex-col text-left p-2.5 rounded-lg border transition-all ${
                      videoUrl === sample.url
                        ? 'bg-amber-500/20 border-amber-400 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-xs font-semibold text-amber-200">{sample.name}</span>
                    <span className="text-[10px] text-neutral-400">{sample.subtitle}</span>
                  </button>
                ))}
              </div>
            )}

            {uploadError && (
              <div className="space-y-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div className="flex-1">
                    <p className="font-semibold">{uploadError}</p>
                    {failedFile && (
                      <div className="mt-2 pt-2 border-t border-rose-500/20 flex items-center justify-between">
                        <span className="text-neutral-400">Deseja guardar temporariamente no navegador?</span>
                        <button
                          type="button"
                          onClick={handleSaveLocallyAsFallback}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-semibold"
                        >
                          Salvar Localmente
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Box */}
          {videoUrl.trim() && parsed.embedUrl && (
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <label className="block text-xs font-medium text-neutral-300">
                Pré-visualização do Vídeo
              </label>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-amber-500/40 shadow-inner flex items-center justify-center">
                {parsed.type === 'youtube' || parsed.type === 'vimeo' ? (
                  <iframe
                    src={parsed.embedUrl}
                    title="Preview"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media"
                  />
                ) : (
                  <video
                    src={parsed.embedUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-amber-500/20 bg-neutral-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-colors"
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Carta com Vídeo'}
          </button>
        </div>
      </div>
    </div>
  );
};
