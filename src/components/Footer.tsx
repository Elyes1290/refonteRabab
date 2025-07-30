import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => (
  <footer className="footer-responsive" style={{ background: "#faf1e6" }}>
    <div className="footer-content">
      {/* Colonne logo */}
      <div className="footer-logo-col">
        <img
          src="/images/logo.png"
          alt="Logo Rabab Ali"
          className="footer-logo"
        />
      </div>
      {/* Colonne contact */}
      <div className="footer-contact-col">
        <h3 className="footer-title">Contact</h3>
        <div className="footer-contact-info">
          <span className="footer-phone">Tél : +41 77 223 30 30</span>
          <span className="footer-email">rabab@rababali.com</span>
        </div>
        <a
          href="https://www.instagram.com/rabab_rit_a_la_vie"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-insta-link"
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              width="36"
              height="36"
              rx="8"
              fill="var(--color-text)"
              fillOpacity="0.08"
            />
            <path
              d="M18 13.5A4.5 4.5 0 1 0 18 22.5A4.5 4.5 0 1 0 18 13.5Z"
              stroke="var(--color-text)"
              strokeWidth="2"
            />
            <circle cx="25.5" cy="10.5" r="1.5" fill="var(--color-text)" />
          </svg>
        </a>
        <div className="footer-legal-links">
          <Link to="/mentions-legales">Mentions légales</Link>
          <Link to="/cookies">Politique en matière de cookies</Link>
          <Link to="/confidentialite">Politique de confidentialité</Link>
          <Link to="/conditions-utilisation">Conditions d'utilisation</Link>
        </div>
      </div>
      {/* Formulaire de contact */}
      <div className="footer-form-col">
        <form className="footer-form">
          <label>
            Nom
            <input type="text" placeholder="" />
          </label>
          <label>
            E-mail
            <input type="email" placeholder="" />
          </label>
          <label>
            Téléphone
            <input type="tel" placeholder="" />
          </label>
          <label>
            Message
            <textarea rows={3} />
          </label>
          <button type="submit">Envoyer</button>
        </form>
      </div>
    </div>
  </footer>
);

export default Footer;
