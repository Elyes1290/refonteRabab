import React from "react";
import BannerSection from "../components/BannerSection";
import PresentationSection from "../components/PresentationSection";
import AccompagnementSection from "../components/AccompagnementSection";
import Vision3DSection from "../components/Vision3DSection";
import RendezVousSection from "../components/RendezVousSection";
import EvenementsSection from "../components/EvenementsSection";
import TemoignagesSection from "../components/TemoignagesSection";
import PowrInstagramWidget from "../components/PowrInstagramWidget";
import { AnimatedSection } from "../components/AnimatedSection";
import { WaveTransition } from "../components/WaveTransition";

const Home: React.FC = () => {
  return (
    <>
      <AnimatedSection animationType="fadeUp" delay={200}>
        <BannerSection />
      </AnimatedSection>

      <WaveTransition color="#87CEEB" height="80px" />

      <AnimatedSection animationType="fadeLeft" delay={300}>
        <PresentationSection />
      </AnimatedSection>

      <WaveTransition color="#F5F5DC" height="60px" flip />

      <AnimatedSection animationType="scale" delay={400}>
        <AccompagnementSection />
      </AnimatedSection>

      <WaveTransition color="#4682B4" height="100px" />

      <AnimatedSection animationType="fadeRight" delay={500}>
        <Vision3DSection />
      </AnimatedSection>

      <WaveTransition color="#FFF8DC" height="70px" flip />

      <AnimatedSection animationType="fadeUp" delay={600}>
        <RendezVousSection />
      </AnimatedSection>

      <WaveTransition color="#87CEEB" height="90px" />

      <EvenementsSection />

      <WaveTransition color="#F5F5DC" height="80px" flip />

      <AnimatedSection animationType="scale" delay={800}>
        <TemoignagesSection />
      </AnimatedSection>

      <WaveTransition color="#4682B4" height="60px" />

      <AnimatedSection animationType="fadeUp" delay={900}>
        <PowrInstagramWidget powrId="557e4700_1753715162" />
      </AnimatedSection>
    </>
  );
};

export default Home;
