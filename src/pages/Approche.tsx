import React from "react";
import { AnimatedSection } from "../components/AnimatedSection";
import "../styles/Approche.css";

const Approche: React.FC = () => {
  return (
    <section className="approche-page">
      {/* Section héro */}
      <AnimatedSection animationType="fadeUp" delay={120}>
        <div className="approche-hero">
          <h1 className="approche-title">Déroulement d'une séance</h1>
          <h2 className="vision3d-subtitle">
            Découvrez le déroulement
            <br />
            d'une séance Vision 3D
            <br />à travers 4 étapes structurées :
          </h2>
        </div>
      </AnimatedSection>

      {/* Étape 1 - Carte seule */}
      <AnimatedSection animationType="fadeUp" delay={180}>
        <div className="approche-step approche-step-card-only">
        <div className="approche-card">
          <h3 className="approche-card-title">
            Étape 1 : Clarifier la situation
          </h3>
          <p className="approche-card-text">
            Nous commençons par identifier précisément ce que vous traversez
            actuellement : blocage, tension relationnelle, difficulté
            émotionnelle ou questionnement important.
          </p>
          <p className="approche-card-text">
            Mettre des mots justes sur votre situation permet de poser une base
            solide pour le travail.
          </p>
        </div>
        </div>
      </AnimatedSection>

      {/* Étape 2 - Image à gauche, texte à droite */}
      <AnimatedSection animationType="fadeUp" delay={220}>
        <div className="approche-step approche-step-row">
        <div className="approche-image-wrap">
          <img
            src="/images/vision0.jpeg?v=7"
            alt="Séance Vision 3D avec figurines"
            className="approche-step-image"
          />
        </div>
        <div className="approche-step-content approche-card">
          <h3 className="approche-card-title">
            Étape 2 : Représenter votre réalité
          </h3>
          <p className="approche-card-text">
            À l'aide de figurines et d'un support visuel, vous positionnez
            intuitivement les éléments liés à votre situation : émotions,
            personnes, enjeux ou aspects de vous-même.
          </p>
          <p className="approche-card-text">
            Cette mise en espace rend visible la dynamique en cours, sans
            analyse immédiate. Elle permet à votre perception intérieure de
            s'exprimer librement.
          </p>
        </div>
        </div>
      </AnimatedSection>

      {/* Étape 3 - Carte seule */}
      <AnimatedSection animationType="fadeUp" delay={260}>
        <div className="approche-step approche-step-card-only">
        <div className="approche-card">
          <h3 className="approche-card-title">
            Étape 3 : Observer et Comprendre
          </h3>
          <p className="approche-card-text">
            Nous analysons ensemble la configuration créée :
            les distances, les orientations, les déséquilibres éventuels.
          </p>
          <p className="approche-card-text">
            Cette lecture visuelle révèle les influences en présence et met en lumière ce qui agit
            parfois de manière inconsciente.
            La compréhension devient plus concrète, plus structurée, plus intégrée.
          </p>
        </div>
        </div>
      </AnimatedSection>

      {/* Étape 4 - Texte à gauche, image à droite */}
      <AnimatedSection animationType="fadeUp" delay={300}>
        <div className="approche-step approche-step-row">
        <div className="approche-step-content approche-card">
          <h3 className="approche-card-title">
            Étape 4 : Ajuster et Transformer
          </h3>
          <p className="approche-card-text">
            À partir des prises de conscience, nous procédons aux ajustements nécessaires
            dans la représentation afin de rétablir un positionnement plus juste.
          </p>
          <p className="approche-card-text">
            Vous repartez avec un nouvel ancrage, formulé sous la forme de phrases
            claires et personnalisées, destinées à soutenir votre évolution et libération dans la durée.
          </p>
        </div>
        <div className="approche-image-wrap">
          <img
            src="/images/vision2.jpeg?v=2"
            alt="Figurines Vision 3D"
            className="approche-step-image"
          />
        </div>
        </div>
      </AnimatedSection>

      {/* Section infos pratiques - 3 cartes */}
      <AnimatedSection animationType="fadeUp" delay={340}>
        <div className="approche-infos-grid">
        <div className="approche-card approche-info-card">
          <h3 className="approche-card-title">Durée ?</h3>
          <p className="approche-card-text">
            Les séances durent 1h ou 1h30, selon vos besoins et la complexité de la situation.
          </p>
        </div>
        <div className="approche-card approche-info-card">
          <h3 className="approche-card-title">Pour qui ?</h3>
          <p className="approche-card-text">
            Cette méthode s'adresse à toute personne souhaitant avancer en douceur, sans
            expérience préalable en thérapie, et retrouver clarté, sérénité et équilibre.
          </p>
        </div>
        <div className="approche-card approche-info-card">
          <h3 className="approche-card-title">Pourquoi cette méthode fonctionne ?</h3>
          <p className="approche-card-text">
            La Vision 3D agit à la fois sur le corps, l'émotion et la conscience.
            Grâce à l'utilisation d'outils symboliques, de la visualisation et du ressenti,
            vous ne restez pas dans le mental : vous ressentez, observez et vivez votre situation.
          </p>
          <p className="approche-card-text">
            Cette approche immersive permet une prise de conscience authentique et profonde,
            qui ouvre la voie à la transformation et au repositionnement intérieur.
          </p>
        </div>
        </div>
      </AnimatedSection>

      {/* Boutons d'action */}
      <AnimatedSection animationType="scale" delay={380}>
        <div className="approche-actions">
        <a href="/rendez-vous" className="approche-cta-button">
          Prendre rendez-vous
        </a>
        <a
          href="https://www.instagram.com/rabab_rit_a_la_vie"
          target="_blank"
          rel="noopener noreferrer"
          className="approche-instagram-button"
        >
          Suivre @rabab_rit_a_la_vie
        </a>
        </div>
      </AnimatedSection>
    </section>
  );
};

export default Approche;
