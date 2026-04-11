import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { FloatingParticles } from "./components/FloatingParticles";
import LogoIntro from "./components/LogoIntro";
import Home from "./pages/Home";
import Vision3D from "./pages/Vision3D";
import Approche from "./pages/Approche";
import BookingAndContact from "./pages/BookingAndContact";
import EventsAndExperiences from "./pages/EventsAndExperiences";
import Temoignages from "./pages/Temoignages";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import MentionsLegales from "./pages/MentionsLegales";
import Cookies from "./pages/Cookies";
import Confidentialite from "./pages/Confidentialite";
import ConditionsUtilisation from "./pages/ConditionsUtilisation";
import Success from "./pages/Success";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/animations.css";
// import logo from "./assets/logo.png"; // supprimé car on utilise le dossier public

// Ajout de la police Sacramento dans le head
if (
  typeof document !== "undefined" &&
  !document.getElementById("sacramento-font")
) {
  const link = document.createElement("link");
  link.id = "sacramento-font";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Sacramento&display=swap";
  document.head.appendChild(link);
}

function AppContent() {
  const location = useLocation();
  const hideFooter = false;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <>
      <LogoIntro />
      <FloatingParticles />
      <Header />
      <main className="app-main-with-header">
        <Routes>
          <Route path="/" element={<Vision3D />} />
          <Route path="/a-propos" element={<Home />} />
          {/* Compatibilité ancien lien */}
          <Route path="/accueil" element={<Home />} />
          <Route path="/vision3d" element={<Vision3D />} />
          <Route path="/approche" element={<Approche />} />
          <Route path="/rendez-vous" element={<BookingAndContact />} />
          {/* Compatibilité ancien lien */}
          <Route
            path="/rendez-vous-et-contact"
            element={<BookingAndContact />}
          />
          <Route path="/contact" element={<Contact />} />
          <Route path="/evenements" element={<EventsAndExperiences />} />
          {/* Compatibilité ancien lien */}
          <Route
            path="/evenements-et-avis"
            element={<EventsAndExperiences />}
          />
          <Route path="/temoignages" element={<Temoignages />} />
          <Route path="/experiences" element={<Temoignages />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route
            path="/conditions-utilisation"
            element={<ConditionsUtilisation />}
          />
          <Route path="/success" element={<Success />} />
        </Routes>
      </main>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {!hideFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
