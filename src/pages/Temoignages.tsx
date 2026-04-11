import React, { useState, useEffect } from "react";
import { ScrollReveal } from "../components/ScrollReveal";
import { AnimatedSection } from "../components/AnimatedSection";
import { fetchWithRetry } from "../utils/fetchWithRetry";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/Experiences.css";

const API_BASE = "https://rababali.com";

interface Experience {
  id: number;
  nom: string;
  titre: string;
  message: string;
  date_creation: string;
}

interface FormData {
  nom: string;
  titre: string;
  message: string;
}

const Temoignages: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [experiencesLoading, setExperiencesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nom: "",
    titre: "",
    message: "",
  });

  // Charger les expériences
  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const response = await fetchWithRetry(
          `${API_BASE}/rabab/api/db_connect.php?action=get_experiences`,
          {},
          {
            retries: 3,
            retryDelay: 1000,
            timeout: 15000,
          }
        );
        const data = await response.json();

        if (data.success) {
          setExperiences(data.data);
        } else {
          console.error(
            "Erreur lors du chargement des expériences:",
            data.message
          );
        }
      } catch (error) {
        console.error("Erreur réseau:", error);
      } finally {
        setExperiencesLoading(false);
      }
    };

    fetchExperiences();
  }, []);

  // Gérer la soumission du formulaire d'expérience
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("action", "add_experience");
      formDataToSend.append("nom", formData.nom);
      formDataToSend.append("titre", formData.titre);
      formDataToSend.append("message", formData.message);

      const response = await fetchWithRetry(
        `${API_BASE}/rabab/api/db_connect.php`,
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(
          "Votre expérience a été partagée avec succès ! Elle sera visible après modération."
        );
        setFormData({ nom: "", titre: "", message: "" });
        setShowForm(false);

        // Recharger les expériences
        const refreshResponse = await fetchWithRetry(
          `${API_BASE}/rabab/api/db_connect.php?action=get_experiences`,
          {},
          {
            retries: 2,
            retryDelay: 500,
            timeout: 10000,
          }
        );
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setExperiences(refreshData.data);
        }
      } else {
        toast.error(data.message || "Une erreur est survenue");
      }
    } catch {
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  // Gérer les changements dans le formulaire
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div style={{ background: "#F2E8E1" }}>
      {/* ========== SECTION TÉMOIGNAGES & AVIS ========== */}
      <section className="experiences-page">
        {/* En-tête */}
        <AnimatedSection animationType="fadeUp" delay={200}>
          <div className="experiences-header">
            <h1 className="experiences-title">Témoignages</h1>
            <p className="experiences-description-cinzel">
              Découvrez les expériences de celles et ceux qui ont vécu la Vision 3D.
            </p>
            <p className="experiences-description-cinzel">
              Leurs parcours montrent comment cette méthode a permis de clarifier,
              transformer et libérer ce qui bloque.
            </p>
            <p className="experiences-description-cinzel">
              Vous aussi, partagez votre expérience pour inspirer d'autres
              personnes en quête de transformation et d'équilibre.
            </p>
          </div>
        </AnimatedSection>

        {/* Boutons d'action */}
        <AnimatedSection animationType="scale" delay={400}>
          <div className="experiences-toggle-container">
            <button
              onClick={() => setShowForm(!showForm)}
              className="experiences-action-btn"
            >
              {showForm
                ? "🔙 Retour aux témoignages"
                : <><span style={{fontSize: '24px'}}>💫</span> Partager mon expérience</>}
            </button>
            <a
              href="https://maps.app.goo.gl/xAg5jcX2Fj4dSWkF9"
              target="_blank"
              rel="noopener noreferrer"
              className="experiences-action-btn"
            >
              <span style={{fontSize: '24px'}}>⭐</span> Laisser un avis Google
            </a>
          </div>
        </AnimatedSection>

        {/* Messages de feedback */}
        {message && (
          <AnimatedSection animationType="fadeUp">
            <div className={`experiences-message ${message.type}`}>
              {message.text}
            </div>
          </AnimatedSection>
        )}

        {/* Formulaire de partage d'expérience */}
        {showForm && (
          <AnimatedSection animationType="fadeUp" delay={200}>
            <div className="experiences-form">
              <h2 className="experiences-form-title">
                🌟 Partagez votre expérience
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="experiences-form-field">
                  <label className="experiences-form-label">
                    Votre prénom (ou initiales) *
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    required
                    maxLength={100}
                    className="experiences-form-input"
                    placeholder="Ex: Marie L."
                  />
                </div>

                <div className="experiences-form-field">
                  <label className="experiences-form-label">
                    Titre de votre expérience *
                  </label>
                  <input
                    type="text"
                    name="titre"
                    value={formData.titre}
                    onChange={handleInputChange}
                    required
                    maxLength={200}
                    className="experiences-form-input"
                    placeholder="Ex: Une transformation en douceur"
                  />
                </div>

                <div className="experiences-form-field large">
                  <label className="experiences-form-label">
                    Votre témoignage *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="experiences-form-textarea"
                    placeholder="Partagez votre expérience avec la Vision 3D, les transformations vécues, vos ressentis..."
                  />
                </div>

                <div className="experiences-form-submit-container">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-magical zoom-hover experiences-form-submit-btn"
                    style={{
                      opacity: submitting ? 0.7 : 1,
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting
                      ? "🔄 Envoi en cours..."
                      : "✨ Partager mon expérience"}
                  </button>
                </div>
              </form>
            </div>
          </AnimatedSection>
        )}

        {/* Liste des expériences de la base de données */}
        {!showForm && (
          <div className="experiences-content">
            {experiencesLoading ? (
              <div className="experiences-loading">
                <div className="creative-loading experiences-loading-spinner"></div>
                <p className="experiences-loading-text">
                  Chargement des expériences...
                </p>
              </div>
            ) : experiences.length === 0 ? (
              <AnimatedSection animationType="fadeUp">
                <div className="experiences-empty">
                  <p className="experiences-empty-text">
                    Soyez le premier à partager votre expérience ! 🌟
                  </p>
                </div>
              </AnimatedSection>
            ) : (
              <div className="experiences-grid">
                {experiences.map((experience, index) => (
                  <ScrollReveal
                    key={experience.id}
                    direction="scale"
                    delay={index * 100}
                  >
                    <div className="experiences-card">
                      <div className="experiences-card-header">
                        <div className="pulse-glow experiences-card-icon">
                          ✨
                        </div>
                        <div>
                          <h3 className="experiences-card-title">
                            {experience.titre}
                          </h3>
                          <p className="experiences-card-author">
                            Par {experience.nom}
                          </p>
                          <p className="experiences-card-date">
                            {formatDate(experience.date_creation)}
                          </p>
                        </div>
                      </div>

                      <p className="experiences-card-message experiences-card-preview">
                        "{experience.message.substring(0, 150)}
                        {experience.message.length > 150 ? "..." : ""}"
                      </p>

                      {experience.message.length > 150 && (
                        <button
                          onClick={() => setSelectedExperience(experience)}
                          className="experiences-read-more-btn"
                        >
                          Lire la suite
                        </button>
                      )}
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal de détails du témoignage */}
        {selectedExperience && (
          <div className="testimonial-modal" onClick={() => setSelectedExperience(null)}>
            <div className="testimonial-modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="testimonial-modal-close"
                onClick={() => setSelectedExperience(null)}
              >
                ✕
              </button>
              <div className="testimonial-modal-header">
                <h2 className="testimonial-modal-title">{selectedExperience.titre}</h2>
                <p className="testimonial-modal-author">Par {selectedExperience.nom}</p>
                <p className="testimonial-modal-date">
                  {formatDate(selectedExperience.date_creation)}
                </p>
              </div>
              <div className="testimonial-modal-body">
                <p className="testimonial-modal-message">"{selectedExperience.message}"</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========== BOUTON INSTAGRAM ========== */}
      <div style={{ textAlign: "center", padding: "3rem 0 4rem 0" }}>
        <a
          href="https://www.instagram.com/rabab_rit_a_la_vie"
          target="_blank"
          rel="noopener noreferrer"
          className="instagram-follow-btn"
          style={{
            display: "inline-block",
            background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
            color: "white",
            padding: "1rem 2rem",
            borderRadius: "50px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "1.1rem",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
            textAlign: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.2)";
          }}
        >
          Suivre @rabab_rit_a_la_vie
        </a>
      </div>
    </div>
  );
};

export default Temoignages;
