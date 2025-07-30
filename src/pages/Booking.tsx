import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../services/api";
import StripePayButton from "../components/StripePayButton.tsx";
import "../styles/Booking.css";

const services = [
  {
    id: 1,
    titre: "Mon monde intérieur",
    sousTitre: "Vision 3D - séance - EN LIGNE",
    description: "Disponible en ligne",
    details: "Séance en ligne",
    duree: "45 min",
    prix: "100 CHF",
    type: "en ligne",
    couleur: "var(--color-primary)",
  },
  {
    id: 2,
    titre: "Son monde intérieur, ses souvenirs et ses traumatismes",
    sousTitre: "Vision 3D Service de Coaching Personnel",
    description: "Séance en présentiel avec déplacement",
    details: "Séance en présentiel",
    duree: "1 h",
    prix: "120 CHF",
    type: "présentiel",
    couleur: "var(--color-primary-dark)",
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
function isWednesday(date: Date) {
  return date.getDay() === 3;
}
function isSaturday(date: Date) {
  return date.getDay() === 6;
}
const horairesMercredi = ["09:00"];
const horairesSamedi = ["09:00", "10:00", "11:00", "12:00", "13:00"];

interface Reservation {
  heure_reservation: string;
  service_type: string;
}

// Fonction helper pour formater une date en YYYY-MM-DD sans conversion UTC
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Booking: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success") === "1") {
      toast.success(
        "Paiement effectué avec succès ! Votre rendez-vous est confirmé."
      );
    }
  }, [location]);
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
  // Ajout d'un état pour le type de service sélectionné
  const [selectedService, setSelectedService] = useState<
    "seance_online" | "seance_presentiel" | null
  >(null);

  // État pour les créneaux déjà réservés
  const [reservedSlots, setReservedSlots] = useState<string[]>([]);

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
        const reservedHours = data.data.map((res: Reservation) => {
          // Normaliser le format d'heure : "09:00:00" -> "09:00"
          return res.heure_reservation.substring(0, 5);
        });
        setReservedSlots(reservedHours);
      } else {
        setReservedSlots([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des réservations:", error);
      setReservedSlots([]);
    }
  };

  // Charger les réservations quand la date ou le service change
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchReservationsForDate(selectedDate, selectedService);
    } else {
      setReservedSlots([]);
    }
  }, [selectedDate, selectedService]);

  // Créneaux disponibles pour le jour sélectionné
  let horairesDispo: string[] = [];
  if (selectedDate) {
    if (isWednesday(selectedDate)) horairesDispo = horairesMercredi;
    if (isSaturday(selectedDate)) horairesDispo = horairesSamedi;
  }

  // Gestion formulaire
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  // SUPPRIMER handleFormSubmit (plus utilisée)

  // Ouvre le calendrier pour le service choisi
  const handleOpenModal = (
    serviceType: "seance_online" | "seance_presentiel"
  ) => {
    setModalOpen(true);
    setSelectedService(serviceType);
    setSelectedDate(null);
    setSelectedHoraire(null);
    setForm({ nom: "", email: "", tel: "", message: "" });
    setSubmitted(false);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDate(null);
    setSelectedHoraire(null);
    setForm({ nom: "", email: "", tel: "", message: "" });
    setSubmitted(false);
  };

  return (
    <section className="booking-page">
      {/* Titre principal */}
      <div className="booking-header">
        <h1 className="booking-title">Séance en ligne ou en présentiel</h1>
        <div className="booking-description">
          Choisissez la formule qui vous convient le mieux pour votre
          accompagnement personnalisé
        </div>
      </div>

      {/* Services */}
      <div className="booking-services-container">
        {services.map((service) => (
          <div
            key={service.id}
            className={`booking-service-card ${
              service.type === "en ligne" ? "online" : "presentiel"
            }`}
          >
            {/* Badge type de séance */}
            <div
              className={`booking-service-badge ${
                service.type === "en ligne" ? "online" : "presentiel"
              }`}
            >
              {service.type}
            </div>
            {/* Contenu du service */}
            <div className="booking-service-content">
              <h2 className="booking-service-title">{service.titre}</h2>
              <div
                className={`booking-service-subtitle ${
                  service.type === "en ligne" ? "online" : "presentiel"
                }`}
              >
                {service.sousTitre}
              </div>
              <div className="booking-service-description">
                {service.description}
              </div>
              <div className="booking-service-details">{service.details}</div>
            </div>
            {/* Durée et bouton */}
            <div className="booking-service-footer">
              <div className="booking-service-pricing">
                <div
                  className={`booking-service-duration ${
                    service.type === "en ligne" ? "online" : "presentiel"
                  }`}
                >
                  {service.duree}
                </div>
                <div className="booking-service-price">{service.prix}</div>
              </div>
              <button
                onClick={() =>
                  handleOpenModal(
                    service.type === "en ligne"
                      ? "seance_online"
                      : "seance_presentiel"
                  )
                }
                className={`booking-service-button ${
                  service.type === "en ligne" ? "online" : "presentiel"
                }`}
              >
                Réserver
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal calendrier + formulaire pour la séance en ligne */}
      {modalOpen && selectedService && (
        <div className="booking-modal-overlay">
          <div className="booking-modal-content">
            <button onClick={handleCloseModal} className="booking-modal-close">
              &times;
            </button>
            <h2 className="booking-modal-title">
              Réserver une séance Vision 3D en ligne
            </h2>
            {/* Calendrier */}
            <div className="booking-calendar">
              <div className="booking-calendar-header">
                <button onClick={prevMonth} className="booking-calendar-nav">
                  &lt;
                </button>
                <span className="booking-calendar-month">
                  {moisNoms[mois]} {annee}
                </span>
                <button onClick={nextMonth} className="booking-calendar-nav">
                  &gt;
                </button>
              </div>
              <div className="booking-calendar-grid">
                {joursSemaine.map((j) => (
                  <div key={j} className="booking-calendar-day-header">
                    {j}
                  </div>
                ))}
                {/* Jours vides avant le 1er */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={"empty-" + i}></div>
                ))}
                {daysArray.map((day) => {
                  const date = new Date(annee, mois, day);
                  const isSelectable = isWednesday(date) || isSaturday(date);
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
                  {horairesDispo.map((h) => {
                    const isReserved = reservedSlots.includes(h);
                    return (
                      <button
                        key={h}
                        className={`booking-time-slot ${
                          selectedHoraire === h
                            ? "selected"
                            : isReserved
                            ? "reserved"
                            : "available"
                        }`}
                        onClick={() => !isReserved && setSelectedHoraire(h)}
                        disabled={isReserved}
                        title={isReserved ? "Créneau déjà réservé" : ""}
                      >
                        {h}
                      </button>
                    );
                  })}
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

                  // Vérifier la disponibilité
                  try {
                    const availabilityResponse =
                      await apiService.checkAvailability(
                        formatLocalDate(selectedDate),
                        selectedHoraire,
                        selectedService
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
                    // Ne crée plus la réservation ici !
                    setSubmitted(true); // Affiche le bouton StripePayButton
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
                  {loading ? "Réservation en cours..." : "Réserver ce créneau"}
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
                    selectedService && (
                      <StripePayButton
                        amount={
                          selectedService === "seance_online" ? 10000 : 12000
                        }
                        description={
                          selectedService === "seance_online"
                            ? "Séance Vision 3D en ligne"
                            : "Séance Vision 3D en présentiel"
                        }
                        reservation={{
                          nom: form.nom,
                          email: form.email,
                          tel: form.tel,
                          message: form.message,
                          date: formatLocalDate(selectedDate),
                          horaire: selectedHoraire,
                          service: selectedService,
                        }}
                      />
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Informations supplémentaires */}
      <div className="booking-additional-info">
        <div className="booking-additional-info-content">
          <p>
            Chaque séance est adaptée à vos besoins spécifiques. N'hésitez pas à
            me contacter directement pour toute question.
          </p>
          <p>
            <strong>Tél : +41 77 223 30 30</strong>
            <br />
            <strong>Email : rabab@rababali.com</strong>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Booking;
