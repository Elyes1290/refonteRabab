import React from "react";

const Vision3DSection: React.FC = () => (
  <section
    className="vision3d-section"
    style={{
      background: "#faf1e6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 400,
    }}
  >
    <div
      className="vision3d-text"
      style={{ flex: 1, minWidth: 260, maxWidth: 700 }}
    >
      <h2>✨ Vision 3D ✨</h2>
      <p>
        La Vision 3D est une méthode d'accompagnement globale qui permet de
        voir, ressentir et transformer les blocages intérieurs. Elle s'appuie
        sur l'écoute du corps, des émotions et de l'inconscient pour libérer les
        mémoires et retrouver l'harmonie.
      </p>
      <p>
        Grâce à des outils symboliques et créatifs, tu explores tes ressources
        profondes et tu avances vers une vie plus alignée, plus joyeuse, plus
        libre.
      </p>
    </div>
  </section>
);

export default Vision3DSection;
