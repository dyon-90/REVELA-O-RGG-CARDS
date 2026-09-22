import React from 'react';
import { CardSuit } from '../types/card';

interface SuitIconProps {
  suit: CardSuit;
  className?: string;
}

export const SuitIcon: React.FC<SuitIconProps> = ({ suit, className = 'w-4 h-4' }) => {
  switch (suit) {
    case 'spades':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Espadas">
          <path d="M12 2C9.5 6 6 8.5 6 12.5C6 15 8 17 10.5 17C11.5 17 12 16.5 12 16.5C12 16.5 12.5 17 13.5 17C16 17 18 15 18 12.5C18 8.5 14.5 6 12 2ZM13 16.5L14.5 22H9.5L11 16.5C11.5 16.8 12.5 16.8 13 16.5Z" />
        </svg>
      );
    case 'hearts':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Copas">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case 'diamonds':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Ouros">
          <path d="M12 2L3 12L12 22L21 12L12 2Z" />
        </svg>
      );
    case 'clubs':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Paus">
          <path d="M12 2C9.8 2 8 3.8 8 6C8 7.3 8.6 8.5 9.6 9.2C8 9.6 6.8 11.1 6.8 12.8C6.8 14.9 8.5 16.6 10.6 16.6C11.1 16.6 11.6 16.5 12 16.3C12.4 16.5 12.9 16.6 13.4 16.6C15.5 16.6 17.2 14.9 17.2 12.8C17.2 11.1 16 9.6 14.4 9.2C15.4 8.5 16 7.3 16 6C16 3.8 14.2 2 12 2ZM13 16.5L14.5 22H9.5L11 16.5H13Z" />
        </svg>
      );
    case 'special':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Especial">
          <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.3 7.2-6.3-4.6-6.3 4.6 2.3-7.2-6-4.8h7.6z" />
        </svg>
      );
    default:
      return null;
  }
};
