import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale" | "rotate";
  duration?: number;
  threshold?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 800,
  threshold = 0.1,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay, threshold]);

  const getInitialTransform = () => {
    switch (direction) {
      case "up":
        return "translateY(80px)";
      case "down":
        return "translateY(-80px)";
      case "left":
        return "translateX(80px)";
      case "right":
        return "translateX(-80px)";
      case "scale":
        return "scale(0.8)";
      case "rotate":
        return "rotate(10deg) scale(0.9)";
      default:
        return "translateY(80px)";
    }
  };

  const getFinalTransform = () => {
    switch (direction) {
      case "scale":
        return "scale(1)";
      case "rotate":
        return "rotate(0deg) scale(1)";
      default:
        return "translateY(0) translateX(0)";
    }
  };

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? getFinalTransform() : getInitialTransform(),
        filter: isVisible ? "blur(0px)" : "blur(5px)",
        transition: `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
        willChange: "transform, opacity, filter",
      }}
    >
      {children}
    </div>
  );
};
