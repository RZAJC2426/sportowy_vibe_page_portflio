import { useEffect } from 'react';
import { getContentByKey } from '@/data/siteContent';

function ChatbotDragHandler() {
  useEffect(() => {
    const STORAGE_KEY_BUTTON = 'chatbot-btn-pos-v3';
    const STORAGE_KEY_PANEL = 'chatbot-panel-pos-v3';

    interface Pos {
      left: number;
      top: number;
    }

    const loadPos = (key: string): Pos | null => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as Pos) : null;
      } catch {
        return null;
      }
    };

    const savePos = (key: string, p: Pos) => {
      try {
        localStorage.setItem(key, JSON.stringify(p));
      } catch {
        // ignore
      }
    };

    interface DragState {
      element: HTMLElement;
      offsetX: number;
      offsetY: number;
      moved: boolean;
      originals: Map<HTMLElement, { transition: string; animation: string; transform: string }>;
      isPanel: boolean;
      companion: HTMLElement | null;
      companionOffsetX: number;
      companionOffsetY: number;
    }

    let dragInfo: DragState | null = null;

    const BUTTON_PATTERNS = [
      '#vapi-widget-floating-button',
      '[id*="vapi-widget"]',
      '[class*="vapi-widget"]',
      '[class*="readdy-assistant"]',
      '[id*="readdy-widget"]',
      '[class*="readdy-widget"]',
      '[class*="assistant-widget"]',
      '[class*="chat-widget"]',
    ];

    const findButton = (node: EventTarget | null): HTMLElement | null => {
      if (!(node instanceof Node)) return null;
      let cur: Node | null = node;
      while (cur && cur !== document.body && cur !== document.documentElement) {
        if (cur instanceof HTMLElement) {
          if (cur.id === 'root') return null;
          for (const sel of BUTTON_PATTERNS) {
            try {
              if (cur.matches(sel)) return cur;
            } catch {
              // invalid selector, skip
            }
          }
        }
        cur = cur.parentNode;
      }
      if (node instanceof HTMLElement && !node.closest('#root')) {
        const r = node.getBoundingClientRect();
        const s = window.getComputedStyle(node);
        const isFixed = s.position === 'fixed' || s.position === 'absolute';
        const nearEdge =
          window.innerWidth - r.right < 120 && window.innerHeight - r.bottom < 120;
        const small = r.width > 0 && r.width < 120 && r.height > 0 && r.height < 120;
        if (isFixed && nearEdge && small) return node;
      }
      return null;
    };

    const findPanel = (): HTMLElement | null => {
      const panelSel =
        '[id*="vapi"], [class*="vapi"], [id*="readdy"], [class*="readdy"], [class*="chat-panel"], [class*="widget-panel"], [class*="assistant-panel"], [class*="conversation-panel"], [class*="chat-window"]';
      const els = document.querySelectorAll(panelSel);
      for (const el of els) {
        if (el instanceof HTMLElement) {
          const r = el.getBoundingClientRect();
          const id = el.id || '';
          const cls = el.className || '';
          if (
            r.width > 180 &&
            r.height > 200 &&
            !id.includes('button') &&
            !cls.includes('button') &&
            !cls.includes('floating')
          ) {
            return el;
          }
        }
      }
      return null;
    };

    const freezeElement = (
      el: HTMLElement,
      originals: Map<HTMLElement, { transition: string; animation: string; transform: string }>,
    ) => {
      originals.set(el, {
        transition: el.style.getPropertyValue('transition'),
        animation: el.style.getPropertyValue('animation'),
        transform: el.style.getPropertyValue('transform'),
      });
      el.style.setProperty('transition', 'none', 'important');
      el.style.setProperty('animation', 'none', 'important');
      el.style.setProperty('transform', 'none', 'important');
    };

    const thawElement = (
      el: HTMLElement,
      originals: Map<HTMLElement, { transition: string; animation: string; transform: string }>,
    ) => {
      const orig = originals.get(el);
      if (orig) {
        if (orig.transition) el.style.setProperty('transition', orig.transition);
        else el.style.removeProperty('transition');
        if (orig.animation) el.style.setProperty('animation', orig.animation);
        else el.style.removeProperty('animation');
        if (orig.transform) el.style.setProperty('transform', orig.transform);
        else el.style.removeProperty('transform');
      } else {
        el.style.removeProperty('transition');
        el.style.removeProperty('animation');
        el.style.removeProperty('transform');
      }
    };

    const lockPosition = (el: HTMLElement, left: number, top: number) => {
      el.style.setProperty('position', 'fixed', 'important');
      el.style.setProperty('left', `${left}px`, 'important');
      el.style.setProperty('top', `${top}px`, 'important');
      el.style.setProperty('right', 'auto', 'important');
      el.style.setProperty('bottom', 'auto', 'important');
      el.style.setProperty('margin', '0', 'important');
    };

    const onMouseDown = (e: MouseEvent) => {
      const button = findButton(e.target);
      if (button) {
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea, select, a[href]')) return;

        const r = button.getBoundingClientRect();
        const panelNow = findPanel();
        let compOffX = 0;
        let compOffY = 0;
        if (panelNow) {
          const pr = panelNow.getBoundingClientRect();
          compOffX = pr.left - r.left;
          compOffY = pr.top - r.top;
        }
        dragInfo = {
          element: button,
          offsetX: e.clientX - r.left,
          offsetY: e.clientY - r.top,
          moved: false,
          originals: new Map(),
          isPanel: false,
          companion: panelNow,
          companionOffsetX: compOffX,
          companionOffsetY: compOffY,
        };
        return;
      }

      const target = e.target as HTMLElement;
      const panel = findPanel();
      if (panel && panel.contains(target)) {
        if (target.closest('button, input, textarea, select, a[href], [role="button"]')) return;

        const r = panel.getBoundingClientRect();
        dragInfo = {
          element: panel,
          offsetX: e.clientX - r.left,
          offsetY: e.clientY - r.top,
          moved: false,
          originals: new Map(),
          isPanel: true,
          companion: null,
          companionOffsetX: 0,
          companionOffsetY: 0,
        };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragInfo) return;

      const el = dragInfo.element;
      const r = el.getBoundingClientRect();
      const candidateLeft = e.clientX - dragInfo.offsetX;
      const candidateTop = e.clientY - dragInfo.offsetY;
      const dist = Math.sqrt(
        Math.pow(candidateLeft - r.left, 2) + Math.pow(candidateTop - r.top, 2),
      );

      if (!dragInfo.moved) {
        if (dist < 6) return;
        dragInfo.moved = true;

        freezeElement(el, dragInfo.originals);
        lockPosition(el, r.left, r.top);

        if (dragInfo.companion) {
          freezeElement(dragInfo.companion, dragInfo.originals);
        }

        e.preventDefault();
      }

      e.preventDefault();

      const newLeft = Math.max(0, Math.min(candidateLeft, window.innerWidth - el.offsetWidth));
      const newTop = Math.max(0, Math.min(candidateTop, window.innerHeight - el.offsetHeight));

      el.style.setProperty('left', `${newLeft}px`, 'important');
      el.style.setProperty('top', `${newTop}px`, 'important');

      if (!dragInfo.isPanel && dragInfo.companion) {
        const panel = dragInfo.companion;
        lockPosition(
          panel,
          newLeft + dragInfo.companionOffsetX,
          newTop + dragInfo.companionOffsetY,
        );
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!dragInfo) return;

      if (dragInfo.moved) {
        e.preventDefault();
        e.stopPropagation();

        const el = dragInfo.element;
        const clickBlocker = (ce: Event) => {
          ce.preventDefault();
          ce.stopPropagation();
          ce.stopImmediatePropagation();
          el.removeEventListener('click', clickBlocker, true);
        };
        el.addEventListener('click', clickBlocker, true);

        const left = parseFloat(el.style.left) || 0;
        const top = parseFloat(el.style.top) || 0;
        if (dragInfo.isPanel) {
          savePos(STORAGE_KEY_PANEL, { left, top });
        } else {
          savePos(STORAGE_KEY_BUTTON, { left, top });
        }
      }

      const info = dragInfo;
      setTimeout(() => {
        thawElement(info.element, info.originals);
        if (info.companion) {
          thawElement(info.companion, info.originals);
        }
      }, 60);

      dragInfo = null;
    };

    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    const savedBtn = loadPos(STORAGE_KEY_BUTTON);
    const savedPanel = loadPos(STORAGE_KEY_PANEL);

    const applySaved = () => {
      if (savedBtn) {
        const candidates = document.querySelectorAll(BUTTON_PATTERNS.join(', '));
        for (const c of candidates) {
          if (c instanceof HTMLElement) {
            const r = c.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
              c.style.setProperty('position', 'fixed', 'important');
              c.style.setProperty('left', `${savedBtn.left}px`, 'important');
              c.style.setProperty('top', `${savedBtn.top}px`, 'important');
              c.style.setProperty('right', 'auto', 'important');
              c.style.setProperty('bottom', 'auto', 'important');
              c.style.setProperty('margin', '0', 'important');
            }
          }
        }
      }
      if (savedPanel) {
        const panel = findPanel();
        if (panel) {
          panel.style.setProperty('position', 'fixed', 'important');
          panel.style.setProperty('left', `${savedPanel.left}px`, 'important');
          panel.style.setProperty('top', `${savedPanel.top}px`, 'important');
          panel.style.setProperty('right', 'auto', 'important');
          panel.style.setProperty('bottom', 'auto', 'important');
          panel.style.setProperty('margin', '0', 'important');
        }
      }
    };

    applySaved();
    const mo = new MutationObserver(applySaved);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      mo.disconnect();
    };
  }, []);

  return null;
}

function ChatbotLabelHandler() {
  useEffect(() => {
    const DEFAULT_LABEL = 'hej, hej Tu NBA';

    const WIDGET_PATTERNS = [
      '#vapi-widget-floating-button',
      '[id*="vapi-widget"]',
      '[class*="vapi-widget"]',
      '[class*="readdy-assistant"]',
      '[id*="readdy-widget"]',
      '[class*="readdy-widget"]',
      '[class*="assistant-widget"]',
      '[class*="chat-widget"]',
    ];

    const findButtonCandidates = (): HTMLElement[] => {
      const candidates: HTMLElement[] = [];
      const all = document.querySelectorAll(WIDGET_PATTERNS.join(', '));
      for (const el of all) {
        if (el instanceof HTMLElement) {
          const r = el.getBoundingClientRect();
          const s = window.getComputedStyle(el);
          const isFixed = s.position === 'fixed' || s.position === 'absolute';
          const nearEdge =
            window.innerWidth - r.right < 120 && window.innerHeight - r.bottom < 120;
          const small =
            r.width > 0 && r.width < 120 && r.height > 0 && r.height < 120;
          if (isFixed && nearEdge && small) {
            candidates.push(el);
          }
        }
      }
      if (candidates.length === 0) {
        const allEls = document.querySelectorAll('*');
        for (const el of allEls) {
          if (!(el instanceof HTMLElement)) continue;
          if (el.closest('#root')) continue;
          const r = el.getBoundingClientRect();
          const s = window.getComputedStyle(el);
          const isFixed = s.position === 'fixed' || s.position === 'absolute';
          const nearEdge =
            window.innerWidth - r.right < 120 && window.innerHeight - r.bottom < 120;
          const small =
            r.width > 0 && r.width < 120 && r.height > 0 && r.height < 120;
          if (isFixed && nearEdge && small) {
            candidates.push(el);
          }
        }
      }
      return candidates;
    };

    const applyLabelSync = (label: string) => {
      const candidates = findButtonCandidates();
      for (const el of candidates) {
        el.setAttribute('aria-label', label);
        el.setAttribute('title', label);
        if (!el.getAttribute('role')) {
          el.setAttribute('role', 'button');
        }
        if (!el.getAttribute('tabindex')) {
          el.setAttribute('tabindex', '-1');
        }
        if (
          el.childNodes.length > 0 &&
          el.textContent &&
          el.textContent.trim().length > 0 &&
          el.textContent.trim().length < 40
        ) {
          el.textContent = label;
        }
        for (const child of el.querySelectorAll('*')) {
          if (child instanceof HTMLElement) {
            if (
              child.textContent &&
              child.textContent.trim().length > 0 &&
              child.textContent.trim().length < 40
            ) {
              child.textContent = label;
            }
            if (child.getAttribute('aria-label')) {
              child.setAttribute('aria-label', label);
            }
          }
        }
      }
    };

    // Run immediately with default label — no async wait, so PageSpeed never
    // catches an unpatched widget.
    applyLabelSync(DEFAULT_LABEL);

    // Set up MutationObserver to catch widget elements injected later
    const mo = new MutationObserver(() => applyLabelSync(DEFAULT_LABEL));
    mo.observe(document.body, { childList: true, subtree: true });

    // Update label from DB when available (non-blocking)
    getContentByKey('chatbot_label_text').then((dbLabel) => {
      if (dbLabel) applyLabelSync(dbLabel);
    }).catch(() => {
      // Fallback silently
    });

    const timers = [
      setTimeout(() => applyLabelSync(DEFAULT_LABEL), 1000),
      setTimeout(() => applyLabelSync(DEFAULT_LABEL), 3000),
      setTimeout(() => applyLabelSync(DEFAULT_LABEL), 6000),
    ];

    return () => {
      mo.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
}

export default function ChatbotHandlers() {
  return (
    <>
      <ChatbotDragHandler />
      <ChatbotLabelHandler />
    </>
  );
}