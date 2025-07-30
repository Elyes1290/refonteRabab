import React from "react";

interface WaveTransitionProps {
  color?: string;
  height?: string;
  flip?: boolean;
  opacity?: number;
}

export const WaveTransition: React.FC<WaveTransitionProps> = ({
  color = "#87CEEB",
  height = "100px",
  flip = false,
  opacity = 0.8,
}) => {
  // Convertir la hauteur en nombre pour viewBox
  const heightValue = parseInt(height.replace("px", ""));

  return (
    <div
      style={{
        width: "100%",
        height,
        overflow: "hidden",
        transform: flip ? "rotate(180deg)" : "none",
        position: "relative",
      }}
    >
      <svg
        width="100vw"
        height={height}
        viewBox={`0 0 2000 ${heightValue}`}
        style={{
          display: "block",
          position: "relative",
          left: 0,
          transform: "none",
          minWidth: "100vw",
          maxWidth: "none",
          margin: 0,
          padding: 0,
        }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity={opacity * 0.6} />
            <stop offset="50%" stopColor={color} stopOpacity={opacity} />
            <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.6} />
          </linearGradient>
        </defs>

        {/* Vague animée */}
        <path
          d="M0,50 C500,100 700,0 1000,50 C1500,100 1700,0 2000,50 L2000,120 L0,120 Z"
          fill="url(#waveGradient)"
          style={{ animation: "wave 6s ease-in-out infinite" }}
        />

        {/* Deuxième vague pour plus d'effet */}
        <path
          d="M0,70 C400,120 900,20 1400,70 C1700,120 1800,20 2000,70 L2000,120 L0,120 Z"
          fill={color}
          opacity={opacity * 0.5}
          style={{ animation: "wave 8s ease-in-out infinite reverse" }}
        />
      </svg>

      <style>
        {`
          @keyframes wave {
            0%, 100% {
              transform: translateX(0);
            }
            50% {
              transform: translateX(-50px);
            }
          }
        `}
      </style>
    </div>
  );
};
