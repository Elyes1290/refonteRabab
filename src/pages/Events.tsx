import React, { useEffect, useState } from "react";
import { fetchWithRetry } from "../utils/fetchWithRetry";
import "../styles/Events.css";

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

const Events: React.FC = () => {
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

  return (
    <section className="events-page">
      <h1 className="events-title">Activités & Événements</h1>
      <p className="events-description">
        Retrouvez ici tous les événements à venir et passés. Pour toute question
        ou pour organiser un événement sur-mesure, contactez-moi directement !
      </p>
      {loading && (
        <div className="events-loading">Chargement des événements…</div>
      )}
      {error && <div className="events-error">{error}</div>}
      {!loading && !error && events.length === 0 && (
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
          </div>
        ))}
      </div>
      {modalImg && (
        <div className="events-modal" onClick={() => setModalImg(null)}>
          <img src={modalImg} alt={modalAlt} className="events-modal-image" />
        </div>
      )}
    </section>
  );
};

export default Events;
