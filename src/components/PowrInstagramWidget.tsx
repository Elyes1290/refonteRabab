import React, { useEffect, useRef } from "react";
import "../styles/PowrInstagramWidget.css";

interface PowrInstagramWidgetProps {
  powrId?: string; // ID du widget POWR existant (si récupéré de Wix)
  fallbackToDemo?: boolean;
}

const PowrInstagramWidget: React.FC<PowrInstagramWidgetProps> = ({
  powrId,
  fallbackToDemo = true,
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Éviter les doublons - vérifier si le widget existe déjà
    if (widgetRef.current && widgetRef.current.children.length > 0) {
      return;
    }

    // Charger le script POWR si pas déjà présent
    const loadPowrScript = () => {
      return new Promise<void>((resolve) => {
        if (document.getElementById("powr-script")) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.id = "powr-script";
        script.src = "https://www.powr.io/powr.js";
        script.async = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    // Si on a un ID POWR spécifique
    if (powrId && widgetRef.current) {
      loadPowrScript().then(() => {
        // Double vérification avant création
        if (widgetRef.current && widgetRef.current.children.length === 0) {
          const powrElement = document.createElement("div");
          powrElement.className = "powr-social-feed";
          powrElement.id = powrId;
          widgetRef.current.appendChild(powrElement);
        }
      });
    }
    // Sinon, créer un nouveau widget par défaut
    else if (fallbackToDemo && widgetRef.current) {
      loadPowrScript().then(() => {
        if (widgetRef.current && widgetRef.current.children.length === 0) {
          const powrElement = document.createElement("div");
          powrElement.className = "powr-social-feed";
          powrElement.id = "new-powr-widget";
          widgetRef.current.appendChild(powrElement);
        }
      });
    }

    // Nettoyage robuste
    return () => {
      if (widgetRef.current) {
        // Supprimer tous les widgets POWR
        const powrElements =
          widgetRef.current.querySelectorAll(".powr-social-feed");
        powrElements.forEach((el) => el.remove());
      }
    };
  }, [powrId, fallbackToDemo]);

  return (
    <div className="powr-instagram-widget">
      <div className="powr-header">
        <h3 className="powr-title">📸 Suivez-moi sur Instagram</h3>
        <p className="powr-subtitle">
          Découvrez mes derniers contenus et conseils bien-être
        </p>
      </div>

      {/* Container pour le widget POWR */}
      <div ref={widgetRef} className="powr-widget-container">
        {!powrId && !fallbackToDemo && (
          <div className="powr-setup-info">
            <h4>Configuration POWR.io nécessaire</h4>
            <p>Pour afficher votre feed Instagram :</p>
            <ol>
              <li>
                Créez un compte gratuit sur{" "}
                <a
                  href="https://www.powr.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  POWR.io
                </a>
              </li>
              <li>Configurez votre Social Feed Instagram</li>
              <li>Récupérez l'ID du widget</li>
              <li>Contactez le développeur pour l'intégration</li>
            </ol>
          </div>
        )}
      </div>

      <div className="powr-footer">
        <a
          href="https://www.instagram.com/rabab_rit_a_la_vie"
          target="_blank"
          rel="noopener noreferrer"
          className="powr-follow-btn"
        >
          Suivre @rabab_rit_a_la_vie
        </a>
      </div>
    </div>
  );
};

export default PowrInstagramWidget;
