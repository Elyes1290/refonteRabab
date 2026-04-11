import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Header.css";

const navLinks = [
  { to: "/", label: "Accueil", hasIcon: false },
  { to: "/approche", label: "L'Approche 3D", hasIcon: false },
  { to: "/a-propos", label: "À propos", hasIcon: false },
  { to: "/evenements", label: "Événements", hasIcon: false },
  { to: "/temoignages", label: "Témoignages", hasIcon: false },
  { to: "/contact", label: "Contact", hasIcon: false },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileMenuOpen]);

  const isNavLinkActive = (to: string) => {
    const aliases: Record<string, string[]> = {
      "/a-propos": ["/accueil"],
      "/evenements": ["/evenements-et-avis"],
    };
    const paths = [to, ...(aliases[to] || [])];
    return paths.some(
      (path) =>
        location.pathname === path ||
        (path !== "/" && location.pathname.startsWith(path))
    );
  };

  return (
    <header className="header-responsive">
      <div className="header-main-row">
        <div className="header-logo-wrap">
          <img
            src="/images/logo.png?v=1"
            alt="Logo Rabab Ali"
            className="header-logo-image"
          />
        </div>
        {/* Menu desktop */}
        <nav className="header-nav hide-mobile">
          <ul className="header-nav-list">
            {navLinks.map((link) => {
              const isActive = isNavLinkActive(link.to);
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
          <Link
            to="/rendez-vous"
            className="header-cta-button"
          >
            Prendre rendez-vous
          </Link>
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
            const isActive = isNavLinkActive(link.to);
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
          <li className="header-mobile-cta-wrapper">
            <Link
              to="/rendez-vous"
              className="header-cta-button"
              onClick={() => setMobileMenuOpen(false)}
            >
              Prendre rendez-vous
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
