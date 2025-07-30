import React from "react";

const AccompagnementSection: React.FC = () => (
  <section className="accompagnement-section" style={{ background: "#faf1e6" }}>
    <h2>Accompagnement</h2>
    <div className="accompagnement-text">
      <p>
        J'accompagne chaque personne dans un cheminement unique, avec douceur,
        écoute et bienveillance. Mon approche est intuitive et symbolique,
        mêlant l'énergétique, l'émotionnel et le corporel pour une
        transformation profonde et durable.
      </p>
      <p>
        L'accompagnement se fait dans le respect du rythme de chacun, en toute
        confidentialité, pour retrouver la paix intérieure, la joie et la
        liberté d'être soi.
      </p>
    </div>
    <div>
      <img
        src="/images/fleur.png"
        alt="Illustration fleur"
        className="accompagnement-fleur"
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.15)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.1)";
        }}
      />
    </div>
  </section>
);

export default AccompagnementSection;
