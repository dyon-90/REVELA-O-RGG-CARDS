import { PlayingCardData } from '../types/card';

/**
 * Client helper to interact with the backend database and video upload storage.
 * Works both locally (Node.js/Express) and when deployed to Hostinger (VPS, Node.js or Shared Apache/PHP).
 */

export interface StoredServerVideo {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

export interface ServerHealthInfo {
  status: string;
  server: string;
  storagePath: string;
  totalVideosStored: number;
  timestamp: string;
}

export async function fetchCardsFromServer(): Promise<PlayingCardData[] | null> {
  try {
    const res = await fetch('/api/cards');
    if (!res.ok) {
      // Try PHP fallback if on standard Hostinger PHP hosting
      const phpRes = await fetch('/api/cards.php');
      if (phpRes.ok) {
        const phpData = await phpRes.json();
        if (phpData && Array.isArray(phpData.cards)) return phpData.cards;
      }
      return null;
    }
    const data = await res.json();
    if (data && Array.isArray(data.cards)) {
      return data.cards;
    }
    return null;
  } catch (err) {
    console.warn('Backend database not reachable, falling back to local storage', err);
    return null;
  }
}

export async function syncCardsToServer(cards: PlayingCardData[]): Promise<boolean> {
  try {
    const res = await fetch('/api/cards', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cards }),
    });
    if (!res.ok) {
      // Try PHP fallback
      const phpRes = await fetch('/api/cards.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards }),
      });
      return phpRes.ok;
    }
    return res.ok;
  } catch (err) {
    console.warn('Could not sync cards to server database', err);
    return false;
  }
}

export async function uploadVideoToServer(
  file: File,
  cardId?: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; videoUrl?: string; filename?: string; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('video', file);
    if (cardId) {
      formData.append('cardId', cardId);
    }

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    const handleSuccess = (responseText: string) => {
      try {
        const response = JSON.parse(responseText);
        if (response.success && response.videoUrl) {
          resolve({
            success: true,
            videoUrl: response.videoUrl,
            filename: response.filename,
          });
        } else {
          resolve({
            success: false,
            error: response.error || 'Erro desconhecido ao salvar o vídeo no servidor.',
          });
        }
      } catch {
        resolve({
          success: false,
          error: 'Servidor retornou uma resposta inesperada. Verifique a rota de upload.',
        });
      }
    };

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        handleSuccess(xhr.responseText);
      } else if (xhr.status === 404) {
        // Fallback: If deployed on Hostinger Apache/PHP, try /api/upload.php
        const phpXhr = new XMLHttpRequest();
        phpXhr.open('POST', '/api/upload.php');
        phpXhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        phpXhr.addEventListener('load', () => {
          if (phpXhr.status >= 200 && phpXhr.status < 300) {
            handleSuccess(phpXhr.responseText);
          } else {
            resolve({
              success: false,
              error: `Erro no servidor (PHP): HTTP ${phpXhr.status}`,
            });
          }
        });
        phpXhr.addEventListener('error', () => {
          resolve({
            success: false,
            error: 'Não foi possível conectar ao endpoint de upload do servidor.',
          });
        });
        phpXhr.send(formData);
      } else {
        try {
          const errResponse = JSON.parse(xhr.responseText);
          resolve({
            success: false,
            error: errResponse.error || `Erro de upload: HTTP ${xhr.status}`,
          });
        } catch {
          resolve({
            success: false,
            error: `Erro de upload no servidor: HTTP ${xhr.status}`,
          });
        }
      }
    });

    xhr.addEventListener('error', () => {
      resolve({
        success: false,
        error: 'Falha de rede ao conectar com o servidor. Verifique se o servidor está online.',
      });
    });

    xhr.open('POST', '/api/upload-video');
    xhr.send(formData);
  });
}

export async function fetchServerStoredVideos(): Promise<StoredServerVideo[]> {
  try {
    const res = await fetch('/api/uploads');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.files) ? data.files : [];
  } catch (err) {
    console.error('Failed to fetch uploaded videos from server:', err);
    return [];
  }
}

export async function deleteServerStoredVideo(filename: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/uploads/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function checkServerHealth(): Promise<ServerHealthInfo | null> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
