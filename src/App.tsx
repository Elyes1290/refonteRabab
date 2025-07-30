import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { FloatingParticles } from "./components/FloatingParticles";
import Home from "./pages/Home";
import About from "./pages/About";
import Vision3D from "./pages/Vision3D";
import Booking from "./pages/Booking";
import Events from "./pages/Events";
import Experiences from "./pages/Experiences";
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
  const hideFooter = location.pathname === "/contact";
  return (
    <>
      <FloatingParticles />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/vision3d" element={<Vision3D />} />
          <Route path="/rendez-vous" element={<Booking />} />
          <Route path="/evenements" element={<Events />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/contact" element={<Contact />} />
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
