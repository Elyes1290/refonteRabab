import React, { useEffect, useState } from "react";
import "../styles/LogoIntro.css";

const LogoIntro: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    // Vérifier si l'animation a déjà été jouée dans cette session
    const introPlayed = sessionStorage.getItem("introPlayed");

    if (introPlayed) {
      setIsAnimating(false);
      setHasPlayed(true);
      return;
    }

    // Démarrer l'animation de transition après 1.5s
    const transitionTimer = setTimeout(() => {
      setIsAnimating(false);
    }, 1500);

    // Marquer l'intro comme jouée après l'animation complète
    const completeTimer = setTimeout(() => {
      setHasPlayed(true);
      sessionStorage.setItem("introPlayed", "true");
    }, 2500);

    return () => {
      clearTimeout(transitionTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  // Ne rien afficher si l'animation a déjà été jouée
  if (hasPlayed) {
    return null;
  }

  return (
    <div className={`logo-intro-overlay ${!isAnimating ? "animate-out" : ""}`}>
      <div className="logo-intro-content">
        <img
          src="/images/logo.png?v=1"
          alt="Logo Rabab Ali"
          className="logo-intro-image"
        />
        {/* Logo uniquement, pas de texte */}
      </div>
    </div>
  );
};

export default LogoIntro;
