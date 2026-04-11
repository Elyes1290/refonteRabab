import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/Admin.css";
import EventsTab from "../components/admin/EventsTab";
import AppointmentsTab from "../components/admin/AppointmentsTab";
import ExperiencesTab from "../components/admin/ExperiencesTab";
import WaitlistTab from "../components/admin/WaitlistTab";
import AvailabilityTab from "../components/admin/AvailabilityTab";

// Utiliser toujours rababali.com (API configurée avec CORS)
const API_BASE = "https://www.rababali.com";

// Interfaces
interface EventForm {
  titre: string;
  description: string;
  date_event: string;
  date_fin: string;
  prix: string;
  devise: string;
  image: File | null;
  url_inscription?: string;
  video_urls?: string[];
  is_promotion?: number;
  prix_promo?: string;
}

interface EventItem {
  id: number;
  titre: string;
  description: string;
  date_event: string;
  date_fin: string;
  prix: string;
  devise: string;
  image_url?: string;
  type?: string;
  modele?: string;
  sous_titre?: string;
  lieu?: string;
  texte?: string;
  url_inscription?: string;
  video_urls?: string[];
  is_promotion?: number;
  prix_promo?: string;
}

interface Experience {
  id: number;
  nom: string;
  titre: string;
  message: string;
  note: number;
  date_creation: string;
  statut: string;
}

interface Appointment {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  service_type: string;
  date_reservation: string;
  heure_reservation: string;
  montant: number;
  notes: string;
  statut: string;
  created_at: string;
}

// L'interface FlyerData est maintenant définie dans EventsTab.tsx

const Admin: React.FC = () => {
  // États d'authentification
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginAttempting, setLoginAttempting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // États des onglets
  const [activeTab, setActiveTab] = useState<
    "events" | "experiences" | "appointments" | "waitlist"
  >("events");

  // États pour les événements
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventType, setEventType] = useState<"event" | "flyer">("event");
  const [submitting, setSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // États pour les formulaires d'événements
  const [form, setForm] = useState<EventForm>({
    titre: "",
    description: "",
    date_event: "",
    date_fin: "",
    prix: "",
    devise: "€",
    image: null,
    url_inscription: "",
    video_urls: [""],
    is_promotion: 0,
    prix_promo: "",
  });

  // États pour les flyers
  const [showFlyerModels, setShowFlyerModels] = useState(false);
  const [selectedFlyerModel, setSelectedFlyerModel] = useState<number | null>(
    null
  );

  // Pour le flyer Cercles
  const [flyerCircles, setFlyerCircles] = useState({
    titre: "",
    sousTitre: "",
    date: "",
    date_fin: "",
    prix: "",
    devise: "€",
    lieu: "",
    texte: "",
    image1: null as File | null,
    image2: null as File | null,
    image3: null as File | null,
    image1Url: "",
    image2Url: "",
    image3Url: "",
  });

  // Pour le flyer Carrés/Losanges (seulement 2 images)
  const [flyerSquares, setFlyerSquares] = useState({
    titre: "",
    sousTitre: "",
    date: "",
    date_fin: "",
    prix: "",
    devise: "€",
    lieu: "",
    texte: "",
    image1: null as File | null,
    image2: null as File | null,
    image3: null as File | null,
    image1Url: "",
    image2Url: "",
    image3Url: "",
  });

  // États pour les expériences
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loadingExperiences, setLoadingExperiences] = useState(true);

  // États pour les rendez-vous
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // États pour les sections collapsibles du tableau de bord
  const [statsExpanded, setStatsExpanded] = useState({
    revenus: true,
    activite: false,
    services: false,
  });
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [appointmentForm, setAppointmentForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    service_type: "seance_online",
    date_reservation: "",
    heure_reservation: "",
    montant: "",
    notes: "",
    statut: "en_attente",
  });

  // Les refs pour les flyers seront ajoutées quand nécessaire

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const savedAuth = localStorage.getItem("admin_auth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Charger les données quand authentifié
  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
      fetchExperiences();
      fetchAppointments();
    }
  }, [isAuthenticated]);

  // Fonctions d'authentification
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginAttempting(true);

    try {
      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `action=admin_login&username=${encodeURIComponent(
          usernameInput
        )}&password=${encodeURIComponent(passwordInput)}`,
      });

      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem("admin_auth", "true");
        toast.success("Connexion réussie !");
      } else {
        toast.error("Identifiants incorrects");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      toast.error("Erreur de connexion au serveur");
    } finally {
      setLoginAttempting(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_auth");
    setUsernameInput("");
    setPasswordInput("");
  };

  // Fonctions de chargement des données
  const fetchEvents = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/rabab/api/db_connect.php?action=get_events`
      );
      const data = await response.json();
      if (data.success) {
        setEvents(data.data);
      } else {
        toast.error("Erreur lors du chargement des événements");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion");
    }
  };

  const fetchExperiences = async () => {
    try {
      setLoadingExperiences(true);
      const response = await fetch(
        `${API_BASE}/rabab/api/db_connect.php?action=get_experiences&all=1`
      );
      const data = await response.json();
      if (data.success) {
        setExperiences(data.data);
      } else {
        toast.error("Erreur lors du chargement des expériences");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion");
    } finally {
      setLoadingExperiences(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const response = await fetch(
        `${API_BASE}/rabab/api/db_connect.php?action=get_reservations`
      );
      const data = await response.json();
      if (data.success) {
        setAppointments(data.data);
      } else {
        toast.error("Erreur lors du chargement des rendez-vous");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion");
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Les fonctions pour les flyers seront ajoutées quand nécessaire

  // Fonctions pour les rendez-vous
  const handleAddAppointment = () => {
    setEditingAppointment(null);
    setAppointmentForm({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      service_type: "seance_online",
      date_reservation: "",
      heure_reservation: "",
      montant: "",
      notes: "",
      statut: "en_attente",
    });
    setShowAppointmentModal(true);
  };

  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const now = new Date();
    const reportDate = now.toLocaleDateString("fr-FR");
    const reportTime = now.toLocaleTimeString("fr-FR");

    const totalRevenues = appointments
      .filter((appt) => appt.statut === "confirmee")
      .reduce((total, appt) => total + (Number(appt.montant) || 0), 0);

    const pendingRevenues = appointments
      .filter((appt) => appt.statut === "en_attente")
      .reduce((total, appt) => total + (Number(appt.montant) || 0), 0);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapport Comptable - ${reportDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; background-color: #e7f3ff; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Rapport Comptable</h1>
            <p>Généré le ${reportDate} à ${reportTime}</p>
          </div>

          <div class="stats">
            <div class="stat-box">
              <h3>Revenus Encaissés</h3>
              <p style="font-size: 24px; color: green;">${totalRevenues.toFixed(
                2
              )} CHF</p>
              </div>
            <div class="stat-box">
              <h3>En Attente</h3>
              <p style="font-size: 24px; color: orange;">${pendingRevenues.toFixed(
                2
              )} CHF</p>
              </div>
            <div class="stat-box">
              <h3>Total Rendez-vous</h3>
              <p style="font-size: 24px;">${appointments.length}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Service</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${appointments
                .map(
                  (appt) => `
                  <tr>
                  <td>${new Date(appt.date_reservation).toLocaleDateString(
                    "fr-FR"
                  )}</td>
                  <td>${appt.prenom} ${appt.nom}</td>
                  <td>${appt.service_type.replace("_", " ")}</td>
                  <td>${appt.montant} CHF</td>
                  <td>${appt.statut}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Heure",
      "Nom",
      "Prénom",
      "Email",
      "Téléphone",
      "Service",
      "Montant (CHF)",
      "Statut",
      "Notes",
    ];

    const csvData = appointments
      .sort(
        (a, b) =>
          new Date(a.date_reservation).getTime() -
          new Date(b.date_reservation).getTime()
      )
      .map((appt) => [
        new Date(appt.date_reservation).toLocaleDateString("fr-FR"),
        appt.heure_reservation,
        `"${appt.nom}"`,
        `"${appt.prenom}"`,
        appt.email,
        appt.telephone,
        appt.service_type === "seance_online" ? "En ligne" : "Présentiel",
        Number(appt.montant).toFixed(2),
        appt.statut === "confirmee"
          ? "Payé"
          : appt.statut === "en_attente"
          ? "En attente"
          : appt.statut === "annulee"
          ? "Annulé"
          : appt.statut,
        `"${appt.notes || ""}"`,
      ]);

    // Ajouter les totaux à la fin
    const totalPaid = appointments
      .filter((appt) => appt.statut === "confirmee")
      .reduce((total, appt) => total + (Number(appt.montant) || 0), 0);
    const totalPending = appointments
      .filter((appt) => appt.statut === "en_attente")
      .reduce((total, appt) => total + (Number(appt.montant) || 0), 0);

    csvData.push(
      ["", "", "", "", "", "", "", "", "", ""],
      ["TOTAUX", "", "", "", "", "", "", "", "", ""],
      [
        "Total Encaissé",
        "",
        "",
        "",
        "",
        "",
        "",
        totalPaid.toFixed(2),
        "CHF",
        "",
      ],
      [
        "Total En Attente",
        "",
        "",
        "",
        "",
        "",
        "",
        totalPending.toFixed(2),
        "CHF",
        "",
      ],
      [
        "Total Potentiel",
        "",
        "",
        "",
        "",
        "",
        "",
        (totalPaid + totalPending).toFixed(2),
        "CHF",
        "",
      ]
    );

    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");

    const BOM = "\uFEFF"; // Pour Excel
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `rendez-vous-comptabilite-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Interface de connexion
  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F2E8E1",
          padding: "1rem",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "2.5rem",
            borderRadius: "1rem",
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            width: "100%",
            maxWidth: "400px",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              color: "#4682B4",
              marginBottom: "2rem",
              fontSize: "1.8rem",
              fontWeight: "600",
            }}
          >
            🔐 Administration
          </h1>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "600",
                  color: "#333",
                  fontSize: "0.9rem",
                }}
              >
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  border: "2px solid #e1e5e9",
                  borderRadius: "0.75rem",
                  fontSize: "1rem",
                  transition: "border-color 0.2s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) =>
                  ((e.target as HTMLInputElement).style.borderColor = "#4682B4")
                }
                onBlur={(e) =>
                  ((e.target as HTMLInputElement).style.borderColor = "#e1e5e9")
                }
              />
            </div>
            <div style={{ marginBottom: "2rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "600",
                  color: "#333",
                  fontSize: "0.9rem",
                }}
              >
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    paddingRight: "3rem",
                    border: "2px solid #e1e5e9",
                    borderRadius: "0.75rem",
                    fontSize: "1rem",
                    transition: "border-color 0.2s ease",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) =>
                    ((e.target as HTMLInputElement).style.borderColor =
                      "#4682B4")
                  }
                  onBlur={(e) =>
                    ((e.target as HTMLInputElement).style.borderColor =
                      "#e1e5e9")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    color: "#666",
                    padding: "0.25rem",
                    borderRadius: "0.25rem",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLButtonElement).style.backgroundColor =
                      "#f0f0f0")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLButtonElement).style.backgroundColor =
                      "transparent")
                  }
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loginAttempting}
              style={{
                width: "100%",
                padding: "0.875rem",
                background: "linear-gradient(135deg, #4682B4 0%, #5a9bd4 100%)",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loginAttempting ? "not-allowed" : "pointer",
                opacity: loginAttempting ? 0.7 : 1,
                transition: "all 0.2s ease",
                boxShadow: "0 4px 15px rgba(70, 130, 180, 0.3)",
              }}
              onMouseEnter={(e) =>
                !loginAttempting &&
                (((e.target as HTMLButtonElement).style.transform =
                  "translateY(-2px)"),
                ((e.target as HTMLButtonElement).style.boxShadow =
                  "0 6px 20px rgba(70, 130, 180, 0.4)"))
              }
              onMouseLeave={(e) =>
                !loginAttempting &&
                (((e.target as HTMLButtonElement).style.transform =
                  "translateY(0)"),
                ((e.target as HTMLButtonElement).style.boxShadow =
                  "0 4px 15px rgba(70, 130, 180, 0.3)"))
              }
            >
              {loginAttempting ? "🔄 Connexion..." : "🚀 Se connecter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Interface principale d'administration
  return (
    <div className="admin-container">
      <div className="admin-logout-row">
        <button onClick={handleLogout} className="admin-logout-btn">
          Déconnexion
        </button>
      </div>
      <h1 className="admin-title">
        🛠️ Administration - Gestion{" "}
        {activeTab === "events"
          ? "des événements"
          : activeTab === "experiences"
          ? "des témoignages/avis"
          : activeTab === "waitlist"
          ? "de la liste d'attente"
          : "des rendez-vous"}
      </h1>

      {/* Onglets de navigation */}
      <div className="admin-tabs">
        <button
          onClick={() => setActiveTab("events")}
          className={`admin-tab-btn ${activeTab === "events" ? "active" : ""}`}
        >
          Événements
        </button>
        <button
          onClick={() => setActiveTab("experiences")}
          className={`admin-tab-btn ${activeTab === "experiences" ? "active" : ""}`}
        >
          Témoignages
        </button>
        <button
          onClick={() => setActiveTab("appointments")}
          className={`admin-tab-btn ${activeTab === "appointments" ? "active" : ""}`}
        >
          Rendez-vous
        </button>
        <button
          onClick={() => setActiveTab("waitlist")}
          className={`admin-tab-btn ${activeTab === "waitlist" ? "active" : ""}`}
        >
          ⏳ Liste d'attente
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="admin-content">
        {activeTab === "events" && (
          <EventsTab
            events={events}
            eventType={eventType}
            setEventType={setEventType}
            form={form}
            setForm={setForm}
            submitting={submitting}
            setSubmitting={setSubmitting}
            editingEvent={editingEvent}
            setEditingEvent={setEditingEvent}
            onRefreshEvents={fetchEvents}
            API_BASE={API_BASE}
            showFlyerModels={showFlyerModels}
            setShowFlyerModels={setShowFlyerModels}
            selectedFlyerModel={selectedFlyerModel}
            setSelectedFlyerModel={setSelectedFlyerModel}
            flyerCircles={flyerCircles}
            setFlyerCircles={setFlyerCircles}
            flyerSquares={flyerSquares}
            setFlyerSquares={setFlyerSquares}
          />
        )}

        {activeTab === "appointments" && (
          <>
            <AppointmentsTab
              appointments={appointments}
              loadingAppointments={loadingAppointments}
              showAppointmentModal={showAppointmentModal}
              setShowAppointmentModal={setShowAppointmentModal}
              editingAppointment={editingAppointment}
              setEditingAppointment={setEditingAppointment}
              appointmentForm={appointmentForm}
              setAppointmentForm={setAppointmentForm}
              onRefreshAppointments={fetchAppointments}
              API_BASE={API_BASE}
              statsExpanded={statsExpanded}
              setStatsExpanded={setStatsExpanded}
              onAddAppointment={handleAddAppointment}
              onPrintReport={handlePrintReport}
              onExportCSV={handleExportCSV}
            />
            <AvailabilityTab API_BASE={API_BASE} />
          </>
        )}

        {activeTab === "experiences" && (
          <ExperiencesTab
            experiences={experiences}
            loadingExperiences={loadingExperiences}
            onRefreshExperiences={fetchExperiences}
            API_BASE={API_BASE}
          />
        )}

        {activeTab === "waitlist" && <WaitlistTab API_BASE={API_BASE} />}
      </div>
    </div>
  );
};

export default Admin;
