import React, { useEffect, useState } from "react";
import { fetchWithRetry } from "../utils/fetchWithRetry";
import "../styles/EvenementsSection.css";

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
}

// Utiliser toujours rababali.com (API configurée avec CORS)
const DOMAIN = "https://rababali.com";

const EvenementsSection: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>("");

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
          setError(
            data.message || "Erreur lors de la récupération des événements"
          );
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Trier par date croissante et prendre les 3 prochains événements
  const now = new Date();
  const prochains = events
    .filter((evt) => new Date(evt.date_event) >= now)
    .sort(
      (a, b) =>
        new Date(a.date_event).getTime() - new Date(b.date_event).getTime()
    )
    .slice(0, 3);
  // Si aucun à venir, prendre les 3 plus récents
  const aAfficher = prochains.length > 0 ? prochains : events.slice(0, 3);

  return (
    <section className="evenements-section">
      <h2>Activités & Événements</h2>
      {loading ? (
        <div className="evenements-loading">Chargement…</div>
      ) : error ? (
        <div className="evenements-error">{error}</div>
      ) : (
        <div className="evenements-cards">
          {aAfficher.map((event) => (
            <div key={event.id} className="evenement-card">
              {event.image_url && (
                <img
                  src={`${DOMAIN}${event.image_url}`}
                  alt={event.titre}
                  className={`evenement-image ${
                    event.type === "flyer" ? "flyer" : "regular"
                  }`}
                  onClick={() => {
                    setModalImg(`${DOMAIN}${event.image_url}`);
                    setModalAlt(event.titre);
                  }}
                  title="Cliquer pour agrandir"
                />
              )}
              <h2 className="evenement-title">{event.titre}</h2>
              {event.prix && (
                <div className="evenement-price">
                  💶 {event.prix}
                  {event.devise ? ` ${event.devise}` : ""}
                </div>
              )}
              <div className="evenement-date">
                {(() => {
                  const dateDebut = new Date(event.date_event);
                  const dateFin = event.date_fin
                    ? new Date(event.date_fin)
                    : null;

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
              <p className="evenement-description">{event.description}</p>
            </div>
          ))}
        </div>
      )}
      <a href="/evenements" className="evenements-view-all">
        Voir tout
      </a>
      {modalImg && (
        <div className="evenements-modal" onClick={() => setModalImg(null)}>
          <img
            src={modalImg}
            alt={modalAlt}
            className="evenements-modal-image"
          />
        </div>
      )}
    </section>
  );
};

export default EvenementsSection;
