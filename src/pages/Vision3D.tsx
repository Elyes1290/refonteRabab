import React from "react";
import { Link } from "react-router-dom";
import { AnimatedSection } from "../components/AnimatedSection";
import "../styles/Vision3D.css";

const accompagnements = [
  {
    titre: "Méthode Vision 3D",
    texte:
      "Une mise en perspective concrète de votre situation pour clarifier rapidement ce qui se joue et identifier les ajustements nécessaires.",
  },
  {
    titre: "Constellation Familiale",
    texte:
      "Un travail systémique centré sur les liens et les héritages relationnels afin de rétablir un équilibre plus juste dans votre positionnement.",
  },
  {
    titre: "Suivi Personnalisé",
    texte:
      "Un accompagnement dans la durée pour soutenir l'intégration des changements et favoriser une évolution stable et alignée.",
  },
];

const Vision3D: React.FC = () => {
  return (
    <section className="vision3d-page">
      {/* Section héro */}
      <AnimatedSection animationType="fadeUp" delay={120}>
        <div className="vision3d-hero">
          <h1 className="vision3d-title">Méthode Vision 3D</h1>
          <h2 className="vision3d-subtitle">
            Explorer et transformer
            <br />
            Vos dynamiques profondes
            <br />
            Et schémas inconscients
          </h2>
        </div>
      </AnimatedSection>

      {/* Section description */}
      <AnimatedSection animationType="fadeUp" delay={220}>
        <div className="vision3d-description">
          <p>
            La Vision 3D est une approche immersive qui permet de rendre visibles
            les dynamiques profondes qui influencent votre vie.
          </p>
          <p>
            Certaines difficultés, qu'elles soient relationnelles, émotionnelles
            ou décisionnelles, semblent se répéter sans que l'on en comprenne
            pleinement l'origine. Derrière ces situations se trouvent souvent des
            mécanismes inconscients, des loyautés invisibles ou des déséquilibres
            systémiques qui agissent en arrière-plan.
          </p>
          <p>
            La Vision 3D permet de matérialiser ces dynamiques grâce à une
            représentation concrète dans l'espace. À l'aide de figurines et d'une
            mise en perspective tridimensionnelle, ce qui était abstrait devient
            perceptible. Les interactions, tensions et positions se révèlent avec
            clarté.
          </p>
          <p>
            Cette approche s'appuie sur les principes des constellations
            familiales, méthode reconnue pour explorer les systèmes relationnels
            et transgénérationnels.
          </p>
          <p>
            Voir autrement permet souvent de comprendre différemment. Et
            comprendre ouvre la voie à la transformation.
          </p>
          <p>
            Je vous accompagne dans ce processus de clarification et de
            rééquilibrage, en séance individuelle ou en visio, dans un cadre
            bienveillant, confidentiel et respectueux de votre rythme.
          </p>
          <p>
            La Vision 3D n'est pas seulement un outil d'exploration. C'est une
            expérience de prise de conscience profonde et de repositionnement
            intérieur.
          </p>
        </div>
      </AnimatedSection>

      {/* Section Mes accompagnements */}
      <AnimatedSection animationType="fadeUp" delay={320}>
        <div className="vision3d-accompagnements">
          <h2 className="vision3d-accompagnements-title">Mes accompagnements</h2>
          <div className="vision3d-accompagnements-grid">
            {accompagnements.map((item, idx) => (
              <div key={idx} className="vision3d-accompagnement-card">
                <h3 className="vision3d-accompagnement-card-title">
                  {item.titre}
                </h3>
                <p className="vision3d-accompagnement-card-text">{item.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Boutons d'action */}
      <AnimatedSection animationType="scale" delay={380}>
        <div className="vision3d-actions">
          <Link to="/rendez-vous" className="vision3d-cta-button">
            Prendre rendez-vous
          </Link>
          <a
            href="https://www.instagram.com/rabab_rit_a_la_vie"
            target="_blank"
            rel="noopener noreferrer"
            className="vision3d-instagram-button"
          >
            Suivre @rabab_rit_a_la_vie
          </a>
        </div>
      </AnimatedSection>
    </section>
  );
};

export default Vision3D;
