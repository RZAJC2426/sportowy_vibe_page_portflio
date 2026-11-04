import { useState, useRef, useEffect, type ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  minHeight?: string;
  rootMargin?: string;
}

export default function LazySection({
  children,
  minHeight = '400px',
  rootMargin = '250px',
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  // Refresh GSAP ScrollTrigger after lazy content mounts so animations pick up new elements
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      import('gsap/ScrollTrigger')
        .then(({ ScrollTrigger }) => {
          ScrollTrigger.refresh();
        })
        .catch(() => {
          // GSAP not loaded on this page — nothing to refresh
        });
    }, 150);
    return () => clearTimeout(timer);
  }, [isVisible]);

  // minHeight is ALWAYS kept to prevent layout shift when content loads.
  // The container reserves space even after content becomes visible.
  return (
    <div ref={ref} style={{ minHeight }}>
      {isVisible ? children : null}
    </div>
  );
}