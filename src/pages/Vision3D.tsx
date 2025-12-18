import React from "react";
import "../styles/Vision3D.css";

const pointsCle = [
  {
    icon: "/images/signe_rabab.png?v=2",
    titre: "Transformation durable",
    texte:
      "Libérez-vous des schémas répétitifs et avancez vers une vie plus sereine et alignée.",
  },
  {
    icon: "/images/signe_rabab.png?v=2",
    titre: "Clarté intérieure",
    texte:
      "Prenez du recul sur votre histoire et vos émotions pour mieux comprendre vos besoins profonds.",
  },
  {
    icon: "/images/signe_rabab.png?v=2",
    titre: "Approche intuitive",
    texte:
      "Bénéficiez d'un accompagnement sur-mesure, alliant intuition, symbolique et bienveillance.",
  },
];

const Vision3D: React.FC = () => {
  return (
    <section className="vision3d-page">
      {/* Section héro */}
      <div className="vision3d-hero">
        <h1 className="vision3d-title">Constellation & méthode vision 3D</h1>
        {/* vision0.png : forme normale */}
        <img
          src="/images/vision0.jpeg?v=3"
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

      {/* Présentation de la méthode - 4 étapes unifiées */}
      <div className="vision3d-section">
        <div className="vision3d-content">
          <h2 className="vision3d-section-title">Comment ça marche ?</h2>
          <p className="vision3d-section-text">
            <strong>Étape 1 : Identifier ta problématique</strong>
            <br />
            On commence par poser ce qui te freine aujourd'hui, stress, peur,
            anxiété, ou autre, en le nommant simplement.
          </p>
          <p className="vision3d-section-text">
            <strong>Étape 2 : Donner vie à ta situation</strong>
            <br />
            Grâce à des figurines, tu places intuitivement les émotions, les
            peurs, ou les personnes importantes autour de toi sur un plateau,
            sans forcément savoir ce que ça représente. C'est ton intuition qui
            guide.
          </p>
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
            positives et tu repars avec une phrase-pilier créée pour toi, ancrée
            dans ta réalité et tes objectifs.
          </p>
        </div>
        {/* vision2.jpeg : cercle + flottement */}
        <div className="vision3d-circular-container">
          <img
            src="/images/vision2.jpeg?v=2"
            alt="Vision 3D illustration 2"
            className="vision3d-circular-image"
          />
        </div>
      </div>

      {/* Séparateur */}
      <hr className="vision3d-separator" />

      {/* Section Fonctionnement */}
      <div className="vision3d-section reverse">
        <div className="vision3d-content">
          <h2 className="vision3d-section-title">Fonctionnement</h2>
          <p className="vision3d-section-text">
            <strong>Durée :</strong> Environ 1h, une séance intense et légère à
            la fois.
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
            Elle passe par le corps, l'émotion et la conscience. Grâce aux
            outils symboliques, aux mots, aux ressentis et à la visualisation,
            la personne ne reste pas dans le mental. Elle ressent, elle voit,
            elle vit, la problématique, ce qui permet une vraie prise de
            conscience.
          </p>
        </div>
        {/* vision1.jpg : cercle + flottement */}
        <img
          src="/images/vision1.jpg?v=2"
          alt="Vision 3D illustration 1"
          className="vision3d-circular-simple slow"
        />
      </div>

      {/* Séparateur */}
      <hr className="vision3d-separator" />

      {/* Bloc Pourquoi choisir la Vision 3D ? */}
      <div className="vision3d-main-block">
        <h3 className="vision3d-main-title">
          Viens découvrir mon accompagnement
        </h3>
        <div className="vision3d-points-grid">
          {pointsCle.map((pt, idx) => (
            <div key={idx} className="vision3d-point-card">
              <img
                src={pt.icon}
                alt={pt.titre}
                className="vision3d-point-icon-img"
              />
              <div className="vision3d-point-title">{pt.titre}</div>
              <div className="vision3d-point-text">{pt.texte}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Séparateur */}
      <hr className="vision3d-separator" />

      {/* Appel à l'action */}
      <div className="vision3d-cta">
        <div className="vision3d-cta-text">
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
