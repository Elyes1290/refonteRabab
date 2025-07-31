import React, { useState } from "react";
import { AnimatedSection } from "../components/AnimatedSection";
import "../styles/Contact.css";

interface FormData {
  nom: string;
  email: string;
  sujet: string;
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    email: "",
    sujet: "",
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

      const response = await fetch(`${apiBase}/send_contact_email.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setFeedback({
          type: "success",
          text: data.message,
        });
        setFormData({ nom: "", email: "", sujet: "", message: "" });
      } else {
        setFeedback({
          type: "error",
          text: data.message || "Erreur lors de l'envoi du message.",
        });
      }
    } catch (error) {
      console.error("Erreur envoi contact:", error);
      setFeedback({
        type: "error",
        text: "Erreur de connexion. Veuillez réessayer plus tard.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="contact-page">
      <AnimatedSection animationType="fadeUp" delay={200}>
        <div className="contact-form-container">
          <h1 className="contact-title">📬 Contactez-moi</h1>
          <p className="contact-description">
            Une question, un projet, une remarque ? Remplissez le formulaire
            ci-dessous, je vous répondrai rapidement.
          </p>
          {feedback && (
            <div className={`contact-feedback ${feedback.type}`}>
              {feedback.text}
            </div>
          )}
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="contact-form-field">
              <label className="contact-form-label">Votre nom *</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                maxLength={100}
                className="contact-form-input"
                placeholder="Votre nom ou prénom"
              />
            </div>
            <div className="contact-form-field">
              <label className="contact-form-label">Votre email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                maxLength={120}
                className="contact-form-input"
                placeholder="exemple@email.com"
              />
            </div>
            <div className="contact-form-field">
              <label className="contact-form-label">Sujet *</label>
              <input
                type="text"
                name="sujet"
                value={formData.sujet}
                onChange={handleChange}
                required
                maxLength={120}
                className="contact-form-input"
                placeholder="Sujet de votre message"
              />
            </div>
            <div className="contact-form-field large">
              <label className="contact-form-label">Message *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="contact-form-textarea"
                placeholder="Votre message..."
              />
            </div>
            <div className="contact-form-submit-container">
              <button
                type="submit"
                className="contact-form-submit-btn"
                style={{
                  opacity: sending ? 0.7 : 1,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
                disabled={sending}
              >
                {sending ? "⏳ Envoi en cours..." : "Envoyer le message"}
              </button>
            </div>
          </form>
          <div className="contact-info">
            <div className="contact-info-item">
              <b>Email :</b>{" "}
              <a href="mailto:rabab@rababali.com" className="contact-info-link">
                rabab@rababali.com
              </a>
            </div>
            <div className="contact-info-item">
              <b>Téléphone :</b>{" "}
              <a href="tel:+41772233030" className="contact-info-link">
                +41 77 223 30 30
              </a>
            </div>
            <div>
              <b>Instagram :</b>{" "}
              <a
                href="https://www.instagram.com/rabab_rit_a_la_vie"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-info-link"
              >
                @rabab_rit_a_la_vie
              </a>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
};

export default Contact;
