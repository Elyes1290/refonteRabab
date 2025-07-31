import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Header.css";

const navLinks = [
  { to: "/", label: "🏠 Accueil" },
  { to: "/a-propos", label: "✨ À propos" },
  { to: "/vision3d", label: "🌟 Vision 3D" },
  { to: "/rendez-vous", label: "📅 Prendre rendez-vous", special: true },
  { to: "/evenements", label: "🎉 Événements" },
  { to: "/experiences", label: "💬 Expériences" },
  { to: "/contact", label: "📧 Contact" },
];

const Header: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuShouldRender, setMenuShouldRender] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Gérer l'ouverture/fermeture avec délai pour l'animation
  useEffect(() => {
    if (mobileMenuOpen) {
      setMenuShouldRender(true);
    } else if (menuShouldRender) {
      // Attendre la fin de l'animation CSS avant de retirer le menu
      const timeout = setTimeout(() => setMenuShouldRender(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [mobileMenuOpen]);

  return (
    <header className="header-responsive">
      <div className="header-main-row">
        <div className="header-logo-wrap">
          <img
            src="/images/logo.png"
            alt="Logo Rabab Ali"
            className="pulse-glow header-logo-image"
          />
          <span className="header-logo-text-mobile">Approche et Vision 3D</span>
        </div>
        {/* Menu desktop */}
        <nav className="header-nav hide-mobile">
          <ul className="header-nav-list">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.to ||
                (link.to !== "/" && location.pathname.startsWith(link.to));
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`header-nav-link zoom-hover${
                      link.special ? " special" : ""
                    }${isActive ? " active-link" : ""}${
                      link.to === "/vision3d" ? " pulse-glow" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {/* Burger menu mobile */}
        <button
          className="header-burger show-mobile"
          aria-label="Ouvrir le menu"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          <span role="img" aria-label="menu">
            {mobileMenuOpen ? "✖️" : "☰"}
          </span>
        </button>
      </div>
      {/* Texte sous le logo, hors flux principal sur desktop */}
      {/* Menu mobile drawer animé */}
      <div
        ref={menuRef}
        className={`header-mobile-menu${mobileMenuOpen ? " show-mobile" : ""}`}
      >
        {/* Bouton de fermeture (croix) */}
        {/* SUPPRIMÉ : bouton croix supplémentaire */}
        <ul className="header-mobile-nav-list">
          {navLinks.map((link) => {
            const isActive =
              location.pathname === link.to ||
              (link.to !== "/" && location.pathname.startsWith(link.to));
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`header-mobile-nav-link zoom-hover${
                    link.special ? " special" : ""
                  }${isActive ? " active-link" : ""}${
                    link.to === "/vision3d" ? " pulse-glow" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
};

export default Header;
