import React, { useState, useEffect, useRef } from "react";

interface AnimatedTextProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
  typewriter?: boolean;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  speed = 50,
  className,
  style,
  typewriter = false,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    if (typewriter) {
      let currentIndex = 0;
      const timer = setTimeout(() => {
        const interval = setInterval(() => {
          if (currentIndex <= text.length) {
            setDisplayedText(text.slice(0, currentIndex));
            currentIndex++;
          } else {
            clearInterval(interval);
          }
        }, speed);

        return () => clearInterval(interval);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setDisplayedText(text);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, text, speed, delay, typewriter]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: `all 0.8s ease-out ${delay}ms`,
      }}
    >
      {typewriter ? displayedText : text}
      {typewriter && displayedText.length < text.length && (
        <span
          style={{
            borderRight: "2px solid #87CEEB",
            animation: "blink 1s infinite",
          }}
        />
      )}
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};
