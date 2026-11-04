import { useState, useRef } from 'react';
import EditableImage from './EditableImage';

interface Certificate3DProps {
  imageSrc: string;
  alt?: string;
  contentKey?: string;
  className?: string;
  cardClassName?: string;
  glowClassName?: string;
}

export default function Certificate3D({
  imageSrc,
  alt = 'Certyfikat',
  contentKey,
  className = '',
  cardClassName = '',
  glowClassName = '',
}: Certificate3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    setTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`);
  };

  const handleMouseLeave = () => {
    setTransform('');
  };

  const isTransformed = !!transform;

  return (
    <div
      className={`cert-3d-container relative flex items-center justify-center py-8 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow behind */}
      <div className={`cert-3d-glow absolute inset-0 z-0 ${glowClassName}`} />

      {/* Shadow plane */}
      <div
        className="cert-3d-shadow absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-12 bg-black/40 rounded-[50%] z-0"
        style={{
          transform: isTransformed
            ? `translateX(-50%) translateZ(-80px) rotateX(75deg) scale(1.05)`
            : 'translateX(-50%) translateZ(-80px) rotateX(75deg) scale(0.9)',
          transition: 'transform 0.4s ease-out',
        }}
      />

      {/* 3D Card */}
      <div
        ref={cardRef}
        className={`cert-3d-card auto-animate relative z-10 w-full max-w-[420px] rounded-xl border border-background-200/60 bg-background-50/80 backdrop-blur-sm overflow-hidden ${cardClassName}`}
        style={{
          transform: transform || 'rotateX(0deg) rotateY(0deg) scale(1)',
          transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
          boxShadow: isTransformed
            ? '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 30px oklch(var(--primary-500) / 0.15)'
            : '0 20px 40px -12px rgba(0,0,0,0.2)',
        }}
      >
        {contentKey ? (
          <EditableImage
            contentKey={contentKey}
            fallbackSrc={imageSrc}
            alt={alt}
            className="w-full h-auto object-contain"
          />
        ) : (
          <img
            src={imageSrc}
            alt={alt}
            className="w-full h-auto object-contain"
          />
        )}
        <div className="cert-3d-shine" />
      </div>
    </div>
  );
}