import React, { useState } from 'react';
import { X, Monitor, Download, Terminal, Check, Copy, Folder, Play, FileCode, ShieldCheck, HardDrive, Sparkles } from 'lucide-react';

interface WindowsExecutableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsExecutableModal: React.FC<WindowsExecutableModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'build-exe' | 'files'>('quick');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const downloadFile = (filename: string, content: string, mime: string = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const batIniciarContent = `@echo off
chcp 65001 > nul
title Revelação RGG Cards - Iniciando no Windows
color 0B

echo ========================================================
echo             REVELAÇÃO RGG CARDS - WINDOWS
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] O Node.js não foi encontrado no seu PC.
    echo Instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [1/3] Instalando dependências necessárias...
    call npm install
)

if not exist "dist" (
    echo [2/3] Compilando interface do baralho...
    call npm run build
)

echo [3/3] Iniciando servidor e abrindo aplicação...
start "" "http://localhost:3000"
call npm start
pause
`;

  const batCriarExeContent = `@echo off
chcp 65001 > nul
title Revelação RGG Cards - Gerando Executável .EXE
color 0E

echo ========================================================
echo       REVELAÇÃO RGG CARDS - GERADOR DE EXECUTÁVEL (.EXE)
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] Node.js não encontrado. Baixe em https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Instalando dependências...
call npm install
call npm install --save-dev electron electron-builder

echo.
echo [2/4] Compilando aplicação React...
call npm run build

echo.
echo [3/4] Gerando executável Windows (.exe)...
call npx electron-builder --win portable nsis

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ========================================================
    echo      SUCESSO! O EXECUTÁVEL .EXE FOI GERADO COM ÊXITO!
    echo ========================================================
    echo Os arquivos estão na pasta "dist_electron":
    echo  - RevelacaoRGG_Cards_Portable.exe
    start "" "dist_electron"
)

echo.
pause
`;

  const instructionsText = `REVELAÇÃO RGG CARDS - GUIA PARA WINDOWS (.EXE)

COMO GERAR O EXECUTÁVEL NO SEU PC:
1. Tenha o Node.js instalado (https://nodejs.org/).
2. Na pasta do projeto, execute o arquivo "CRIAR_EXECUTAVEL_EXE.bat".
3. O executável standalone "RevelacaoRGG_Cards_Portable.exe" será gerado na pasta "dist_electron".
4. Dê 2 cliques no .exe para jogar e gerenciar suas cartas sem depender de internet!

ARMAZENAMENTO DE VÍDEOS:
- Os vídeos enviados ficam salvos na pasta física "public\\uploads" no seu disco rígido.
- O arquivo "data\\cards_database.json" guarda todas as cartas e efeitos.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Executável Windows (.EXE)
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase tracking-wider">
                  Windows 10 / 11
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Transforme esta aplicação em um programa executável (.exe) no seu computador
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

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-800 px-6 pt-2 gap-2 bg-neutral-950/30">
          <button
            onClick={() => setActiveTab('quick')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'quick'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Modo Rápido (2 Cliques no Windows)
          </button>
          <button
            onClick={() => setActiveTab('build-exe')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'build-exe'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Gerar Arquivo .EXE Nativamente (Electron)
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'files'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Baixar Scripts Prontos
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-neutral-300">
          
          {/* TAB 1: QUICK 2-CLICKS LAUNCHER */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/20 space-y-2">
                <h3 className="text-sm font-bold text-sky-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Opção 1: Executar Imediatamente com 2 Cliques
                </h3>
                <p className="text-neutral-400 leading-relaxed">
                  Já criamos o arquivo <code className="text-sky-300 font-bold">INICIAR_NO_WINDOWS.bat</code> na raiz do projeto. Ele detecta seu ambiente, inicializa o servidor de vídeos local e abre a aplicação automaticamente no seu Windows!
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Instale o Node.js (caso ainda não tenha)</p>
                    <p className="text-neutral-400 text-[11px] mt-0.5">
                      Acesse <a href="https://nodejs.org/" target="_blank" rel="noreferrer" className="text-sky-400 underline">nodejs.org</a> e baixe a versão recomendada LTS (Leva apenas 1 minuto).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Dê um duplo clique no arquivo</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <code className="px-2.5 py-1 rounded bg-neutral-800 text-sky-200 font-mono text-xs font-semibold">
                        INICIAR_NO_WINDOWS.bat
                      </code>
                      <button
                        onClick={() => downloadFile('INICIAR_NO_WINDOWS.bat', batIniciarContent)}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Baixar Script
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Armazenamento 100% Local e Permanente</p>
                    <p className="text-neutral-400 text-[11px] mt-0.5">
                      Todos os vídeos que você gravar em cada carta serão armazenados fisicamente na pasta <code className="text-neutral-200">public\uploads</code> no seu computador, e o banco <code className="text-neutral-200">data\cards_database.json</code> mantém tudo guardado mesmo reiniciando o PC.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUILD STANDALONE .EXE VIA ELECTRON */}
          {activeTab === 'build-exe' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Opção 2: Gerar o Executável Standalone (.EXE)
                </h3>
                <p className="text-neutral-400 leading-relaxed">
                  Configuramos o <strong>Electron</strong> e o <strong>Electron-Builder</strong> no projeto. Eles compilam tudo em um único arquivo <strong className="text-white">RevelacaoRGG_Cards_Portable.exe</strong> que funciona como um aplicativo de desktop com janela própria, sem precisar de navegador!
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Método Automático: Executar o Gerador de .EXE</span>
                    <button
                      onClick={() => downloadFile('CRIAR_EXECUTAVEL_EXE.bat', batCriarExeContent)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded text-xs inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Baixar CRIAR_EXECUTAVEL_EXE.bat
                    </button>
                  </div>
                  <p className="text-neutral-400 text-[11px]">
                    Basta dar duplo-clique no arquivo <code className="text-amber-300">CRIAR_EXECUTAVEL_EXE.bat</code>. Ele instalará o Electron, fará o build e gerará o arquivo .EXE dentro da pasta <code className="text-neutral-200">dist_electron</code>.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <span className="font-semibold text-white">Ou execute os comandos no Prompt de Comando / PowerShell:</span>
                  <div className="relative group">
                    <pre className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-amber-300 overflow-x-auto">
{`npm install
npm install --save-dev electron electron-builder
npm run build
npx electron-builder --win portable`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`npm install && npm install --save-dev electron electron-builder && npm run build && npx electron-builder --win portable`, 'cmd')}
                      className="absolute top-2 right-2 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] flex items-center gap-1 border border-neutral-700"
                    >
                      {copiedCmd === 'cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedCmd === 'cmd' ? 'Copiado!' : 'Copiar Comandos'}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    O executável final estará pronto em: <code className="text-neutral-200">dist_electron\RevelacaoRGG_Cards_Portable.exe</code>. Você pode movê-lo para qualquer pasta ou colocar num pendrive!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOWNLOAD READY FILES */}
          {activeTab === 'files' && (
            <div className="space-y-3">
              <p className="text-neutral-400">
                Baixe os arquivos configurados para colocar na pasta do projeto no seu computador:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sky-400 font-semibold">
                      <FileCode className="w-4 h-4" />
                      <span>INICIAR_NO_WINDOWS.bat</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Script executável para iniciar a aplicação localmente no Windows com 2 cliques.
                    </p>
                  </div>
                  <button
                    onClick={() => downloadFile('INICIAR_NO_WINDOWS.bat', batIniciarContent)}
                    className="w-full mt-2 py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar Script
                  </button>
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 font-semibold">
                      <FileCode className="w-4 h-4" />
                      <span>CRIAR_EXECUTAVEL_EXE.bat</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Script que compila e empacota o projeto em um executável .EXE (Portable e Instalador).
                    </p>
                  </div>
                  <button
                    onClick={() => downloadFile('CRIAR_EXECUTAVEL_EXE.bat', batCriarExeContent)}
                    className="w-full mt-2 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar Script Gerador
                  </button>
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 flex flex-col justify-between sm:col-span-2">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <FileCode className="w-4 h-4" />
                      <span>LEIA-ME-EXECUTAVEL-WINDOWS.txt</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Manual com instruções completas passo a passo em português para consulta rápida.
                    </p>
                  </div>
                  <button
                    onClick={() => downloadFile('LEIA-ME-EXECUTAVEL-WINDOWS.txt', instructionsText)}
                    className="w-full mt-2 py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar Instruções (.txt)
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-xl flex items-center gap-3 text-xs text-neutral-400">
                <HardDrive className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <span className="font-semibold text-neutral-200">Estrutura de Vídeos no Windows:</span>
                  <p className="text-[11px] mt-0.5">
                    Os vídeos enviados ficarão na pasta <code className="text-amber-300">public/uploads/</code> ao lado do executável, garantindo autonomia e backup fácil.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5 text-sky-400 font-medium">
            <Monitor className="w-3.5 h-3.5" />
            Compatível com Windows 10 e Windows 11 (64-bit)
          </span>
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
