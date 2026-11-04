import { useLocation } from 'react-router-dom';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function PageTransitionWrapper({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [animTrigger, setAnimTrigger] = useState(0);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      setAnimTrigger((v) => v + 1);
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  return (
    <div className="animate-page-in" key={animTrigger}>
      {children}
    </div>
  );
}