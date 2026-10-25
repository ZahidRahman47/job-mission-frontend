'use client';

import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

// The theme lives on <html data-theme>; this keeps React in sync with it (and with other tabs).
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => {
    observer.disconnect();
  };
}
const getTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'light');
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem('mc-theme', next);
        } catch {
          // Private mode or blocked storage: the toggle still works for this visit.
        }
      }}
      aria-label={`Switch to ${next} theme`}
      className={
        className ??
        'flex size-11 items-center justify-center border border-side-line hover:bg-track'
      }
    >
      {theme === 'dark' ? (
        <Sun size={17} aria-hidden="true" />
      ) : (
        <Moon size={17} aria-hidden="true" />
      )}
    </button>
  );
}
