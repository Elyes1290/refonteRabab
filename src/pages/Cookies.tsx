import React from "react";

const Cookies: React.FC = () => (
  <div
    className="legal-page"
    style={{ maxWidth: 700, margin: "2rem auto", padding: "1rem" }}
  >
    <h1 style={{ color: "#4682B4" }}>Politique en matière de cookies</h1>
    <p style={{ color: "#111" }}>
      Ce site utilise des cookies afin d’améliorer votre expérience de
      navigation et d’analyser la fréquentation du site.
      <br />
      <br />
      <strong>Qu’est-ce qu’un cookie ?</strong>
      <br />
      Un cookie est un petit fichier texte déposé sur votre terminal lors de la
      visite d’un site. Il permet notamment de collecter des informations
      relatives à votre navigation.
      <br />
      <br />
      <strong>Types de cookies utilisés :</strong>
      <br />
      - Cookies strictement nécessaires au fonctionnement du site
      <br />
      - Cookies de mesure d’audience (Google Analytics ou équivalent)
      <br />
      <br />
      <strong>Gestion des cookies :</strong>
      <br />
      Vous pouvez à tout moment choisir de désactiver les cookies via les
      paramètres de votre navigateur. Le refus d’installation d’un cookie peut
      entraîner l’impossibilité d’accéder à certains services.
      <br />
      <br />
      <strong>Durée de conservation :</strong>
      <br />
      Les cookies sont conservés pour une durée maximale de 13 mois.
      <br />
      <br />
      <strong>Contact :</strong>
      <br />
      Pour toute question relative à la gestion des cookies, contactez-nous à
      rabab@rababali.com
    </p>
  </div>
);

export default Cookies;
