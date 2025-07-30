import React, { useEffect, useRef } from "react";

interface ConfettiParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  shape: string;
}

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({
  trigger,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const animationRef = useRef<number>(0);

  const colors = [
    "#87CEEB",
    "#4682B4",
    "#F5F5DC",
    "#FFF8DC",
    "#FFD700",
    "#FF69B4",
  ];
  const shapes = ["●", "★", "♦", "♥", "✨", "🎉", "🌟"];

  useEffect(() => {
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Créer des particules
    for (let i = 0; i < 50; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: -10,
        velocityX: (Math.random() - 0.5) * 6,
        velocityY: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        life: 0,
        maxLife: Math.random() * 100 + 100,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.velocityY += 0.1; // gravité
        particle.rotation += particle.rotationSpeed;
        particle.life++;

        const alpha = 1 - particle.life / particle.maxLife;

        if (alpha > 0) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(particle.x, particle.y);
          ctx.rotate((particle.rotation * Math.PI) / 180);

          // Dessiner selon la forme
          if (particle.shape === "●") {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (particle.shape === "★") {
            ctx.fillStyle = particle.color;
            ctx.font = `${particle.size}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText("★", 0, particle.size / 3);
          } else {
            ctx.fillStyle = particle.color;
            ctx.font = `${particle.size}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(particle.shape, 0, particle.size / 3);
          }

          ctx.restore();
          return true;
        }
        return false;
      });

      if (particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trigger, onComplete]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10000,
      }}
    />
  );
};
