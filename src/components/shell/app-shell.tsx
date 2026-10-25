'use client';

import { Menu as MenuIcon, Plus, Search, X } from 'lucide-react';
import { Dialog as D } from 'radix-ui';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { NewApplicationDialog } from '@/features/applications/new-application-dialog';
import { CommandPalette } from './command-palette';
import { Logo } from './logo';
import { ShellContext, type ShellActions } from './shell-context';
import { NavLinks, Sidebar } from './sidebar';
import { ThemeToggle } from './theme-toggle';

export function AppShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [newApp, setNewApp] = useState<{ open: boolean; companyName?: string }>({ open: false });

  const openNewApplication = useCallback((defaults?: { companyName?: string }) => {
    setNewApp({ open: true, ...defaults });
  }, []);
  const actions = useMemo<ShellActions>(
    () => ({
      openPalette: () => {
        setPaletteOpen(true);
      },
      openNewApplication,
    }),
    [openNewApplication],
  );

  // Ctrl/Cmd+K opens the palette from anywhere in the app.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <ShellContext.Provider value={actions}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh bg-bg text-text">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile and tablet: compact top bar; the sidebar opens as a drawer. */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-bg/95 px-4 backdrop-blur lg:hidden">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => {
                setMobileNavOpen(true);
              }}
              className="-ml-2 flex size-11 items-center justify-center"
            >
              <MenuIcon size={20} aria-hidden="true" />
            </button>
            <Logo className="mr-auto text-text" />
            <button
              type="button"
              aria-label="Search"
              onClick={() => {
                setPaletteOpen(true);
              }}
              className="flex size-11 items-center justify-center"
            >
              <Search size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="New application"
              onClick={() => {
                openNewApplication();
              }}
              className="flex size-11 items-center justify-center bg-accent text-on-accent"
            >
              <Plus size={18} aria-hidden="true" strokeWidth={2.4} />
            </button>
          </header>

          <main
            id="main"
            className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-8 px-4 pt-8 pb-16 sm:px-8 lg:px-12 lg:pt-10"
          >
            {children}
          </main>
        </div>
      </div>

      <D.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-40 bg-overlay lg:hidden" />
          <D.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(320px,85vw)] flex-col gap-6 bg-side-bg px-4 py-5 text-side-text lg:hidden">
            <D.Title className="sr-only">Menu</D.Title>
            <D.Description className="sr-only">Main navigation</D.Description>
            <div className="flex items-center justify-between">
              <Logo className="text-side-text" />
              <D.Close aria-label="Close menu" className="flex size-11 items-center justify-center">
                <X size={20} aria-hidden="true" />
              </D.Close>
            </div>
            <NavLinks
              onNavigate={() => {
                setMobileNavOpen(false);
              }}
            />
            <div className="mt-auto flex items-center justify-between border-t border-side-line pt-4 text-sm">
              <span className="text-side-muted">Theme</span>
              <ThemeToggle />
            </div>
          </D.Content>
        </D.Portal>
      </D.Root>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNewApplication={() => {
          openNewApplication();
        }}
      />
      <NewApplicationDialog
        open={newApp.open}
        onOpenChange={(open) => {
          setNewApp((s) => ({ ...s, open }));
        }}
        defaults={newApp.companyName ? { companyName: newApp.companyName } : {}}
      />
    </ShellContext.Provider>
  );
}
