import React, { useState } from "react";
import { AnimatedSection } from "../components/AnimatedSection";
import "../styles/About.css";

const Home: React.FC = () => {
  const [showCertifModal, setShowCertifModal] = useState(false);
  const [showCertifModal2, setShowCertifModal2] = useState(false);

  return (
    <section className="about-page">
      {/* Section héro */}
      <AnimatedSection animationType="fadeUp" delay={120}>
        <div className="about-hero">
        <h1 className="about-title">Rabab Ali</h1>
        <div className="about-photo-wrap">
          <img
            src="/images/image18.jpeg"
            alt="Rabab Ali"
            className="about-photo"
          />
        </div>
        <p className="about-quote">"J'aime rire à la vie."</p>
        </div>
      </AnimatedSection>

      {/* Section texte */}
      <AnimatedSection animationType="fadeUp" delay={220}>
        <div className="about-text-section">
        <p>
          Ce n'est pas juste une phrase, c'est un état d'esprit. Une manière de
          traverser les tempêtes avec légèreté, de transformer les épreuves en
          enseignements, et de cultiver la joie, même dans les zones d'ombre.
        </p>
        <p>
          Guidée par une quête de paix intérieure et d'amour vrai, je suis une
          femme, une maman, une âme en chemin.
        </p>
        <p>
          Née dans une famille musulmane, j'ai grandi avec un esprit curieux,
          libre et ouvert, toujours à l'écoute de l'invisible.
        </p>
        <p>Avec le temps, cette sensibilité est devenue une force.</p>
        <p>
          Maman de trois enfants, autodidacte et passionnée par la
          transformation intérieure, j'ai moi-même traversé et apaisé de
          nombreux schémas répétitifs, pour revenir à l'essentiel : l'amour de
          soi, la liberté intérieure, l'harmonie.
        </p>
        <p>
          Aujourd'hui, j'accompagne les personnes en quête de sens, d'équilibre
          ou de reconnexion à elles-mêmes. J'utilise une approche intuitive et
          symbolique, où l'on travaille sur les émotions, les énergies, les
          mémoires, avec douceur et profondeur.
        </p>
        <p>
          Ma mission : <br /> t'aider à voir plus clair, à libérer ce qui
          bloque, et à faire circuler pleinement ton énergie de vie pour que,
          toi aussi, tu puisses rire à la vie.
        </p>
        </div>
      </AnimatedSection>

      {/* Section Mes Valeurs */}
      <AnimatedSection animationType="fadeUp" delay={300}>
        <div className="about-valeurs">
        <h2 className="about-valeurs-title">Mes Valeurs</h2>
        <div className="about-valeurs-list">
          <div className="about-valeur-card">
            <h3 className="about-valeur-name">Bienveillance</h3>
            <p className="about-valeur-text">Un accueil chaleureux et sans jugement</p>
          </div>
          <div className="about-valeur-card">
            <h3 className="about-valeur-name">Confidentialité</h3>
            <p className="about-valeur-text">Un espace sécurisé pour vous exprimer</p>
          </div>
          <div className="about-valeur-card">
            <h3 className="about-valeur-name">Authenticité</h3>
            <p className="about-valeur-text">Une relation vraie et sincère</p>
          </div>
        </div>
        </div>
      </AnimatedSection>

      {/* Section Diplômes & Certificats */}
      <AnimatedSection animationType="fadeUp" delay={360}>
        <div className="about-certifs">
        <h2 className="about-certifs-title">Diplômes & Certificats</h2>
        <div className="about-certifs-grid">
          <div className="about-certif-card">
            <img
              src="/images/certificat1.jpeg"
              alt="Certificat Art-thérapie"
              className="about-certif-img"
              onClick={() => setShowCertifModal(true)}
            />
            {showCertifModal && (
              <div
                className="about-certif-modal"
                onClick={() => setShowCertifModal(false)}
              >
                <img
                  src="/images/certificat1.jpeg"
                  alt="Certificat agrandi"
                  className="about-certif-modal-img"
                />
              </div>
            )}
            <div className="about-certif-name">
              Certificat de stage : Art-thérapie – Enfants et Adolescents
            </div>
            <div className="about-certif-info">
              Délivré par Amélie Jory, art-thérapeute
            </div>
            <div className="about-certif-info">Fait à Montreux, juin 2025</div>
          </div>

          <div className="about-certif-card">
            <img
              src="/images/Théorie des constellations familiales.jpg"
              alt="Module 1: Théorie des Constellations Familiales"
              className="about-certif-img"
              onClick={() => setShowCertifModal2(true)}
            />
            {showCertifModal2 && (
              <div
                className="about-certif-modal"
                onClick={() => setShowCertifModal2(false)}
              >
                <img
                  src="/images/Théorie des constellations familiales.jpg"
                  alt="Certificat agrandi"
                  className="about-certif-modal-img"
                />
              </div>
            )}
            <div className="about-certif-name">
              Module 1: Théorie des Constellations Familiales
            </div>
            <div className="about-certif-info">
              Délivré par Amélie Jory, art-thérapeute
            </div>
            <div className="about-certif-info">Fait à Montreux, avril 2025</div>
          </div>
        </div>
        </div>
      </AnimatedSection>
    </section>
  );
};

export default Home;
