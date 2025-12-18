import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Header.css";

const navLinks = [
  { to: "/", label: "Constellation", hasIcon: true },
  { to: "/accueil", label: "Qui je suis", hasIcon: true },
  { to: "/evenements-et-avis", label: "Événements & Avis", hasIcon: true },
  {
    to: "/rendez-vous-et-contact",
    label: "📅 Rendez-vous & Contact",
  },
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
            className="header-logo-image"
          />
          <span className="header-logo-text-mobile">
            Approche & Constellation
          </span>
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
                      isActive ? " active-link" : ""
                    }${link.to === "/vision3d" ? " pulse-glow" : ""}`}
                  >
                    {link.hasIcon && (
                      <img
                        src="/images/signe_rabab.png?v=2"
                        alt=""
                        className="header-nav-icon"
                      />
                    )}
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {/* Burger menu mobile - 3 traits seulement */}
        {!mobileMenuOpen && (
          <button
            className="header-burger show-mobile"
            aria-label="Ouvrir le menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span role="img" aria-label="menu">
              ☰
            </span>
          </button>
        )}
      </div>
      {/* Texte sous le logo, hors flux principal sur desktop */}
      {/* Menu mobile drawer animé */}
      <div
        ref={menuRef}
        className={`header-mobile-menu${mobileMenuOpen ? " show-mobile" : ""}`}
      >
        {/* Bouton de fermeture (croix) dans le menu */}
        <button
          className="header-burger-close"
          aria-label="Fermer le menu"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span role="img" aria-label="fermer">
            ✖️
          </span>
        </button>
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
                    isActive ? " active-link" : ""
                  }${link.to === "/vision3d" ? " pulse-glow" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.hasIcon && (
                    <img
                      src="/images/signe_rabab.png?v=2"
                      alt=""
                      className="header-nav-icon"
                    />
                  )}
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
