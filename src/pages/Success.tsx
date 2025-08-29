import React from "react";
import "../styles/Success.css";

const Success: React.FC = () => (
  <section className="success-page">
    <div className="success-container">
      <h1 className="success-title">🎉 Merci pour votre réservation !</h1>
      <p className="success-message">
        Votre paiement a bien été reçu.
        <br />
        Votre créneau est désormais réservé et validé.
      </p>
      <p className="success-details">
        Vous recevrez un email de confirmation très prochainement.
        <br />
        Pour toute question, contactez-nous au <b>+41 77 223 30 30</b> ou par
        mail à <b>rabab@rababali.com</b>.
      </p>
      <a href="/" className="success-home-link">
        Retour à la Vision 3D
      </a>
    </div>
  </section>
);

export default Success;
