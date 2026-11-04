import { useState, useRef, useEffect, useCallback } from 'react';

const EMOJI_CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
  {
    label: 'Uśmiechy',
    icon: 'ri-emotion-happy-line',
    emojis: ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘','😋','😛','😝','🤪','🤨','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😣','😖','😫','😤','😡','🤬','🤯','😳','🥵','😱','😰','😥','😓','🤗','🤔','🤭','😶','😐','😑','🙄','😯','😦','😲','🥱','😴','🤤','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤑','🤠','🥺','😢','😭'],
  },
  {
    label: 'Gesty',
    icon: 'ri-hand-heart-line',
    emojis: ['👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','✋','🤚','🖐','🖖','👋','🤏','✍️','👏','🙌','🤲','🤝','🙏','💪','👀','👁','👅','👄','🧠','🫀'],
  },
  {
    label: 'Sport',
    icon: 'ri-football-line',
    emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🏑','🥍','🏏','🥅','⛳','🎣','🤿','🥊','🥋','🎽','🛹','⛸','🥌','🎿','⛷','🏂','🏋️','🤸','⛹️','🏌️','🏄','🏊','🚴','🚵','🤾','🏇'],
  },
  {
    label: 'Serduszka',
    icon: 'ri-heart-line',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟'],
  },
  {
    label: 'Różne',
    icon: 'ri-star-line',
    emojis: ['🎉','🎊','🎈','🎂','🎀','🎁','🏆','🥇','🥈','🥉','⭐','🌟','✨','💫','🔥','💯','✅','❌','❗','❓','💡','💬','🗨','📢','🔔','🎵','🎶','🌈','☀️','🌙','⚡','💧','🌊','🍀','🌹','🌸','💐','🎄','🎃','👑','💎','🔑','🗝','📌','📍'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-400 hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
        title="Dodaj emotikonę"
      >
        <i className={`${open ? 'ri-emotion-happy-fill text-amber-500' : 'ri-emotion-happy-line'} text-base`}></i>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-[300px] sm:w-[340px] rounded-xl border border-background-200/80 bg-background-50 shadow-xl overflow-hidden">
          {/* Category tabs */}
          <div className="flex border-b border-background-200/70 bg-background-100/50 overflow-x-auto">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`flex-shrink-0 px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === idx
                    ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                    : 'text-foreground-500 hover:text-foreground-700 hover:bg-background-100'
                }`}
              >
                <i className={`${cat.icon} mr-1 text-xs`}></i>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="p-3 max-h-[200px] overflow-y-auto">
            <div className="grid grid-cols-9 gap-1">
              {EMOJI_CATEGORIES[activeTab].emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onSelect(emoji);
                    close();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-lg leading-none hover:bg-background-100 hover:scale-125 transition-transform cursor-pointer select-none"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}