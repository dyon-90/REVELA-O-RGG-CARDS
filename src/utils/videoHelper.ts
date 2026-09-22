import { VideoSourceType } from '../types/card';

export interface ParsedVideo {
  type: VideoSourceType;
  embedUrl: string;
  originalUrl: string;
  isValid: boolean;
}

export function parseVideoUrl(url: string): ParsedVideo {
  const trimmed = url.trim();

  if (!trimmed) {
    return {
      type: 'direct',
      embedUrl: '',
      originalUrl: '',
      isValid: false,
    };
  }

  // Blob URL from local upload
  if (trimmed.startsWith('blob:')) {
    return {
      type: 'blob',
      embedUrl: trimmed,
      originalUrl: trimmed,
      isValid: true,
    };
  }

  // YouTube detection
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1`,
      originalUrl: trimmed,
      isValid: true,
    };
  }

  // Vimeo detection
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/(?:video\/|channels\/[^\/]+\/|groups\/[^\/]+\/videos\/)?|player\.vimeo\.com\/video\/)([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`,
      originalUrl: trimmed,
      isValid: true,
    };
  }

  // Direct video file (or fallback HTML5 video stream)
  return {
    type: 'direct',
    embedUrl: trimmed,
    originalUrl: trimmed,
    isValid: true,
  };
}
