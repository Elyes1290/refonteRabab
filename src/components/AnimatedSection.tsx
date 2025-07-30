import React, { useRef, useEffect, useState } from "react";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  animationType?: "fadeUp" | "fadeLeft" | "fadeRight" | "scale" | "parallax";
  delay?: number;
  duration?: number;
  parallaxOffset?: number;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className,
  style,
  animationType = "fadeUp",
  delay = 0,
  duration = 800,
  parallaxOffset = 50,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (animationType === "parallax") {
      const handleScroll = () => setScrollY(window.scrollY);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [animationType]);

  const getAnimationStyles = () => {
    const baseStyles = {
      transition: `all ${duration}ms ease-out`,
      transitionDelay: `${delay}ms`,
    };

    if (!isVisible) {
      switch (animationType) {
        case "fadeUp":
          return {
            ...baseStyles,
            opacity: 0,
            transform: "translateY(50px)",
          };
        case "fadeLeft":
          return {
            ...baseStyles,
            opacity: 0,
            transform: "translateX(-50px)",
          };
        case "fadeRight":
          return {
            ...baseStyles,
            opacity: 0,
            transform: "translateX(50px)",
          };
        case "scale":
          return {
            ...baseStyles,
            opacity: 0,
            transform: "scale(0.8)",
          };
        case "parallax":
          return {
            ...baseStyles,
            opacity: 0,
            transform: `translateY(${parallaxOffset}px)`,
          };
        default:
          return baseStyles;
      }
    }

    // États visibles
    if (animationType === "parallax") {
      return {
        ...baseStyles,
        opacity: 1,
        transform: `translateY(${scrollY * 0.1}px)`,
      };
    }

    return {
      ...baseStyles,
      opacity: 1,
      transform: "translateY(0) translateX(0) scale(1)",
    };
  };

  return (
    <div
      ref={sectionRef}
      className={className}
      style={{
        ...style,
        ...getAnimationStyles(),
      }}
    >
      {children}
    </div>
  );
};
