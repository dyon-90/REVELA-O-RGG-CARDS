import React, { useState, useEffect, useRef } from 'react';
import { ServerHealthInfo, StoredServerVideo, checkServerHealth, fetchServerStoredVideos, uploadVideoToServer, deleteServerStoredVideo } from '../utils/api';
import { X, Server, HardDrive, Upload, Trash2, Check, RefreshCw, Copy, ExternalLink, Play, Database, FileText } from 'lucide-react';

interface HostingerStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostingerStorageModal: React.FC<HostingerStorageModalProps> = ({ isOpen, onClose }) => {
  const [health, setHealth] = useState<ServerHealthInfo | null>(null);
  const [videos, setVideos] = useState<StoredServerVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [tab, setTab] = useState<'videos' | 'sql' | 'instructions'>('videos');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshData = async () => {
    setLoading(true);
    const [healthData, videoList] = await Promise.all([
      checkServerHealth(),
      fetchServerStoredVideos(),
    ]);
    setHealth(healthData);
    setVideos(videoList);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    const res = await uploadVideoToServer(file, undefined, (percent) => {
      setUploadProgress(percent);
    });

    setUploadProgress(null);
    if (res.success) {
      refreshData();
    } else {
      alert(`Falha no upload: ${res.error || 'Erro desconhecido'}`);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${filename}" do servidor?`)) return;
    const ok = await deleteServerStoredVideo(filename);
    if (ok) {
      if (previewVideo && previewVideo.includes(filename)) {
        setPreviewVideo(null);
      }
      refreshData();
    } else {
      alert('Não foi possível excluir o arquivo do servidor.');
    }
  };

  const sqlSchema = `-- Estrutura MySQL para Hostinger (phpMyAdmin)
CREATE TABLE IF NOT EXISTS \`cards_videos\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`subtitle\` VARCHAR(255) DEFAULT NULL,
  \`rank\` VARCHAR(10) NOT NULL DEFAULT 'A',
  \`suit\` ENUM('spades', 'hearts', 'diamonds', 'clubs', 'special') NOT NULL DEFAULT 'spades',
  \`video_url\` VARCHAR(500) NOT NULL,            -- Ex: /uploads/video-171112233-meuvideo.mp4
  \`original_filename\` VARCHAR(255) DEFAULT NULL,
  \`file_size\` BIGINT UNSIGNED DEFAULT NULL,
  \`mime_type\` VARCHAR(50) DEFAULT 'video/mp4',
  \`accent_color\` VARCHAR(20) DEFAULT '#f59e0b',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Armazenamento no Servidor (Hostinger)
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {health?.status === 'online' ? 'Servidor Ativo' : 'Conectando...'}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Gerenciamento físico dos vídeos e sincronização do banco de dados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Status Bar */}
        <div className="px-6 py-3 bg-neutral-950/40 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-neutral-300">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>Pasta: <code className="text-amber-200">/public/uploads</code></span>
            </span>
            <span>•</span>
            <span>
              Vídeos armazenados: <strong className="text-white">{videos.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-md transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Enviar Vídeo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
        </div>

        {uploadProgress !== null && (
          <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs flex items-center justify-between text-amber-300">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              Gravando vídeo no servidor da Hostinger...
            </span>
            <span className="font-mono font-bold">{uploadProgress}%</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 px-6 pt-2 gap-2 bg-neutral-950/20">
          <button
            onClick={() => setTab('videos')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'videos'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Vídeos Armazenados ({videos.length})
          </button>
          <button
            onClick={() => setTab('sql')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'sql'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Tabela MySQL (Hostinger)
          </button>
          <button
            onClick={() => setTab('instructions')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'instructions'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Como Hospedar na Hostinger
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {tab === 'videos' && (
            <div>
              {videos.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-neutral-800 rounded-xl p-8">
                  <HardDrive className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-neutral-200">
                    Nenhum vídeo gravado no servidor ainda
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1 mb-4">
                    Ao editar uma carta ou clicar em "Enviar Vídeo", o arquivo é gravado na pasta física <code>/uploads</code> do servidor e passa a ser servido diretamente pela Hostinger.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Enviar Primeiro Vídeo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {previewVideo && (
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5" /> Reprodução de Teste do Servidor
                        </span>
                        <button
                          onClick={() => setPreviewVideo(null)}
                          className="text-neutral-400 hover:text-white"
                        >
                          Fechar
                        </button>
                      </div>
                      <video
                        src={previewVideo}
                        controls
                        autoPlay
                        className="w-full max-h-56 rounded-lg bg-black object-contain"
                      />
                      <p className="text-[11px] text-neutral-400 font-mono">
                        URL: {previewVideo}
                      </p>
                    </div>
                  )}

                  <div className="border border-neutral-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
                        <tr>
                          <th className="py-3 px-4">Nome do Arquivo</th>
                          <th className="py-3 px-4">Tamanho</th>
                          <th className="py-3 px-4">Caminho / URL</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800 text-neutral-300">
                        {videos.map((vid) => {
                          const sizeMb = (vid.size / (1024 * 1024)).toFixed(1);
                          return (
                            <tr key={vid.filename} className="hover:bg-neutral-800/40 transition-colors">
                              <td className="py-3 px-4 font-mono font-medium text-amber-200">
                                {vid.filename}
                              </td>
                              <td className="py-3 px-4 text-neutral-400 font-mono">
                                {sizeMb} MB
                              </td>
                              <td className="py-3 px-4">
                                <a
                                  href={vid.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-neutral-300 hover:text-amber-400 flex items-center gap-1 font-mono text-[11px]"
                                >
                                  {vid.url}
                                  <ExternalLink className="w-3 h-3 text-neutral-500" />
                                </a>
                              </td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <button
                                  onClick={() => setPreviewVideo(vid.url)}
                                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium inline-flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3" />
                                  Testar
                                </button>
                                <button
                                  onClick={() => handleDelete(vid.filename)}
                                  className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-colors inline-flex items-center"
                                  title="Excluir arquivo do servidor"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-300">
                  Execute no <strong>phpMyAdmin</strong> da Hostinger para criar a tabela de vídeos:
                </p>
                <button
                  onClick={copySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Copiado!' : 'Copiar SQL'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-amber-300/90 overflow-x-auto leading-relaxed">
                {sqlSchema}
              </pre>
            </div>
          )}

          {tab === 'instructions' && (
            <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                  <Server className="w-4 h-4" /> Opção 1: Hostinger Hospedagem Compartilhada (hPanel / Apache / PHP)
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-neutral-400 pl-1">
                  <li>Gere a versão final com <code className="text-neutral-200">npm run build</code>.</li>
                  <li>Copie todo o conteúdo da pasta <code className="text-neutral-200">dist/</code> para a pasta <code className="text-neutral-200">public_html/</code> do hPanel.</li>
                  <li>
                    Os arquivos <code className="text-amber-300">api/upload.php</code>, <code className="text-amber-300">api/cards.php</code> e o <code className="text-amber-300">.htaccess</code> já estão inclusos e configurados automaticamente!
                  </li>
                  <li>
                    Crie a pasta <code className="text-amber-300">uploads</code> com permissão <code className="text-amber-300">755</code> na Hostinger para gravação dos vídeos.
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4" /> Opção 2: Hostinger VPS / Node.js
                </h4>
                <p className="text-neutral-400">
                  Na Hostinger VPS ou Cloud com Node.js, basta iniciar o aplicativo com:
                </p>
                <pre className="p-2.5 rounded-lg bg-neutral-900 font-mono text-[11px] text-amber-200">
                  npm start
                </pre>
                <p className="text-neutral-400">
                  O servidor Express (<code className="text-neutral-200">server.ts</code>) gerencia os uploads, streaming em bytes para reprodução de vídeo instantânea e persistência do banco em disco.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Servidor Node.js & PHP integrados para Hostinger</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
