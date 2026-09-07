'use client';

import { useState, useEffect } from 'react';

export default function MobileMenuToggle() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      if (isOpen) {
        sidebar.classList.add('open');
      } else {
        sidebar.classList.remove('open');
      }
    }
  }, [isOpen]);

  return (
    <button
      className="btn btn-icon"
      style={{ 
        display: 'none',
        marginRight: '8px'
      }}
      onClick={() => setIsOpen(!isOpen)}
      aria-label="Toggle menu"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {isOpen ? (
          <path d="M18 6L6 18M6 6l12 12" />
        ) : (
          <path d="M3 12h18M3 6h18M3 18h18" />
        )}
      </svg>
    </button>
  );
}