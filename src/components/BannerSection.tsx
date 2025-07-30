import React from "react";
import { AnimatedText } from "./AnimatedText";

const BannerSection: React.FC = () => (
  <section className="banner-section" style={{ background: "#faf1e6" }}>
    <img
      src="/images/image4.jpeg"
      alt="Bannière accueil"
      className="floating shimmer"
      style={{ marginTop: 16 }}
    />
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        pointerEvents: "none",
      }}
    >
      <AnimatedText
        text="Votre monde intérieur"
        typewriter={true}
        delay={1000}
        speed={100}
        className="banner-title sparkle pulse-glow"
      />
      <a
        href="/vision3d"
        className="btn-magical zoom-hover subtle-bounce banner-btn"
        style={{
          display: "inline-block",
          fontWeight: 600,
          fontSize: 20,
          textDecoration: "none",
          pointerEvents: "auto",
          marginTop: 0,
        }}
      >
        ✨ Vers votre paix ✨
      </a>
    </div>
  </section>
);

export default BannerSection;
