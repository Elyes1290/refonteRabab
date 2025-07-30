import React, { useState, useEffect } from "react";
import { ScrollReveal } from "../components/ScrollReveal";
import { AnimatedSection } from "../components/AnimatedSection";
import { GoogleReviews } from "../components/GoogleReviews";
import { fetchWithRetry } from "../utils/fetchWithRetry";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/Experiences.css";

// Utiliser toujours rababali.com (API configurée avec CORS)
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

const Experiences: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nom: "",
    titre: "",
    message: "",
  });

  // Charger les expériences depuis la base de données
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
        setLoading(false);
      }
    };

    fetchExperiences();
  }, []);

  // Gérer la soumission du formulaire
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
    <section className="experiences-page">
      {/* En-tête */}
      <AnimatedSection animationType="fadeUp" delay={200}>
        <div className="experiences-header">
          <h1 className="sparkle experiences-title">
            ✨ Témoignages & Avis ✨
          </h1>
          <p className="experiences-description">
            Découvrez les témoignages de personnes qui ont vécu l'expérience
            Vision 3D et partagez la vôtre pour inspirer d'autres âmes en quête
            de transformation.
          </p>
        </div>
      </AnimatedSection>

      {/* Bouton pour partager une expérience */}
      <AnimatedSection animationType="scale" delay={400}>
        <div className="experiences-toggle-container">
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-magical zoom-hover experiences-toggle-btn"
          >
            {showForm
              ? "🔙 Retour aux témoignages"
              : "💫 Partager mon expérience"}
          </button>
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

      {/* Avis Google */}
      {!showForm && (
        <AnimatedSection animationType="fadeUp" delay={400}>
          <div className="experiences-google-section">
            <GoogleReviews maxReviews={4} showHeader={true} />
          </div>
        </AnimatedSection>
      )}

      {/* Séparateur entre Google et témoignages personnels */}
      {!showForm && (
        <AnimatedSection animationType="fadeUp" delay={600}>
          <div className="experiences-google-header">
            <h2 className="experiences-google-title">
              💫 Témoignages Personnels
            </h2>
            <p className="experiences-google-subtitle">
              Expériences partagées directement par nos clients
            </p>
          </div>
        </AnimatedSection>
      )}

      {/* Liste des expériences de la base de données */}
      {!showForm && (
        <div className="experiences-content">
          {loading ? (
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
                      <div className="pulse-glow experiences-card-icon">✨</div>
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

                    <p className="experiences-card-message">
                      "{experience.message}"
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default Experiences;
