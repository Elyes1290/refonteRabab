import React from "react";
import "../styles/Vision3D.css";

const pointsCle = [
  {
    icon: "🌱",
    titre: "Transformation durable",
    texte:
      "Libérez-vous des schémas répétitifs et avancez vers une vie plus sereine et alignée.",
  },
  {
    icon: "👁️",
    titre: "Clarté intérieure",
    texte:
      "Prenez du recul sur votre histoire et vos émotions pour mieux comprendre vos besoins profonds.",
  },
  {
    icon: "💡",
    titre: "Approche intuitive",
    texte:
      "Bénéficiez d'un accompagnement sur-mesure, alliant intuition, symbolique et bienveillance.",
  },
  {
    icon: "🤲",
    titre: "Accompagnement humain",
    texte:
      "Un espace d'écoute, de respect et de douceur pour avancer à votre rythme.",
  },
];

const temoignage = {
  texte:
    "La Vision 3D m'a permis de comprendre et de dépasser des blocages profonds. J'ai retrouvé confiance et sérénité. Merci Rabab pour ta douceur et ton accompagnement unique !",
  auteur: "Sophie L.",
};

const Vision3D: React.FC = () => {
  return (
    <section className="vision3d-page">
      {/* Section héro */}
      <div className="vision3d-hero">
        <h1 className="vision3d-title">Approche & vision 3D</h1>
        {/* vision0.png : forme normale */}
        <img
          src="/images/vision0.jpeg"
          alt="Vision 3D illustration principale"
          className="vision3d-hero-image"
        />
        <div className="vision3d-subtitle">
          Un accompagnement individuel unique qui travaille à la fois sur le
          conscient, l'inconscient et les émotions grâce à des figurines
          symboliques.
          <br />
          Une expérience concrète, visuelle et transformative pour libérer ce
          qui bloque et créer la vie que tu souhaites.
        </div>
      </div>

      {/* Séparateur */}
      <hr className="vision3d-separator" />

      {/* Présentation de la méthode (alternance texte/image) */}
      <div className="vision3d-section">
        <div className="vision3d-content">
          <h2 className="vision3d-section-title">Comment ça marche ?</h2>
          <p className="vision3d-section-text">
            <strong>Étape 1 : Identifier ta problématique</strong>
            <br />
            On commence par poser ce qui te freine aujourd'hui — stress, peur,
            anxiété, ou autre — en le nommant simplement.
          </p>
          <p className="vision3d-section-text no-margin">
            <strong>Étape 2 : Donner vie à ta situation</strong>
            <br />
            Grâce à des figurines, tu places intuitivement les émotions, les
            peurs, ou les personnes importantes autour de toi sur un plateau,
            sans forcément savoir ce que ça représente. C'est ton intuition qui
            guide.
          </p>
        </div>
        {/* vision1.jpg : cercle + flottement */}
        <div className="vision3d-circular-container">
          <img
            src="/images/vision1.jpg"
            alt="Vision 3D illustration 1"
            className="vision3d-circular-image"
          />
        </div>
      </div>

      {/* Séparateur */}
      <hr className="vision3d-separator" />

      {/* Section Une approche puissante */}
      <div className="vision3d-section reverse">
        <div className="vision3d-content">
          <h2 className="vision3d-section-title">Observer et transformer</h2>
          <p className="vision3d-section-text">
            <strong>Étape 3 : Observer et comprendre</strong>
            <br />
            Je t'aide à voir clairement ce qui prend trop de place, ce qui
            influence ta vie, comme un puzzle vivant, ta propre pièce de
            théâtre. Cette visualisation permet d'engager à la fois
            l'inconscient et le conscient, offrant une compréhension profonde de
            ta situation.
          </p>
          <p className="vision3d-section-text no-margin">
            <strong>Étape 4 : Transformer et libérer</strong>
            <br />
            On remplace ensemble les émotions lourdes par des affirmations
            positives — paix, confiance, réussite — et tu repars avec une
            phrase-pilier créée pour toi, ancrée dans ta réalité et tes
            objectifs.
          </p>
        </div>
        {/* vision2.jpg : cercle + flottement */}
        <img
          src="/images/vision2.jpeg"
          alt="Vision 3D illustration 2"
          className="vision3d-circular-simple"
        />
      </div>

      {/* Séparateur */}
      <hr className="vision3d-separator" />

      {/* Section Fonctionnement */}
      <div className="vision3d-section">
        <div className="vision3d-content">
          <h2 className="vision3d-section-title">Fonctionnement</h2>
          <p className="vision3d-section-text">
            <strong>Durée :</strong> Entre 45 minutes et 1h20, une séance
            intense et légère à la fois.
            <br />
            <br />
            <strong>Pour qui ?</strong>
            <br />
            Pour toute personne qui veut avancer en douceur, même sans
            expérience de thérapie, et retrouver clarté et sérénité.
          </p>
          <p className="vision3d-section-text no-margin">
            <strong>Pourquoi cette méthode fonctionne ?</strong>
            <br />
            Stress, peur, angoisse… Et si tu pouvais "voir" ces émotions, leur
            place dans ta vie ? Cette méthode concrète et visuelle permet
            d'incarner et de "voir" la situation, ce qui est souvent plus
            impactant que la seule parole. C'est simple, puissant, accessible à
            tous.
          </p>
        </div>
        {/* vision3.jpg : cercle + flottement */}
        <img
          src="/images/vision3.jpeg"
          alt="Vision 3D illustration 3"
          className="vision3d-circular-simple slow"
        />
      </div>

      {/* Séparateur */}
      <hr className="vision3d-separator" />

      {/* Bloc Pourquoi choisir la Vision 3D ? */}
      <div className="vision3d-main-block">
        <h3 className="vision3d-main-title">Pourquoi choisir la Vision 3D ?</h3>
        <div className="vision3d-points-grid">
          {pointsCle.map((pt, idx) => (
            <div key={idx} className="vision3d-point-card">
              <span className="vision3d-point-icon">{pt.icon}</span>
              <div className="vision3d-point-title">{pt.titre}</div>
              <div className="vision3d-point-text">{pt.texte}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Séparateur */}
      <hr className="vision3d-separator" />

      {/* Bloc témoignage */}
      <div className="vision3d-testimonial">
        <div className="vision3d-testimonial-text">"{temoignage.texte}"</div>
        <div className="vision3d-testimonial-author">{temoignage.auteur}</div>
      </div>

      {/* Séparateur */}
      <hr className="vision3d-separator" />

      {/* Appel à l'action */}
      <div className="vision3d-cta">
        <div className="vision3d-cta-text">
          Et si tu voyais ta vie en 3 dimensions ?<br />
          Prends rendez-vous dès maintenant !
        </div>
        <a href="/rendez-vous" className="vision3d-cta-button">
          Prendre rendez-vous
        </a>
      </div>
    </section>
  );
};

export default Vision3D;
