'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <img src="/hr-logo.png" alt="LSFMD HR" className="h-10 w-10" />
              <span className="text-xl font-semibold text-foreground">
                LSFMD HR
              </span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/dashboard"
                className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/login"
                className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary hover:text-primary transition-colors"
              >
                Login
              </Link>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3 border-t border-border">
            <Link
              href="/dashboard"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-secondary hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
