import React, { useState, useEffect } from "react";
import { AnimatedSection } from "../components/AnimatedSection";
import { fetchWithRetry } from "../utils/fetchWithRetry";
import { toast } from "react-toastify";
import "../styles/Events.css";

// Utiliser toujours rababali.com (API configurée avec CORS)
const DOMAIN = "https://rababali.com";

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
  video_urls?: string[];
}

interface WaitlistSession {
  id: number;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  status?: string;
}

interface VideoEmbedInfo {
  embedUrl: string;
  provider: "youtube" | "vimeo";
}

const getInstagramUrl = (rawUrl: string): string | null => {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname;
    if (host === "instagram.com" || host === "m.instagram.com") {
      const parts = path.split("/").filter(Boolean);
      const type = parts[0];
      const code = parts[1];
      if ((type === "reel" || type === "p" || type === "tv") && code) {
        return `https://www.instagram.com/${type}/${code}/`;
      }
    }
  } catch {
    return null;
  }
  return null;
};

const openCenteredPopup = (url: string) => {
  const width = 520;
  const height = 760;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  window.open(
    url,
    "_blank",
    `popup=yes,width=${width},height=${height},left=${Math.max(0, Math.floor(left))},top=${Math.max(0, Math.floor(top))},resizable=yes,scrollbars=yes`
  );
};

const getVideoEmbedInfo = (rawUrl: string): VideoEmbedInfo | null => {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname;

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
      let videoId = "";
      if (host === "youtu.be") {
        videoId = path.split("/").filter(Boolean)[0] || "";
      } else if (path.startsWith("/watch")) {
        videoId = parsed.searchParams.get("v") || "";
      } else if (path.startsWith("/shorts/")) {
        videoId = path.split("/")[2] || "";
      } else if (path.startsWith("/embed/")) {
        videoId = path.split("/")[2] || "";
      }
      if (videoId) {
        return {
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          provider: "youtube",
        };
      }
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = path.split("/").filter(Boolean);
      const videoId = parts[parts.length - 1] || "";
      if (/^\d+$/.test(videoId)) {
        return {
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          provider: "vimeo",
        };
      }
    }

  } catch {
    return null;
  }
  return null;
};

const EventsAndExperiences: React.FC = () => {
  // État pour les événements
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [waitlistEvent, setWaitlistEvent] = useState<Event | null>(null);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [openConstellationSessions, setOpenConstellationSessions] = useState<
    WaitlistSession[]
  >([]);
  const [openSessionsLoading, setOpenSessionsLoading] = useState(true);
  const [openSessionsError, setOpenSessionsError] = useState<string | null>(null);
  const [waitlistForm, setWaitlistForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    message: "",
  });

  const formatWaitlistDate = (date: string) => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

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

  useEffect(() => {
    fetchWithRetry(
      `${DOMAIN}/rabab/api/db_connect.php?action=get_open_waitlist_sessions`,
      {},
      { retries: 2, retryDelay: 800, timeout: 12000 }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors du chargement des sessions");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          const sessions = Array.isArray(data.data) ? data.data : [];
          setOpenConstellationSessions(sessions);
          setOpenSessionsError(null);
        } else {
          setOpenConstellationSessions([]);
          setOpenSessionsError(data.message || "Aucune session disponible");
        }
      })
      .catch((error) => {
        setOpenConstellationSessions([]);
        setOpenSessionsError(error?.message || "Erreur de chargement");
      })
      .finally(() => {
        setOpenSessionsLoading(false);
      });
  }, []);

  const openEventWaitlistModal = (event: Event) => {
    setWaitlistEvent(event);
    setWaitlistForm({
      nom: "",
      email: "",
      telephone: "",
      message: "",
    });
  };

  const closeEventWaitlistModal = () => {
    setWaitlistEvent(null);
    setWaitlistSubmitting(false);
  };

  const submitEventWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEvent) return;
    setWaitlistSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("action", "join_event_waitlist");
      formData.append("event_id", String(waitlistEvent.id));
      formData.append("nom", waitlistForm.nom);
      formData.append("email", waitlistForm.email);
      formData.append("telephone", waitlistForm.telephone);
      formData.append("message", waitlistForm.message);

      const response = await fetch(`${DOMAIN}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Vous êtes bien inscrit(e) sur la liste d'attente.");
        closeEventWaitlistModal();
      } else {
        toast.error(data.message || "Impossible de rejoindre la liste d'attente");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#F2E8E1" }}>
      {/* ========== SECTION ÉVÉNEMENTS ========== */}
      <section className="events-page">
        <AnimatedSection animationType="fadeUp" delay={120}>
          <h1 className="events-title">Événements</h1>
          <p className="events-description">
            Retrouvez ici toutes mes retraites spirituelles, ateliers et
            constellations familiales à venir.
          </p>
          <p className="events-description">
            Chaque événement est conçu pour vous accompagner dans la
            découverte, la transformation et l'épanouissement personnel.
          </p>
          <p className="events-description">
            Pour toute question ou pour organiser un événement sur-mesure,
            contactez-moi directement.
          </p>
        </AnimatedSection>
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
        <AnimatedSection animationType="fadeUp" delay={220}>
          <div className="events-grid">
            {events.map((evt) => (
              <div 
                key={evt.id} 
                className="event-card"
                onClick={() => setSelectedEvent(evt)}
                style={{ cursor: "pointer" }}
              >
                {evt.image_url && (
                  <img
                    src={`${DOMAIN}${evt.image_url}`}
                    alt={evt.titre}
                    className={`event-card-image ${
                      evt.type === "flyer" ? "flyer" : "regular"
                    }`}
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

                    if (
                      dateDebut.getMonth() === dateFin.getMonth() &&
                      dateDebut.getFullYear() === dateFin.getFullYear()
                    ) {
                      return `${dateDebut.getDate()} - ${formatDate(dateFin)}`;
                    }

                    return `${formatDate(dateDebut)} - ${formatDate(dateFin)}`;
                  })()}
                </div>
                {evt.url_inscription && (
                  <a
                    href={evt.url_inscription}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-card-register-btn"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "inline-block",
                      background: "#1DA395",
                      color: "#fff",
                      padding: "0.7rem 1.5rem",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontWeight: "400",
                      marginTop: "1rem",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#178a7e";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#1DA395";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    S'inscrire
                  </a>
                )}
                <button
                  type="button"
                  className="event-card-waitlist-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEventWaitlistModal(evt);
                  }}
                >
                  S'inscrire à la liste d'attente
                </button>
              </div>
            ))}
          </div>
        </AnimatedSection>
        <AnimatedSection animationType="fadeUp" delay={260}>
          <div className="events-open-sessions">
            <h2 className="events-open-sessions-title">
              Journees de constellation familiale disponibles
            </h2>

            {openSessionsLoading && (
              <p className="events-open-sessions-state">
                Chargement des sessions...
              </p>
            )}

            {!openSessionsLoading && openSessionsError && (
              <p className="events-open-sessions-state">{openSessionsError}</p>
            )}

            {!openSessionsLoading &&
              !openSessionsError &&
              openConstellationSessions.length === 0 && (
                <p className="events-open-sessions-state">
                  Aucune session ouverte pour le moment.
                </p>
              )}

            {!openSessionsLoading &&
              !openSessionsError &&
              openConstellationSessions.length > 0 && (
                <div className="events-open-sessions-grid">
                  {openConstellationSessions.map((session) => (
                    <div key={session.id} className="events-open-session-card">
                      <div className="events-open-session-date">
                        {formatWaitlistDate(session.session_date)}
                      </div>
                      <div className="events-open-session-time">
                        {String(session.start_time || "").slice(0, 5)} a{" "}
                        {String(session.end_time || "").slice(0, 5)}
                      </div>
                      <div className="events-open-session-location">
                        {session.location || "Grand-Lancy"}
                      </div>
                      <a
                        href={`/rendez-vous?open_waitlist=1&session_id=${session.id}`}
                        className="events-open-session-link"
                      >
                        Rejoindre la liste
                      </a>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </AnimatedSection>
        {selectedEvent && (
          <div className="event-detail-modal" onClick={() => setSelectedEvent(null)}>
            <div className="event-detail-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="event-detail-close"
                onClick={() => setSelectedEvent(null)}
              >
                ✕
              </button>
              {selectedEvent.image_url && (
                <img
                  src={`${DOMAIN}${selectedEvent.image_url}`}
                  alt={selectedEvent.titre}
                  className="event-detail-image"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomedImage(`${DOMAIN}${selectedEvent.image_url}`);
                  }}
                  style={{ cursor: "zoom-in" }}
                  title="Cliquer pour agrandir"
                />
              )}
              <h2 className="event-detail-title">{selectedEvent.titre}</h2>
              {selectedEvent.prix && (
                <div className="event-detail-price">
                  💶 {selectedEvent.prix}
                  {selectedEvent.devise ? ` ${selectedEvent.devise}` : ""}
                </div>
              )}
              <div className="event-detail-date">
                {(() => {
                  const dateDebut = new Date(selectedEvent.date_event);
                  const dateFin = selectedEvent.date_fin ? new Date(selectedEvent.date_fin) : null;

                  const formatDate = (date: Date) =>
                    date.toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });

                  if (!dateFin || dateDebut.getTime() === dateFin.getTime()) {
                    return formatDate(dateDebut);
                  }

                  if (
                    dateDebut.getMonth() === dateFin.getMonth() &&
                    dateDebut.getFullYear() === dateFin.getFullYear()
                  ) {
                    return `${dateDebut.getDate()} - ${formatDate(dateFin)}`;
                  }

                  return `${formatDate(dateDebut)} - ${formatDate(dateFin)}`;
                })()}
              </div>
              <p className="event-detail-description">{selectedEvent.description}</p>
              {selectedEvent.video_urls && selectedEvent.video_urls.length > 0 && (
                <div className="event-detail-videos">
                  <h3 className="event-detail-videos-title">Vidéos / Réels</h3>
                  <div className="event-detail-videos-list">
                    {selectedEvent.video_urls.map((videoUrl, index) => (
                      (() => {
                        const embed = getVideoEmbedInfo(videoUrl);
                        if (embed) {
                          return (
                            <div key={`${selectedEvent.id}-video-${index}`} className="event-detail-video-embed-wrap">
                              <iframe
                                src={embed.embedUrl}
                                title={`Video ${index + 1}`}
                                className={`event-detail-video-embed ${embed.provider}`}
                                loading="lazy"
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            </div>
                          );
                        }

                        return (
                          <a
                            key={`${selectedEvent.id}-video-${index}`}
                            href={videoUrl}
                            className="event-detail-video-link"
                            onClick={(e) => {
                              const instagramUrl = getInstagramUrl(videoUrl);
                              if (instagramUrl) {
                                e.preventDefault();
                                openCenteredPopup(instagramUrl);
                              }
                            }}
                          >
                            Voir la vidéo {index + 1}
                          </a>
                        );
                      })()
                    ))}
                  </div>
                </div>
              )}
              {selectedEvent.url_inscription && (
                <a
                  href={selectedEvent.url_inscription}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-detail-register-btn"
                >
                  S'inscrire à cet événement
                </a>
              )}
              <button
                type="button"
                className="event-detail-waitlist-btn"
                onClick={() => openEventWaitlistModal(selectedEvent)}
              >
                S'inscrire à la liste d'attente
              </button>
            </div>
          </div>
        )}

        {zoomedImage && (
          <div className="image-zoom-modal" onClick={() => setZoomedImage(null)}>
            <img 
              src={zoomedImage} 
              alt="Image agrandie" 
              className="image-zoom-content"
            />
          </div>
        )}

        {waitlistEvent && (
          <div className="event-waitlist-modal" onClick={closeEventWaitlistModal}>
            <div
              className="event-waitlist-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="event-detail-close"
                onClick={closeEventWaitlistModal}
                type="button"
              >
                ✕
              </button>
              <h2 className="event-waitlist-title">Liste d'attente</h2>
              <p className="event-waitlist-subtitle">{waitlistEvent.titre}</p>
              <form onSubmit={submitEventWaitlist} className="event-waitlist-form">
                <input
                  type="text"
                  placeholder="Nom"
                  value={waitlistForm.nom}
                  onChange={(e) =>
                    setWaitlistForm((prev) => ({ ...prev, nom: e.target.value }))
                  }
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={waitlistForm.email}
                  onChange={(e) =>
                    setWaitlistForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={waitlistForm.telephone}
                  onChange={(e) =>
                    setWaitlistForm((prev) => ({ ...prev, telephone: e.target.value }))
                  }
                  required
                />
                <textarea
                  placeholder="Message (optionnel)"
                  value={waitlistForm.message}
                  onChange={(e) =>
                    setWaitlistForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  rows={4}
                />
                <button type="submit" disabled={waitlistSubmitting}>
                  {waitlistSubmitting ? "Envoi en cours..." : "Rejoindre la liste"}
                </button>
              </form>
            </div>
          </div>
        )}

      </section>

      {/* Bouton Instagram */}
      <AnimatedSection animationType="scale" delay={300}>
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
      </AnimatedSection>
    </div>
  );
};

export default EventsAndExperiences;
