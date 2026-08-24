import React from 'react';
import { AiOrbAvatar } from './AiOrbAvatar';

export interface FloatingAiOrbProps {
  isOpen: boolean;
  onToggle: () => void;
  isAiSpeaking: boolean;
  hasUnread?: boolean;
  stackAbove?: 'webcam' | 'none';
  className?: string;
}

export const FloatingAiOrb: React.FC<FloatingAiOrbProps> = ({
  isOpen,
  onToggle,
  isAiSpeaking,
  hasUnread = false,
  stackAbove = 'none',
  className = ''
}) => {
  // When stackAbove is 'webcam', offset bottom to clear the pinned WebcamTile (w-40 h-28)
  const positionClass = stackAbove === 'webcam'
    ? 'fixed bottom-36 right-5'
    : 'fixed bottom-5 right-5';

  return (
    <div className={`${positionClass} z-40 ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        aria-expanded={isOpen}
        title={isOpen ? 'Close AI Assistant' : 'Chat with AI Bar Raiser'}
        className={`group relative p-1.5 rounded-full bg-surface border transition-all duration-200 cursor-pointer shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isOpen
            ? 'border-primary ring-2 ring-primary/40 shadow-primary/20 scale-105'
            : 'border-border hover:border-primary/60 hover:scale-105'
        }`}
      >
        <AiOrbAvatar
          isAiSpeaking={isAiSpeaking}
          size="md"
        />

        {/* Small Unread Notification Badge */}
        {hasUnread && !isOpen && (
          <span
            className="absolute top-0 right-0 w-3 h-3 bg-danger rounded-full ring-2 ring-surface animate-bounce"
            aria-label="Unread AI message"
          />
        )}
      </button>
    </div>
  );
};
