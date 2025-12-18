import React, { useState, useEffect } from "react";
import { ScrollReveal } from "../components/ScrollReveal";
import { AnimatedSection } from "../components/AnimatedSection";
import PowrInstagramWidget from "../components/PowrInstagramWidget";
import { fetchWithRetry } from "../utils/fetchWithRetry";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/Events.css";
import "../styles/Experiences.css";

// Utiliser toujours rababali.com (API configurée avec CORS)
const DOMAIN = "https://rababali.com";
const API_BASE = "https://rababali.com";

interface Event {
  id: number;
  titre: string;
  description: string;
  date_event: string;
  date_fin?: string;
  prix?: string;
  image_url?: string;
  type?: string;
  devise?: string;
  url_inscription?: string;
}

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

const EventsAndExperiences: React.FC = () => {
  // État pour les événements
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>("");

  // État pour les expériences
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [experiencesLoading, setExperiencesLoading] = useState(true);
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

  // Charger les événements
  useEffect(() => {
    fetchWithRetry(
      `${DOMAIN}/rabab/api/db_connect.php?action=get_events`,
      {},
      {
        retries: 3,
        retryDelay: 1000,
        timeout: 15000,
      }
    )
      .then((res) => {
        if (!res.ok)
          throw new Error("Erreur lors du chargement des événements");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setEvents(data.data);
        } else {
          setEventsError(
            data.message || "Erreur lors de la récupération des événements"
          );
        }
        setEventsLoading(false);
      })
      .catch((err) => {
        setEventsError(err.message);
        setEventsLoading(false);
      });
  }, []);

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
    <div style={{ background: "#faf1e6" }}>
      {/* ========== SECTION ÉVÉNEMENTS ========== */}
      <section className="events-page">
        <h1 className="events-title">
          <img
            src="/images/signe_rabab.png?v=2"
            alt=""
            style={{
              width: 40,
              height: 40,
              objectFit: "contain",
              display: "inline-block",
              verticalAlign: "middle",
              marginRight: 10,
            }}
          />
          Activités & Événements
        </h1>
        <p className="events-description">
          Retrouvez ici tous les événements à venir et passés. Pour toute
          question ou pour organiser un événement sur-mesure, contactez-moi
          directement !
        </p>
        {eventsLoading && (
          <div className="events-loading">Chargement des événements…</div>
        )}
        {eventsError && <div className="events-error">{eventsError}</div>}
        {!eventsLoading && !eventsError && events.length === 0 && (
          <div className="events-empty">
            <div className="events-empty-title">
              Aucun événement pour le moment.
            </div>
          </div>
        )}
        <div className="events-grid">
          {events.map((evt) => (
            <div key={evt.id} className="event-card">
              {evt.image_url && (
                <img
                  src={`${DOMAIN}${evt.image_url}`}
                  alt={evt.titre}
                  className={`event-card-image ${
                    evt.type === "flyer" ? "flyer" : "regular"
                  }`}
                  onClick={() => {
                    setModalImg(`${DOMAIN}${evt.image_url}`);
                    setModalAlt(evt.titre);
                  }}
                  title="Cliquer pour agrandir"
                />
              )}
              <h2 className="event-card-title">{evt.titre}</h2>
              {evt.prix && (
                <div className="event-card-price">
                  💶 {evt.prix}
                  {evt.devise ? ` ${evt.devise}` : ""}
                </div>
              )}
              <div className="event-card-date">
                {(() => {
                  const dateDebut = new Date(evt.date_event);
                  const dateFin = evt.date_fin ? new Date(evt.date_fin) : null;

                  const formatDate = (date: Date) =>
                    date.toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });

                  if (!dateFin || dateDebut.getTime() === dateFin.getTime()) {
                    return formatDate(dateDebut);
                  }

                  // Si même mois et année, afficher : "4 - 12 avril 2026"
                  if (
                    dateDebut.getMonth() === dateFin.getMonth() &&
                    dateDebut.getFullYear() === dateFin.getFullYear()
                  ) {
                    return `${dateDebut.getDate()} - ${formatDate(dateFin)}`;
                  }

                  // Sinon afficher les deux dates complètes
                  return `${formatDate(dateDebut)} - ${formatDate(dateFin)}`;
                })()}
              </div>
              <p className="event-card-description">{evt.description}</p>
              {evt.url_inscription && (
                <a
                  href={evt.url_inscription}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-card-register-btn"
                  style={{
                    display: "inline-block",
                    background: "#5c7671",
                    color: "#fff",
                    padding: "0.7rem 1.5rem",
                    borderRadius: "24px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    marginTop: "1rem",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#4a5e5a";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#5c7671";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  📝 S'inscrire à cet événement
                </a>
              )}
            </div>
          ))}
        </div>
        {modalImg && (
          <div className="events-modal" onClick={() => setModalImg(null)}>
            <img src={modalImg} alt={modalAlt} className="events-modal-image" />
          </div>
        )}
      </section>

      {/* ========== SÉPARATEUR ========== */}
      <div style={{ margin: "3rem 0 2rem 0", textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            width: 120,
            height: 4,
            background: "var(--color-primary)",
            borderRadius: 2,
            opacity: 0.4,
          }}
        />
      </div>

      {/* ========== SECTION TÉMOIGNAGES & AVIS ========== */}
      <section className="experiences-page">
        {/* En-tête */}
        <AnimatedSection animationType="fadeUp" delay={200}>
          <div className="experiences-header">
            <h1 className="sparkle experiences-title">
              ✨ Témoignages & Avis ✨
            </h1>
            <p className="experiences-description">
              Découvrez les témoignages de personnes qui ont vécu l'expérience
              Vision 3D et partagez la vôtre pour inspirer d'autres âmes en
              quête de transformation.
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

        {/* Section des avis Google - DÉSACTIVÉE temporairement */}
        {/* {!showForm && (
          <AnimatedSection animationType="fadeUp" delay={600}>
            <div className="experiences-google-section">
              <GoogleReviews maxReviews={6} showHeader={true} />
            </div>
          </AnimatedSection>
        )} */}

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

      {/* ========== SÉPARATEUR ========== */}
      <div style={{ margin: "3rem 0 2rem 0", textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            width: 120,
            height: 4,
            background: "var(--color-primary)",
            borderRadius: 2,
            opacity: 0.4,
          }}
        />
      </div>

      {/* ========== SECTION INSTAGRAM ========== */}
      <AnimatedSection animationType="fadeUp" delay={900}>
        <PowrInstagramWidget powrId="8ac912d6_1765981801" />
      </AnimatedSection>
    </div>
  );
};

export default EventsAndExperiences;
