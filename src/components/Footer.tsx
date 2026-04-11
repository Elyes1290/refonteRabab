import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="footer-responsive" style={{ background: "var(--color-bg)" }}>
      <div className="footer-simple">
        <div className="footer-logo-section">
          <img
            src="/images/logo.png?v=1"
            alt="Logo Rabab Ali"
            className="footer-logo"
          />
        </div>
        <div className="footer-legal-links">
          <Link to="/mentions-legales">Mentions légales</Link>
          <Link to="/cookies">Politique en matière de cookies</Link>
          <Link to="/confidentialite">Politique de confidentialité</Link>
          <Link to="/conditions-utilisation">Conditions d'utilisation</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
