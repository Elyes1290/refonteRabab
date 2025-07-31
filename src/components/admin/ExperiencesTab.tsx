import React from "react";
import { toast } from "react-toastify";

// Interface pour les expériences/avis
interface Experience {
  id: number;
  nom: string;
  titre: string;
  message: string;
  note: number;
  date_creation: string;
  statut: string; // 'en_attente', 'valide', 'refuse'
}

interface ExperiencesTabProps {
  experiences: Experience[];
  loadingExperiences: boolean;
  onRefreshExperiences: () => void;
  API_BASE: string;
}

const ExperiencesTab: React.FC<ExperiencesTabProps> = ({
  experiences,
  loadingExperiences,
  onRefreshExperiences,
  API_BASE,
}) => {
  // Fonction pour supprimer une expérience
  const handleDeleteExperience = async (id: number) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cette expérience ?")
    ) {
      try {
        const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `action=delete_experience&id=${id}`,
        });
        const data = await response.json();
        if (data.success) {
          toast.success("Expérience supprimée avec succès !");
          onRefreshExperiences();
        } else {
          toast.error(data.message || "Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur de connexion");
      }
    }
  };

  // Fonction pour valider/refuser un avis
  const handleModerateExperience = async (
    id: number,
    statut: "valide" | "refuse"
  ) => {
    try {
      const response = await fetch(
        `${API_BASE}/rabab/api/db_connect.php?action=moderate_experience&id=${id}&statut=${statut}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(
          `Avis ${statut === "valide" ? "validé" : "refusé"} avec succès !`
        );
        onRefreshExperiences();
      } else {
        toast.error(data.message || "Erreur lors de la modération de l'avis.");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la modération de l'avis.");
    }
  };

  return (
    <>
      <h2
        style={{
          color: "#4682B4",
          fontSize: "1.3rem",
          margin: "2.5rem 0 18px",
        }}
      >
        Avis & Témoignages
      </h2>

      {loadingExperiences ? (
        <div className="admin-loading">Chargement des expériences...</div>
      ) : experiences.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888" }}>
          Aucun avis pour le moment.
        </div>
      ) : (
        <div className="admin-events-grid">
          {experiences.map((exp) => (
            <div key={exp.id} className="admin-event-card">
              <div className="admin-event-title">{exp.titre}</div>
              <div className="admin-event-desc">{exp.message}</div>
              <div className="admin-event-date">🗓️ {exp.date_creation}</div>
              <div
                className="admin-event-prix"
                style={{ color: "#4682B4", fontWeight: 500 }}
              >
                {exp.nom}
              </div>
              <div style={{ margin: "8px 0", fontSize: 13 }}>
                Statut :{" "}
                {exp.statut === "valide"
                  ? "✅ Validé"
                  : exp.statut === "refuse"
                  ? "❌ Refusé"
                  : "⏳ En attente"}
              </div>
              {exp.statut === "en_attente" && (
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <button
                    onClick={() => handleModerateExperience(exp.id, "valide")}
                    style={{
                      background: "#4caf50",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 14px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Valider
                  </button>
                  <button
                    onClick={() => handleModerateExperience(exp.id, "refuse")}
                    style={{
                      background: "#b22222",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 14px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Refuser
                  </button>
                </div>
              )}
              <button
                className="admin-event-delete-btn"
                onClick={() => handleDeleteExperience(exp.id)}
                style={{
                  background: "#b22222",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  marginTop: 10,
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "background 0.2s",
                }}
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default ExperiencesTab;
