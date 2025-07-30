import React, { useState, useEffect } from "react";
import { fetchWithRetry } from "../utils/fetchWithRetry";
import "../styles/global.css";

// Utiliser toujours rababali.com (API configurée avec CORS)
const API_BASE = "https://rababali.com";

interface Experience {
  id: number;
  nom: string;
  titre: string;
  message: string;
  date_creation: string;
  statut?: string;
}

const TemoignagesSection: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        setLoading(true);
        const response = await fetchWithRetry(
          `${API_BASE}/rabab/api/db_connect.php?action=get_experiences`,
          {},
          {
            retries: 3,
            retryDelay: 1000,
            timeout: 15000,
          }
        );
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des expériences");
        }
        const data = await response.json();
        if (data.success) {
          // On ne garde que les avis validés
          const valides = (data.data as Experience[]).filter(
            (e) => e.statut === "valide"
          );
          // On prend les 3 plus récents
          setExperiences(valides.slice(0, 3));
        } else {
          setError(data.message || "Erreur lors de la récupération des avis");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, []);

  return (
    <section className="temoignages-section">
      <h2>Partages & Expériences</h2>
      {loading ? (
        <div className="loading-message">Chargement…</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="temoignages-cards">
          {experiences.length === 0 ? (
            <div className="no-testimonials">
              Aucun témoignage pour le moment.
            </div>
          ) : (
            experiences.map((experience) => (
              <div key={experience.id} className="zoom-hover temoignage-card">
                <h3 className="experience-title">{experience.titre}</h3>
                <p className="experience-content">"{experience.message}"</p>
                <div className="author-info">
                  <strong className="author-name">{experience.nom}</strong>
                  <span className="experience-date">
                    {new Date(experience.date_creation).toLocaleDateString(
                      "fr-FR"
                    )}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default TemoignagesSection;
