import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDropdownOptions {
  /** Delay in ms before closing dropdown on mouse leave */
  closeDelay?: number;
  /** Whether to use click toggle instead of hover */
  mode?: 'hover' | 'click';
}

interface UseDropdownReturn {
  isOpen: boolean;
  ref: React.RefObject<HTMLDivElement | null>;
  open: () => void;
  close: () => void;
  closeImmediate: () => void;
  toggle: () => void;
  handlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClick: () => void;
  };
}

export function useDropdown(options: UseDropdownOptions = {}): UseDropdownReturn {
  const { closeDelay = 200, mode = 'hover' } = options;
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const open = useCallback(() => {
    clearCloseTimeout();
    setIsOpen(true);
  }, [clearCloseTimeout]);

  const closeImmediate = useCallback(() => {
    clearCloseTimeout();
    setIsOpen(false);
  }, [clearCloseTimeout]);

  const close = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, closeDelay);
  }, [closeDelay]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Close on outside click (only when open)
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearCloseTimeout();
  }, [clearCloseTimeout]);

  const handlers = {
    onMouseEnter: mode === 'hover' ? open : () => {},
    onMouseLeave: mode === 'hover' ? close : () => {},
    onClick: mode === 'click' ? toggle : () => {},
  };

  return { isOpen, ref, open, close, closeImmediate, toggle, handlers };
}