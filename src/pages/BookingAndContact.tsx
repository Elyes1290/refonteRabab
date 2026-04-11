import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../services/api";
import StripePayButton from "../components/StripePayButton.tsx";
import { AnimatedSection } from "../components/AnimatedSection";
import "../styles/Booking.css";
import "../styles/Contact.css";

const services = [
  {
    id: 1,
    titre: "Séance en visio",
    prix60: "100 CHF",
    prix90: "",
    type: "visio",
  },
  {
    id: 2,
    titre: "Séance en présentiel",
    prix60: "100 CHF",
    prix90: "",
    type: "cabinet",
  },
  {
    id: 3,
    titre: "Séance à domicile",
    prix60: "",
    prix90: "180 CHF",
    type: "domicile",
  },
];

const joursSemaine = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const moisNoms = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
};

const minutesToTime = (minutes: number): string => {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};

const DISPLAY_SLOT_STEP_MINUTES = 30;

const generateSlots = (start: string, end: string, intervalMinutes = DISPLAY_SLOT_STEP_MINUTES): string[] => {
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (startMin < 0 || endMin < 0 || endMin < startMin) return [];
  const step = intervalMinutes > 0 ? intervalMinutes : 30;
  const slots: string[] = [];
  for (let m = startMin; m <= endMin; m += step) {
    slots.push(minutesToTime(m));
  }
  return slots;
};

interface Reservation {
  heure_reservation: string;
  service_type: string;
  duration_minutes?: number;
}

interface WaitlistSession {
  id: number;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  price_label: string;
  capacity?: number | null;
  status: "draft" | "open" | "closed" | "archived";
}

interface AvailabilityRule {
  weekday: number;
  is_enabled: number;
  start_time: string;
  end_time: string;
  slot_interval_minutes: number;
}

interface VacationPeriod {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  is_active: number;
}

// Fonction helper pour formater une date en YYYY-MM-DD sans conversion UTC
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const BookingAndContact: React.FC = () => {
  const location = useLocation();


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success") === "1") {
      toast.success(
        "Paiement effectué avec succès ! Votre demande est enregistrée et en attente de confirmation."
      );
    }
  }, [location.search]);

  // États pour Booking
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHoraire, setSelectedHoraire] = useState<string | null>(null);
  const [form, setForm] = useState({
    nom: "",
    email: "",
    tel: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const [mois, setMois] = useState(today.getMonth());
  const [annee, setAnnee] = useState(today.getFullYear());
  const [selectedService, setSelectedService] = useState<
    "seance_online" | "seance_presentiel" | "seance_domicile" | null
  >(null);
  const allowsNinetyMinutes = selectedService === "seance_domicile";
  const allowsSixtyMinutes = selectedService !== "seance_domicile";
  const [selectedDuration, setSelectedDuration] = useState<60 | 90>(60);
  const [dayReservations, setDayReservations] = useState<Reservation[]>([]);
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>(
    []
  );
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  const [waitlistSessions, setWaitlistSessions] = useState<WaitlistSession[]>([]);
  const [selectedWaitlistSessionId, setSelectedWaitlistSessionId] = useState<
    number | null
  >(null);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistForm, setWaitlistForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    message: "",
  });

  // Génère les jours du mois
  const daysInMonth = getDaysInMonth(annee, mois);
  const firstDay = new Date(annee, mois, 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Navigation mois
  const prevMonth = () => {
    if (mois === 0) {
      setMois(11);
      setAnnee(annee - 1);
    } else {
      setMois(mois - 1);
    }
    setSelectedDate(null);
    setSelectedHoraire(null);
  };
  const nextMonth = () => {
    if (mois === 11) {
      setMois(0);
      setAnnee(annee + 1);
    } else {
      setMois(mois + 1);
    }
    setSelectedDate(null);
    setSelectedHoraire(null);
  };

  // Fonction pour récupérer les réservations existantes pour une date
  const fetchReservationsForDate = async (date: Date, serviceType: string) => {
    try {
      const dateStr = formatLocalDate(date);
      const url = `https://rababali.com/rabab/api/db_connect.php?action=get_reservations_for_date&date=${dateStr}&service=${serviceType}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const reservations = Array.isArray(data.data) ? data.data : [];
        setDayReservations(reservations);
      } else {
        setDayReservations([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des réservations:", error);
      setDayReservations([]);
    }
  };

  const fetchOpenWaitlistSessions = async () => {
    try {
      const response = await fetch(
        "https://rababali.com/rabab/api/db_connect.php?action=get_open_waitlist_sessions"
      );
      const data = await response.json();
      if (data.success) {
        const sessions = Array.isArray(data.data) ? data.data : [];
        setWaitlistSessions(sessions);
        setSelectedWaitlistSessionId((prev) => {
          if (prev && sessions.some((session: WaitlistSession) => session.id === prev)) {
            return prev;
          }
          return sessions.length > 0 ? sessions[0].id : null;
        });
      } else {
        setWaitlistSessions([]);
        setSelectedWaitlistSessionId(null);
      }
    } catch (error) {
      console.error("Erreur chargement liste d'attente:", error);
      setWaitlistSessions([]);
      setSelectedWaitlistSessionId(null);
    }
  };

  const fetchAvailabilityRules = async () => {
    try {
      const response = await fetch(
        "https://rababali.com/rabab/api/db_connect.php?action=get_availability_rules"
      );
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setAvailabilityRules(data.data);
      } else {
        setAvailabilityRules([]);
      }
    } catch (error) {
      console.error("Erreur chargement disponibilités:", error);
      setAvailabilityRules([]);
    }
  };

  const fetchVacationPeriods = async () => {
    try {
      const response = await fetch(
        "https://rababali.com/rabab/api/db_connect.php?action=get_vacation_periods"
      );
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setVacationPeriods(data.data);
      } else {
        setVacationPeriods([]);
      }
    } catch (error) {
      console.error("Erreur chargement vacances:", error);
      setVacationPeriods([]);
    }
  };

  // Charger les réservations quand la date ou le service change
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchReservationsForDate(selectedDate, selectedService);
    } else {
      setDayReservations([]);
    }
  }, [selectedDate, selectedService]);

  useEffect(() => {
    fetchOpenWaitlistSessions();
    fetchAvailabilityRules();
    fetchVacationPeriods();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("open_waitlist") !== "1") return;
    if (waitlistSessions.length === 0) return;

    const requestedSessionId = Number(params.get("session_id") || "");
    const targetSession =
      waitlistSessions.find((session) => session.id === requestedSessionId) ||
      waitlistSessions[0];

    if (!targetSession) return;

    setSelectedWaitlistSessionId(targetSession.id);
    setWaitlistForm({ nom: "", email: "", telephone: "", message: "" });
    setWaitlistModalOpen(true);
  }, [location.search, waitlistSessions]);

  const isDateInVacation = (date: Date): boolean => {
    const dateStr = formatLocalDate(date);
    return vacationPeriods.some((period) => {
      if (Number(period.is_active) !== 1) return false;
      return dateStr >= period.start_date && dateStr <= period.end_date;
    });
  };

  const nextWaitlistSession =
    waitlistSessions.length > 0 ? waitlistSessions[0] : null;

  const selectedWaitlistSession =
    waitlistSessions.find((session) => session.id === selectedWaitlistSessionId) ||
    nextWaitlistSession;

  // Créneaux du jour (dynamiques)
  const selectedDayRule =
    selectedDate
      ? availabilityRules.find((rule) => rule.weekday === selectedDate.getDay())
      : undefined;

  let horairesDispo: string[] = [];
  if (selectedDate) {
    if (selectedDayRule && Number(selectedDayRule.is_enabled) === 1) {
      const start = String(selectedDayRule.start_time).slice(0, 5);
      const end = String(selectedDayRule.end_time).slice(0, 5);
      horairesDispo = generateSlots(start, end, DISPLAY_SLOT_STEP_MINUTES);
      // Retirer les créneaux qui finiraient après l'heure de fermeture
      const endMin = toMinutes(end);
      horairesDispo = horairesDispo.filter((slot) => {
        const startMin = toMinutes(slot);
        return startMin >= 0 && startMin + selectedDuration <= endMin;
      });
    } else {
      horairesDispo = [];
    }
  }

  // Conflit si les intervalles [debut, fin+buffer] se chevauchent
  const isSlotBlockedByBuffer = (slot: string): boolean => {
    const candidateStart = toMinutes(slot);
    if (candidateStart < 0) return true;

    const BUFFER_MINUTES = Number(selectedDayRule?.slot_interval_minutes) || 30;
    const candidateEnd = candidateStart + selectedDuration + BUFFER_MINUTES;

    return dayReservations.some((reservation) => {
      const existingStart = toMinutes(reservation.heure_reservation.substring(0, 5));
      if (existingStart < 0) return false;
      const existingDuration = reservation.duration_minutes === 90 ? 90 : 60;
      const existingEnd = existingStart + existingDuration + BUFFER_MINUTES;

      return candidateStart < existingEnd && existingStart < candidateEnd;
    });
  };

  // Gestion formulaire Booking
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Ouvre le calendrier pour le service choisi
  const handleOpenModal = (
    serviceType: "seance_online" | "seance_presentiel" | "seance_domicile"
  ) => {
    setModalOpen(true);
    setSelectedService(serviceType);
    setSelectedDate(null);
    setSelectedHoraire(null);
    setSelectedDuration(serviceType === "seance_domicile" ? 90 : 60);
    setForm({ nom: "", email: "", tel: "", message: "" });
    setSubmitted(false);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDate(null);
    setSelectedHoraire(null);
    setSelectedDuration(60);
    setForm({ nom: "", email: "", tel: "", message: "" });
    setSubmitted(false);
  };

  const handleOpenWaitlistModal = () => {
    if (!nextWaitlistSession) return;
    setSelectedWaitlistSessionId((prev) => prev ?? nextWaitlistSession.id);
    setWaitlistForm({ nom: "", email: "", telephone: "", message: "" });
    setWaitlistModalOpen(true);
  };

  const handleCloseWaitlistModal = () => {
    setWaitlistModalOpen(false);
    setWaitlistSubmitting(false);
  };

  const handleSubmitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaitlistSession) return;
    setWaitlistSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("action", "join_waitlist");
      formData.append("session_id", String(selectedWaitlistSession.id));
      formData.append("nom", waitlistForm.nom);
      formData.append("email", waitlistForm.email);
      formData.append("telephone", waitlistForm.telephone);
      formData.append("message", waitlistForm.message);

      const response = await fetch("https://rababali.com/rabab/api/db_connect.php", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Vous êtes bien inscrit(e) sur la liste d'attente.");
        setWaitlistModalOpen(false);
        fetchOpenWaitlistSessions();
      } else {
        toast.error(data.message || "Impossible de rejoindre la liste d'attente");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const formatWaitlistDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div style={{ background: "#F2E8E1" }}>
      {/* ========== SECTION PRISE DE RENDEZ-VOUS ========== */}
      <section className="booking-page">
        {/* Titre principal */}
        <AnimatedSection animationType="fadeUp" delay={120}>
          <div className="booking-header">
            <h1 className="booking-title">Séance individuelle</h1>
            <p className="booking-description-cinzel">
              Un accompagnement personnalisé pour
              clarifier vos dynamiques invisibles,
              comprendre ce qui vous freine et
              avancer avec clarté et sérénité.
            </p>
            <p className="booking-description-cinzel">
              Réservez votre séance dès maintenant
              et commencez votre parcours de transformation.
            </p>
          </div>
        </AnimatedSection>

        {/* Services */}
        <AnimatedSection animationType="fadeUp" delay={220}>
          <div className="booking-services-container">
            {services.map((service) => (
              <div
                key={service.id}
                className="booking-service-card"
                style={{ position: "relative" }}
              >
                <div className="booking-service-content">
                  <h2 className="booking-service-title">{service.titre}</h2>
                </div>
                <div className="booking-service-footer">
                  <div className="booking-service-pricing-dual">
                    {service.type !== "domicile" && (
                      <div className="booking-service-price-option">
                        <div className="booking-service-duration">60 min</div>
                        <div className="booking-service-price">{service.prix60}</div>
                      </div>
                    )}
                    {service.type === "domicile" && (
                      <div className="booking-service-price-option">
                        <div className="booking-service-duration">90 min</div>
                        <div className="booking-service-price">{service.prix90}</div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      let serviceType: "seance_online" | "seance_presentiel" | "seance_domicile";
                      if (service.type === "visio") {
                        serviceType = "seance_online";
                      } else if (service.type === "cabinet") {
                        serviceType = "seance_presentiel";
                      } else {
                        serviceType = "seance_domicile";
                      }
                      handleOpenModal(serviceType);
                    }}
                    className="booking-service-button"
                  >
                    Réserver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Offre étudiant */}
        <AnimatedSection animationType="fadeUp" delay={280}>
          <div className="booking-student-card">
            <h2 className="booking-student-title">Tarif étudiant(e)</h2>
            <p className="booking-student-price">80 CHF</p>
            <p className="booking-student-text">
              Pour bénéficier du tarif étudiant, merci de contacter directement Rabab.
            </p>
            <p className="booking-student-text">
              Le règlement se fait en cash et la réservation est ensuite ajoutée manuellement depuis l'administration.
            </p>
            <a className="booking-student-contact-btn" href="/contact">
              Contacter Rabab
            </a>
          </div>
        </AnimatedSection>

        {/* Carte constellation familiale */}
        <AnimatedSection animationType="fadeUp" delay={320}>
          <div className="booking-constellation-card">
            <h2 className="booking-constellation-title">
              Journée de<br />Constellation Familiale
            </h2>
            <div className="booking-constellation-info">
              <div className="booking-constellation-time">
                {nextWaitlistSession
                  ? `${String(nextWaitlistSession.start_time || "").slice(0, 5)} à ${String(
                      nextWaitlistSession.end_time || ""
                    ).slice(0, 5)}`
                  : "10h à 16h"}
              </div>
              <div className="booking-constellation-price">
                {nextWaitlistSession?.price_label || "150 CHF"}
              </div>
            </div>
            <p className="booking-constellation-lieu">
              Lieu : {nextWaitlistSession?.location || "Grand-Lancy"}
            </p>
            <button
              className="booking-constellation-button"
              onClick={handleOpenWaitlistModal}
              disabled={!nextWaitlistSession}
              style={!nextWaitlistSession ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
            >
              {nextWaitlistSession ? "Rejoindre la liste" : "Liste bientôt ouverte"}
            </button>
          </div>
        </AnimatedSection>

        {/* Modal calendrier + formulaire */}
        {modalOpen && selectedService && (
          <div className="booking-modal-overlay">
            <div className="booking-modal-content">
              <button
                onClick={handleCloseModal}
                className="booking-modal-close"
              >
                &times;
              </button>
              <h2 className="booking-modal-title">
                Réserver une séance Vision 3D
              </h2>
              
              {/* Sélecteur de durée */}
              <div className="booking-duration-selector">
                {allowsSixtyMinutes && (
                  <button
                    onClick={() => {
                      setSelectedDuration(60);
                      setSelectedHoraire(null);
                    }}
                    className={`booking-duration-option ${
                      selectedDuration === 60 ? "selected" : ""
                    }`}
                  >
                    <div className="booking-duration-time">60 min</div>
                    <div className="booking-duration-price">100 CHF</div>
                  </button>
                )}
                {allowsNinetyMinutes && (
                  <button
                    onClick={() => {
                      setSelectedDuration(90);
                      setSelectedHoraire(null);
                    }}
                    className={`booking-duration-option ${
                      selectedDuration === 90 ? "selected" : ""
                    }`}
                  >
                    <div className="booking-duration-time">90 min</div>
                    <div className="booking-duration-price">180 CHF</div>
                  </button>
                )}
              </div>

              {/* Calendrier */}
              <div className="booking-calendar">
                <div className="booking-calendar-header">
                  <button onClick={prevMonth} className="booking-calendar-nav">
                    <span style={{ color: "white" }}>◄</span>
                  </button>
                  <span className="booking-calendar-month">
                    {moisNoms[mois]} {annee}
                  </span>
                  <button onClick={nextMonth} className="booking-calendar-nav">
                    <span style={{ color: "white" }}>►</span>
                  </button>
                </div>
                <div className="booking-calendar-grid">
                  {joursSemaine.map((j) => (
                    <div key={j} className="booking-calendar-day-header">
                      {j}
                    </div>
                  ))}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={"empty-" + i}></div>
                  ))}
                  {daysArray.map((day) => {
                    const date = new Date(annee, mois, day);
                    const todayDate = new Date();
                    todayDate.setHours(0, 0, 0, 0); // Reset time to compare only dates
                    date.setHours(0, 0, 0, 0);

                    // Sélectionnable si jour ouvert dans les règles + date non passée
                    const dayRule = availabilityRules.find(
                      (rule) => rule.weekday === date.getDay()
                    );
                    const isSelectable =
                      date >= todayDate &&
                      Boolean(dayRule && Number(dayRule.is_enabled) === 1) &&
                      !isDateInVacation(date);
                    const isSelected =
                      selectedDate &&
                      date.toDateString() === selectedDate.toDateString();

                    let dayClasses = "booking-calendar-day";
                    if (!isSelectable) dayClasses += " disabled";
                    else if (isSelected) dayClasses += " selected";
                    else dayClasses += " selectable";

                    return (
                      <button
                        key={day}
                        className={dayClasses}
                        disabled={!isSelectable}
                        onClick={() => isSelectable && setSelectedDate(date)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Créneaux horaires */}
              {selectedDate && (
                <div className="booking-time-slots">
                  <div className="booking-time-slots-title">
                    Sélectionnez un créneau horaire pour le{" "}
                    {selectedDate.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <div className="booking-time-slots-grid">
                    {horairesDispo
                      .filter((h) => !isSlotBlockedByBuffer(h))
                      .map((h) => (
                        <button
                          key={h}
                          className={`booking-time-slot ${
                            selectedHoraire === h ? "selected" : "available"
                          }`}
                          onClick={() => setSelectedHoraire(h)}
                        >
                          {h}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              {/* Formulaire de réservation */}
              {selectedDate && selectedHoraire && !submitted && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    setError(null);

                    try {
                      const availabilityResponse =
                        await apiService.checkAvailability(
                          formatLocalDate(selectedDate),
                          selectedHoraire,
                          selectedService,
                          selectedDuration
                        );
                      let isAvailable = false;
                      if ("available" in availabilityResponse) {
                        isAvailable = Boolean(
                          (availabilityResponse as Record<string, unknown>)
                            .available
                        );
                      } else if (
                        availabilityResponse.data &&
                        "available" in availabilityResponse.data
                      ) {
                        isAvailable = Boolean(
                          (availabilityResponse.data as Record<string, unknown>)
                            .available
                        );
                      }
                      if (!isAvailable) {
                        setError("Ce créneau n'est plus disponible");
                        setLoading(false);
                        return;
                      }
                      setSubmitted(true);
                    } catch (err) {
                      console.error("Erreur lors de la réservation:", err);
                      setError(
                        "Erreur lors de la vérification de la disponibilité. Veuillez réessayer."
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="booking-form"
                >
                  <input
                    name="nom"
                    type="text"
                    placeholder="Nom"
                    value={form.nom}
                    onChange={handleFormChange}
                    required
                    className="booking-form-input"
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleFormChange}
                    required
                    className="booking-form-input"
                  />
                  <input
                    name="tel"
                    type="tel"
                    placeholder="Téléphone"
                    value={form.tel}
                    onChange={handleFormChange}
                    required
                    className="booking-form-input"
                  />
                  <textarea
                    name="message"
                    placeholder="Message (optionnel)"
                    value={form.message}
                    onChange={handleFormChange}
                    className="booking-form-textarea"
                  />
                  {error && <div className="booking-form-error">{error}</div>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="booking-form-submit"
                  >
                    {loading
                      ? "Réservation en cours..."
                      : "Réserver ce créneau"}
                  </button>
                </form>
              )}
              {/* Confirmation */}
              {submitted && (
                <div className="booking-confirmation">
                  Merci, il ne vous reste plus qu'à procéder au paiement pour
                  valider votre réservation.
                  <br />
                  <div className="booking-confirmation-payment">
                    {form.nom &&
                      form.email &&
                      form.tel &&
                      selectedDate &&
                      selectedHoraire &&
                      selectedService &&
                      (() => {
                        // Calculer le montant selon le type et la durée
                        let amount = 0;
                        let description = "";
                        
                        if (selectedService === "seance_online") {
                          amount = 10000; // 100 CHF fixe (60 min)
                          description = "Séance Vision 3D en visio (60 min)";
                        } else if (selectedService === "seance_presentiel") {
                          amount = 10000; // 100 CHF fixe (60 min)
                          description = "Séance Vision 3D en cabinet (60 min)";
                        } else {
                          amount = selectedDuration === 60 ? 12000 : 18000; // 120 CHF ou 180 CHF
                          description = `Séance Vision 3D à domicile (${selectedDuration} min)`;
                        }

                        return (
                          <StripePayButton
                            amount={amount}
                            description={description}
                            reservation={{
                              nom: form.nom,
                              email: form.email,
                              tel: form.tel,
                              message: form.message,
                              date: formatLocalDate(selectedDate),
                              horaire: selectedHoraire,
                              service: selectedService,
                              duration_minutes: selectedDuration,
                            }}
                          />
                        );
                      })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {waitlistModalOpen && selectedWaitlistSession && (
          <div className="booking-waitlist-modal-overlay">
            <div className="booking-waitlist-modal-content">
              <button
                onClick={handleCloseWaitlistModal}
                className="booking-modal-close"
                type="button"
              >
                &times;
              </button>
              <h2 className="booking-modal-title">Rejoindre la liste d'attente</h2>
              <div className="booking-waitlist-session-picker">
                <label htmlFor="waitlist-session-select">Choisissez la date de séance</label>
                <select
                  id="waitlist-session-select"
                  className="booking-form-input"
                  value={selectedWaitlistSessionId ?? ""}
                  onChange={(e) => setSelectedWaitlistSessionId(Number(e.target.value))}
                >
                  {waitlistSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {formatWaitlistDate(session.session_date)} -{" "}
                      {String(session.start_time || "").slice(0, 5)} à{" "}
                      {String(session.end_time || "").slice(0, 5)} -{" "}
                      {session.location || "Grand-Lancy"}
                    </option>
                  ))}
                </select>
              </div>
              <p className="booking-waitlist-session-meta">
                {selectedWaitlistSession.title} - {formatWaitlistDate(selectedWaitlistSession.session_date)}
              </p>
              <form onSubmit={handleSubmitWaitlist} className="booking-form">
                <input
                  name="nom"
                  type="text"
                  placeholder="Nom"
                  value={waitlistForm.nom}
                  onChange={(e) =>
                    setWaitlistForm((prev) => ({ ...prev, nom: e.target.value }))
                  }
                  required
                  className="booking-form-input"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={waitlistForm.email}
                  onChange={(e) =>
                    setWaitlistForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  className="booking-form-input"
                />
                <input
                  name="telephone"
                  type="tel"
                  placeholder="Téléphone"
                  value={waitlistForm.telephone}
                  onChange={(e) =>
                    setWaitlistForm((prev) => ({ ...prev, telephone: e.target.value }))
                  }
                  required
                  className="booking-form-input"
                />
                <textarea
                  name="message"
                  placeholder="Message (optionnel)"
                  value={waitlistForm.message}
                  onChange={(e) =>
                    setWaitlistForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="booking-form-textarea"
                />
                <button
                  type="submit"
                  disabled={waitlistSubmitting}
                  className="booking-form-submit"
                >
                  {waitlistSubmitting ? "Envoi en cours..." : "Rejoindre la liste"}
                </button>
              </form>
            </div>
          </div>
        )}

      </section>
    </div>
  );
};

export default BookingAndContact;
