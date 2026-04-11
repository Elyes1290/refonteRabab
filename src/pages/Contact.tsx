import React, { useState } from "react";
import { AnimatedSection } from "../components/AnimatedSection";
import { toast } from "react-toastify";
import "../styles/Contact.css";

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const apiBase =
        window.location.hostname === "localhost"
          ? "http://localhost/RefonteSiteRabab/api"
          : "https://rababali.com/rabab/api";

      const response = await fetch(`${apiBase}/send_contact_email.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Message envoyé avec succès !");
        setFormData({ nom: "", email: "", telephone: "", message: "" });
      } else {
        toast.error(data.message || "Une erreur est survenue");
      }
    } catch {
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#F2E8E1" }}>
      <section className="contact-page">
        <AnimatedSection animationType="fadeUp" delay={200}>
          <div className="contact-header">
            <h1 className="contact-title">Contact</h1>
            <p className="contact-description-cinzel">
              Vous êtes une entreprise, une école ou un organisme
              et souhaitez un accompagnement personnalisé ?
            </p>
            <p className="contact-description-cinzel">
              Pour toute demande de mandat professionnel,
              merci de me contacter directement afin de définir ensemble vos
              besoins et construire
              une expérience sur-mesure.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection animationType="fadeUp" delay={400}>
          <div className="contact-two-col">
            <div className="contact-info-col">
              <img
                src="/images/logo.png"
                alt="Rabab Ali"
                className="contact-logo"
              />
              <h3 className="contact-info-title">Contact</h3>
              <p className="contact-info-text">Tél : +41 77 223 30 30</p>
              <p className="contact-info-text">rabab@rababali.com</p>
              <a
                href="https://www.instagram.com/rabab_rit_a_la_vie"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-social-link"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
                  alt="Instagram"
                  className="contact-social-icon"
                />
              </a>
            </div>

            <div className="contact-form-col">
              <h2 className="contact-form-title">Contact rapide</h2>
              <form onSubmit={handleSubmit}>
                <div className="contact-form-field">
                  <label className="contact-form-label-dark">NOM *</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    className="contact-form-input-dark"
                    placeholder="Votre nom"
                    required
                  />
                </div>
                <div className="contact-form-field">
                  <label className="contact-form-label-dark">E-MAIL *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="contact-form-input-dark"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div className="contact-form-field">
                  <label className="contact-form-label-dark">TÉLÉPHONE</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    className="contact-form-input-dark"
                    placeholder="+41 XX XXX XX XX"
                  />
                </div>
                <div className="contact-form-field large">
                  <label className="contact-form-label-dark">MESSAGE *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="contact-form-textarea-dark"
                    placeholder="Votre message..."
                    required
                  />
                </div>
                <div className="contact-form-submit-container">
                  <button
                    type="submit"
                    className="contact-form-submit-btn-dark"
                    disabled={submitting}
                  >
                    {submitting ? "Envoi en cours..." : "Envoyer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </AnimatedSection>

        {/* Bouton Instagram */}
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0 5rem 0" }}>
          <a
            href="https://www.instagram.com/rabab_rit_a_la_vie"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
              color: "white",
              padding: "1rem 2rem",
              borderRadius: "50px",
              textDecoration: "none",
              fontFamily: "'Lato', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
              transition: "all 0.3s ease",
            }}
          >
            Suivre @rabab_rit_a_la_vie
          </a>
        </div>
      </section>
    </div>
  );
};

export default Contact;
