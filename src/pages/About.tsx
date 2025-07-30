import React, { useState } from "react";
import { fetchWithRetry } from "../utils/fetchWithRetry";

// Utiliser toujours rababali.com (API configurée avec CORS)
const API_BASE = "https://rababali.com";

const About: React.FC = () => {
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [showCertifModal, setShowCertifModal] = useState(false);
  return (
    <section
      style={{ background: "#faf1e6", minHeight: "100vh", padding: "2rem 0" }}
    >
      <h1
        style={{
          fontFamily: "Playfair Display, serif",
          fontSize: 40,
          color: "var(--color-primary-dark)",
          marginBottom: 24,
          textAlign: "center",
          letterSpacing: 1,
        }}
      >
        À propos de moi
      </h1>
      <h2
        style={{
          fontFamily: "Playfair Display, serif",
          fontSize: 30,
          color: "var(--color-primary-dark)",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        Ma philosophie d’accompagnement
      </h2>
      <p
        style={{
          fontSize: 18,
          maxWidth: 700,
          margin: "0 auto 1.5rem auto",
          lineHeight: 1.7,
          textAlign: "center",
        }}
      >
        J’accompagne chaque personne dans un cheminement unique, avec douceur,
        écoute et bienveillance. Mon approche est intuitive et symbolique,
        mêlant l’énergétique, l’émotionnel et le corporel pour une
        transformation profonde et durable.
        <br />
        L’accompagnement se fait dans le respect du rythme de chacun, en toute
        confidentialité, pour retrouver la paix intérieure, la joie et la
        liberté d’être soi.
      </p>
      <div style={{ margin: "2.5rem 0 2rem 0", textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            width: 80,
            height: 3,
            background: "var(--color-primary)",
            borderRadius: 2,
            opacity: 0.5,
          }}
        />
      </div>
      <h2
        style={{
          fontFamily: "Playfair Display, serif",
          fontSize: 30,
          color: "var(--color-primary-dark)",
          marginBottom: 16,
          marginTop: 32,
          textAlign: "center",
        }}
      >
        La Vision 3D
      </h2>
      <p
        style={{
          fontSize: 18,
          maxWidth: 700,
          margin: "0 auto 1.5rem auto",
          lineHeight: 1.7,
          textAlign: "center",
        }}
      >
        La Vision 3D est une méthode d’accompagnement globale qui permet de
        voir, ressentir et transformer les blocages intérieurs. Elle s’appuie
        sur l’écoute du corps, des émotions et de l’inconscient pour libérer les
        mémoires et retrouver l’harmonie.
        <br />
        Grâce à des outils symboliques et créatifs, tu explores tes ressources
        profondes et tu avances vers une vie plus alignée, plus joyeuse, plus
        libre.
      </p>
      <div style={{ textAlign: "center", margin: "2.5rem 0" }}>
        <img
          src="/images/vision3dtext.jpeg"
          alt="Schéma Vision 3D"
          style={{
            width: 180,
            opacity: 0.85,
            maxWidth: "80vw",
            cursor: "zoom-in",
            borderRadius: 12,
            boxShadow: "0 2px 8px #0002",
          }}
          onClick={() => setShowVisionModal(true)}
          title="Cliquer pour agrandir"
        />
        {showVisionModal && (
          <div
            onClick={() => setShowVisionModal(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              cursor: "zoom-out",
            }}
          >
            <img
              src="/images/vision3dtext.jpeg"
              alt="Schéma Vision 3D agrandi"
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                borderRadius: 18,
                boxShadow: "0 8px 32px #000a",
                background: "#fff",
                padding: 8,
              }}
            />
          </div>
        )}
      </div>
      <div style={{ margin: "2.5rem 0 2rem 0", textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            width: 80,
            height: 3,
            background: "var(--color-primary)",
            borderRadius: 2,
            opacity: 0.5,
          }}
        />
      </div>
      <h2
        style={{
          fontFamily: "Playfair Display, serif",
          fontSize: 28,
          color: "var(--color-primary-dark)",
          marginBottom: 12,
          marginTop: 32,
          textAlign: "center",
        }}
      >
        Elles m’ont fait confiance
      </h2>
      <AboutTestimonials />
      <div
        style={{
          background: "var(--color-primary)",
          color: "#fff",
          borderRadius: 16,
          padding: "1.5rem 1rem",
          maxWidth: 600,
          margin: "2.5rem auto 0 auto",
          textAlign: "center",
          fontSize: 20,
          fontWeight: 600,
          boxShadow: "0 2px 8px #0001",
        }}
      >
        <span role="img" aria-label="plante">
          🌱
        </span>{" "}
        <b>Ma mission :</b> t’aider à voir plus clair, à libérer ce qui bloque,
        et à faire circuler pleinement ton énergie de vie pour que, toi aussi,
        tu puisses rire à la vie.
      </div>

      {/* Section Diplômes & Certificats */}
      <div style={{ margin: "3.5rem 0 2rem 0", textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            width: 80,
            height: 3,
            background: "var(--color-primary)",
            borderRadius: 2,
            opacity: 0.5,
          }}
        />
      </div>
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto 3rem auto",
          padding: "0 1rem",
        }}
      >
        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: 28,
            color: "var(--color-primary-dark)",
            marginBottom: 24,
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          🎓 Diplômes & Certificats
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 32,
            justifyContent: "center",
            alignItems: "stretch",
            margin: "0 auto",
            maxWidth: 1000,
          }}
        >
          {/* Certificat unique pour l'instant, possibilité d'en ajouter d'autres plus tard */}
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 4px 18px #0001",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 320,
              border: "2px solid #e0d2b8",
            }}
          >
            <img
              src="/images/certificat1.jpeg"
              alt="Certificat Art-thérapie - Enfants et Adolescents"
              style={{
                width: "100%",
                maxWidth: 220,
                height: "auto",
                borderRadius: 12,
                marginBottom: 16,
                boxShadow: "0 2px 8px #0002",
                background: "#faf1e6",
                cursor: "zoom-in",
                transition: "box-shadow 0.2s",
                opacity: 0.95,
              }}
              onClick={() => setShowCertifModal(true)}
              title="Cliquer pour agrandir"
            />
            {showCertifModal && (
              <div
                onClick={() => setShowCertifModal(false)}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(0,0,0,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                  cursor: "zoom-out",
                }}
              >
                <img
                  src="/images/certificat1.jpeg"
                  alt="Certificat Art-thérapie - Enfants et Adolescents (agrandi)"
                  style={{
                    maxWidth: "90vw",
                    maxHeight: "90vh",
                    borderRadius: 18,
                    boxShadow: "0 8px 32px #000a",
                    background: "#fff",
                    padding: 8,
                  }}
                />
              </div>
            )}
            <div
              style={{
                fontWeight: 700,
                color: "var(--color-primary-dark)",
                fontSize: 18,
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              Certificat de stage : Art-thérapie – Enfants et Adolescents
            </div>
            <div
              style={{
                color: "#888",
                fontSize: 15,
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              Délivré par Amélie Jory, art-thérapeute
            </div>
            <div style={{ color: "#888", fontSize: 14, textAlign: "center" }}>
              Fait à Montreux, juin 2025
            </div>
          </div>
          {/* Pour ajouter d'autres certificats, dupliquer la carte ci-dessus */}
        </div>
      </section>
    </section>
  );
};

// Composant pour afficher dynamiquement les vrais témoignages
interface Experience {
  id: number;
  nom: string;
  titre: string;
  message: string;
  date_creation: string;
  statut?: string;
}
const AboutTestimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    fetchWithRetry(
      `${API_BASE}/rabab/api/db_connect.php?action=get_experiences`,
      {},
      {
        retries: 3,
        retryDelay: 1000,
        timeout: 15000,
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors du chargement des avis");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          const valides = (data.data as Experience[]).filter(
            (e) => e.statut === "valide"
          );
          setTestimonials(valides.slice(0, 4));
        } else {
          setError(data.message || "Erreur lors de la récupération des avis");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        gap: "2rem",
        maxWidth: "1200px",
        margin: "0 auto 2.5rem auto",
        padding: "0 2rem",
      }}
    >
      {loading ? (
        <div
          style={{ textAlign: "center", color: "var(--color-primary-dark)" }}
        >
          Chargement…
        </div>
      ) : error ? (
        <div style={{ color: "red", textAlign: "center" }}>{error}</div>
      ) : testimonials.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888" }}>
          Aucun témoignage pour le moment.
        </div>
      ) : (
        testimonials.map((experience) => (
          <div
            key={experience.id}
            className="zoom-hover"
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "2rem",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              transition: "all 0.3s ease",
              border: "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#87CEEB";
              e.currentTarget.style.boxShadow =
                "0 15px 40px rgba(135, 206, 235, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.1)";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <div
                className="pulse-glow"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "linear-gradient(45deg, #87CEEB, #4682B4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "1rem",
                  fontSize: "1.5rem",
                }}
              >
                ✨
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "1.3rem",
                    color: "var(--color-primary-dark)",
                    margin: "0 0 0.2rem 0",
                  }}
                >
                  {experience.titre}
                </h3>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#888",
                    margin: 0,
                  }}
                >
                  Par {experience.nom} • {formatDate(experience.date_creation)}
                </p>
              </div>
            </div>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.6,
                color: "var(--color-text)",
                fontStyle: "italic",
                flex: 1,
              }}
            >
              "{experience.message}"
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default About;
