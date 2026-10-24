import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const AppShell: React.FC = () => {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      {/* Skip-to-content link for keyboard accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      {/* ARIA-live polite region for screen-reader announcements */}
      <div 
        id="aria-live-announcer" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only" 
        role="status" 
      />

      <Header />
      
      <main id="main-content" className="flex-1 w-full" tabIndex={-1}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
          <p className="text-balance text-center text-xs leading-loose text-muted-foreground md:text-left">
            AI Dev Tracker — developer tool for AI-assisted development.
          </p>
        </div>
      </footer>
    </div>
  );
};
