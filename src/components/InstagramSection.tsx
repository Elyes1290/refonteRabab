import React from "react";
import "../styles/InstagramSection.css";

const InstagramSection: React.FC = () => (
  <section className="instagram-section">
    <h2>Suivez-moi sur Instagram</h2>
    <div className="instagram-gallery-row">
      {/* Flèche gauche */}
      <span className="instagram-arrow instagram-arrow-left">&#8592;</span>
      {/* Galerie d'images */}
      <div className="instagram-gallery">
        {[1, 2, 3].map((i) => (
          <a
            key={i}
            href="https://www.instagram.com/rabab_rit_a_la_vie"
            target="_blank"
            rel="noopener noreferrer"
            className="instagram-gallery-link"
          >
            <img src={`/images/insta${i}.jpg`} alt={`Post Instagram ${i}`} />
          </a>
        ))}
      </div>
      {/* Flèche droite */}
      <span className="instagram-arrow instagram-arrow-right">&#8594;</span>
    </div>
    <div className="instagram-footer-text">
      <span>Découvrez plus de partages sur&nbsp;</span>
      <a
        href="https://www.instagram.com/rabab_rit_a_la_vie"
        target="_blank"
        rel="noopener noreferrer"
        className="instagram-link"
      >
        Instagram
      </a>
    </div>
  </section>
);

export default InstagramSection;
