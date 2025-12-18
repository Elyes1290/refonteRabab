import React, { useState } from "react";
import BannerSection from "../components/BannerSection";
import PresentationSection from "../components/PresentationSection";
import RendezVousSection from "../components/RendezVousSection";
import { AnimatedSection } from "../components/AnimatedSection";
import { WaveTransition } from "../components/WaveTransition";

const Home: React.FC = () => {
  const [showCertifModal, setShowCertifModal] = useState(false);
  const [showCertifModal2, setShowCertifModal2] = useState(false);

  return (
    <>
      <AnimatedSection animationType="fadeUp" delay={200}>
        <BannerSection />
      </AnimatedSection>

      <WaveTransition color="#87CEEB" height="80px" />

      <AnimatedSection animationType="fadeLeft" delay={300}>
        <PresentationSection />
      </AnimatedSection>

      <WaveTransition color="#4682B4" height="100px" />

      {/* Section Diplômes & Certificats */}
      <section
        style={{
          background: "#faf1e6",
          padding: "3rem 0",
        }}
      >
        <div style={{ margin: "1rem 0 2rem 0", textAlign: "center" }}>
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
        <div
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
            {/* Certificat Art-thérapie */}
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

            {/* Certificat Théorie des Constellations Familiales */}
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
                src="/images/Théorie des constellations familiales.jpg"
                alt="Module 1: Théorie des Constellations Familiales"
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
                onClick={() => setShowCertifModal2(true)}
                title="Cliquer pour agrandir"
              />
              {showCertifModal2 && (
                <div
                  onClick={() => setShowCertifModal2(false)}
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
                    src="/images/Théorie des constellations familiales.jpg"
                    alt="Module 1: Théorie des Constellations Familiales (agrandi)"
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
                Module 1: Théorie des Constellations Familiales
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
                Fait à Montreux, avril 2025
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveTransition color="#FFF8DC" height="70px" flip />

      <AnimatedSection animationType="fadeUp" delay={600}>
        <RendezVousSection />
      </AnimatedSection>
    </>
  );
};

export default Home;
