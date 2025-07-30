import React from "react";

const RendezVousSection: React.FC = () => (
  <section className="rendezvous-section" style={{ background: "#faf1e6" }}>
    <h2>Prendre rendez-vous</h2>
    <p>
      Envie d'avancer sur ton chemin ? Réserve ta séance d'accompagnement en
      toute simplicité.
    </p>
    <a href="/rendez-vous" className="rendezvous-btn">
      Prendre rendez-vous
    </a>
  </section>
);

export default RendezVousSection;
