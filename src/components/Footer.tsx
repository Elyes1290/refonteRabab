import React, { useState } from "react";
import { Link } from "react-router-dom";

interface FooterFormData {
  nom: string;
  email: string;
  telephone: string;
  message: string;
}

const Footer: React.FC = () => {
  const [formData, setFormData] = useState<FooterFormData>({
    nom: "",
    email: "",
    telephone: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<null | {
    type: "success" | "error";
    text: string;
  }>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFeedback(null);

    try {
      // API endpoint pour l'envoi d'email
      const apiBase =
        window.location.hostname === "localhost"
          ? "http://localhost/RefonteSiteRabab/api"
          : "https://rababali.com/rabab/api";

      // Adapter les données pour l'API (qui attend nom, email, sujet, message)
      const apiData = {
        nom: formData.nom,
        email: formData.email,
        sujet: `Contact Footer${
          formData.telephone ? ` - Tél: ${formData.telephone}` : ""
        }`,
        message: formData.message,
      };

      const response = await fetch(`${apiBase}/send_contact_email.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();

      if (data.success) {
        setFeedback({
          type: "success",
          text: "Message envoyé ! Merci pour votre contact.",
        });
        setFormData({ nom: "", email: "", telephone: "", message: "" });
      } else {
        setFeedback({
          type: "error",
          text: data.message || "Erreur lors de l'envoi.",
        });
      }
    } catch (error) {
      console.error("Erreur envoi footer:", error);
      setFeedback({
        type: "error",
        text: "Erreur de connexion. Réessayez plus tard.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
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
          <h3 className="footer-title">Contact rapide</h3>
          {feedback && (
            <div
              className={`footer-feedback ${feedback.type}`}
              style={{
                padding: "8px 12px",
                marginBottom: "12px",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor:
                  feedback.type === "success" ? "#d4edda" : "#f8d7da",
                color: feedback.type === "success" ? "#155724" : "#721c24",
                border: `1px solid ${
                  feedback.type === "success" ? "#c3e6cb" : "#f5c6cb"
                }`,
              }}
            >
              {feedback.text}
            </div>
          )}
          <form className="footer-form" onSubmit={handleSubmit}>
            <label>
              Nom *
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Votre nom"
              />
            </label>
            <label>
              E-mail *
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                maxLength={120}
                placeholder="votre@email.com"
              />
            </label>
            <label>
              Téléphone
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                maxLength={20}
                placeholder="+41 XX XXX XX XX"
              />
            </label>
            <label>
              Message *
              <textarea
                rows={3}
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                maxLength={500}
                placeholder="Votre message..."
              />
            </label>
            <button
              type="submit"
              disabled={sending}
              style={{
                opacity: sending ? 0.7 : 1,
                cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              {sending ? "⏳ Envoi..." : "Envoyer"}
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
