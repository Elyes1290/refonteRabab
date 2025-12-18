import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../services/api";
import StripePayButton from "../components/StripePayButton.tsx";
import "../styles/Booking.css";
import "../styles/Contact.css";

const services = [
  {
    id: 1,
    titre: "Mon monde intérieur",
    sousTitre: "Estime de soi - Constellation - EN LIGNE",
    description: "Disponible en ligne",
    details: "Séance en ligne",
    duree: "60 min",
    prix: "100 CHF",
    type: "en ligne",
    couleur: "#5c7671",
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
function isSunday(date: Date) {
  return date.getDay() === 0;
}
function isWeekday(date: Date) {
  const day = date.getDay();
  // Lundi=1, Mardi=2, Jeudi=4, Vendredi=5
  return day === 1 || day === 2 || day === 4 || day === 5;
}

// Nouveaux horaires
const horairesMercredi = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];
const horairesSamedi = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];
const horairesAutresJours = ["15:00", "16:00", "17:00", "18:00", "19:00"]; // Lundi, Mardi, Jeudi, Vendredi

interface Reservation {
  heure_reservation: string;
  service_type: string;
}

interface ContactFormData {
  nom: string;
  email: string;
  sujet: string;
  message: string;
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

  // État pour la promotion active
  const [activePromotion, setActivePromotion] = useState<{
    id: number;
    titre: string;
    date_event: string;
    date_fin: string;
    prix_promo: string;
  } | null>(null);

  // Charger la promotion active au montage du composant
  useEffect(() => {
    const fetchActivePromotion = async () => {
      try {
        const response = await fetch(
          "https://www.rababali.com/rabab/api/db_connect.php?action=get_active_promotion"
        );
        const data = await response.json();
        if (data.success && data.data) {
          setActivePromotion(data.data);
        }
      } catch (err) {
        console.error("Erreur lors du chargement de la promotion:", err);
      }
    };
    fetchActivePromotion();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success") === "1") {
      toast.success(
        "Paiement effectué avec succès ! Votre rendez-vous est confirmé."
      );
    }
  }, [location]);

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
    "seance_online" | "seance_presentiel" | null
  >(null);
  const [reservedSlots, setReservedSlots] = useState<string[]>([]);

  // États pour Contact
  const [contactFormData, setContactFormData] = useState<ContactFormData>({
    nom: "",
    email: "",
    sujet: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<null | {
    type: "success" | "error";
    text: string;
  }>(null);

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
    if (isSunday(selectedDate)) {
      // Dimanche fermé
      horairesDispo = [];
    } else if (isWednesday(selectedDate)) {
      horairesDispo = horairesMercredi;
    } else if (isSaturday(selectedDate)) {
      horairesDispo = horairesSamedi;
    } else if (isWeekday(selectedDate)) {
      horairesDispo = horairesAutresJours;
    }
  }

  // Gestion formulaire Booking
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

  // Gestion formulaire Contact
  const handleContactChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContactFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFeedback(null);

    try {
      const apiBase =
        window.location.hostname === "localhost"
          ? "http://localhost/RefonteSiteRabab/api"
          : "https://rababali.com/rabab/api";

      const response = await fetch(`${apiBase}/send_contact_email.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactFormData),
      });

      const data = await response.json();

      if (data.success) {
        setFeedback({
          type: "success",
          text: data.message,
        });
        setContactFormData({ nom: "", email: "", sujet: "", message: "" });
      } else {
        setFeedback({
          type: "error",
          text: data.message || "Erreur lors de l'envoi du message.",
        });
      }
    } catch (error) {
      console.error("Erreur envoi contact:", error);
      setFeedback({
        type: "error",
        text: "Erreur de connexion. Veuillez réessayer plus tard.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ background: "#faf1e6" }}>
      {/* ========== SECTION PRISE DE RENDEZ-VOUS ========== */}
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
              style={{ position: "relative" }}
            >
              {/* Badge Promotion */}
              {activePromotion && (
                <div
                  style={{
                    position: "absolute",
                    top: 50,
                    right: 10,
                    background:
                      "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                    boxShadow: "0 2px 8px rgba(255,152,0,0.3)",
                    zIndex: 10,
                  }}
                >
                  🎉 Offre spéciale
                </div>
              )}

              <div
                className={`booking-service-badge ${
                  service.type === "en ligne" ? "online" : "presentiel"
                }`}
              >
                {service.type}
              </div>
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

                {/* Affichage de la promotion */}
                {activePromotion && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "10px",
                      background: "#fff3e0",
                      borderRadius: "8px",
                      border: "1px solid #ff9800",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#f57c00",
                        fontWeight: "600",
                      }}
                    >
                      📅 Valable jusqu'au{" "}
                      {new Date(activePromotion.date_fin).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="booking-service-footer">
                <div className="booking-service-pricing">
                  <div
                    className={`booking-service-duration ${
                      service.type === "en ligne" ? "online" : "presentiel"
                    }`}
                  >
                    {service.duree}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "4px",
                    }}
                  >
                    {activePromotion ? (
                      <>
                        <div
                          style={{
                            fontSize: "0.9rem",
                            color: "#999",
                            textDecoration: "line-through",
                          }}
                        >
                          {service.prix}
                        </div>
                        <div
                          className="booking-service-price"
                          style={{
                            color: "#ff9800",
                            fontSize: "1.8rem",
                            fontWeight: "bold",
                          }}
                        >
                          {activePromotion.prix_promo} CHF
                        </div>
                      </>
                    ) : (
                      <div className="booking-service-price">
                        {service.prix}
                      </div>
                    )}
                  </div>
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
                Réserver une séance Vision 3D en ligne
              </h2>
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

                    // Tous les jours sauf dimanche sont sélectionnables, et pas les jours passés
                    const isSelectable = !isSunday(date) && date >= todayDate;
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
                        // Calculer le montant en fonction de la promotion
                        let amount =
                          selectedService === "seance_online" ? 10000 : 12000; // Prix normal en centimes

                        // Si promotion active et séance online, utiliser le prix promo
                        if (
                          activePromotion &&
                          selectedService === "seance_online" &&
                          activePromotion.prix_promo
                        ) {
                          const prixPromo = parseFloat(
                            activePromotion.prix_promo
                          );
                          if (!isNaN(prixPromo)) {
                            amount = Math.round(prixPromo * 100); // Convertir en centimes
                          }
                        }

                        return (
                          <StripePayButton
                            amount={amount}
                            description={
                              selectedService === "seance_online"
                                ? "Séance Vision 3D en ligne" +
                                  (activePromotion ? " (Offre spéciale)" : "")
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
                        );
                      })()}
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
              Chaque séance est adaptée à vos besoins spécifiques. N'hésitez pas
              à me contacter directement pour toute question.
            </p>
            <p>
              <strong>Tél : +41 77 223 30 30</strong>
              <br />
              <strong>Email : rabab@rababali.com</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ========== SÉPARATEUR ========== */}
      <div style={{ margin: "3rem 0 2rem 0", textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            width: 120,
            height: 4,
            background: "#5c7671",
            borderRadius: 2,
            opacity: 0.4,
          }}
        />
      </div>

      {/* ========== SECTION CONTACT ========== */}
      <section className="contact-page">
        <div className="contact-form-container">
          <h1 className="contact-title">📬 Contactez-moi</h1>
          <p className="contact-description">
            Une question, un projet, une remarque ? Remplissez le formulaire
            ci-dessous, je vous répondrai rapidement.
          </p>
          {feedback && (
            <div className={`contact-feedback ${feedback.type}`}>
              {feedback.text}
            </div>
          )}
          <form onSubmit={handleContactSubmit} autoComplete="off">
            <div className="contact-form-field">
              <label className="contact-form-label">Votre nom *</label>
              <input
                type="text"
                name="nom"
                value={contactFormData.nom}
                onChange={handleContactChange}
                required
                maxLength={100}
                className="contact-form-input"
                placeholder="Votre nom ou prénom"
              />
            </div>
            <div className="contact-form-field">
              <label className="contact-form-label">Votre email *</label>
              <input
                type="email"
                name="email"
                value={contactFormData.email}
                onChange={handleContactChange}
                required
                maxLength={120}
                className="contact-form-input"
                placeholder="exemple@email.com"
              />
            </div>
            <div className="contact-form-field">
              <label className="contact-form-label">Sujet *</label>
              <input
                type="text"
                name="sujet"
                value={contactFormData.sujet}
                onChange={handleContactChange}
                required
                maxLength={120}
                className="contact-form-input"
                placeholder="Sujet de votre message"
              />
            </div>
            <div className="contact-form-field large">
              <label className="contact-form-label">Message *</label>
              <textarea
                name="message"
                value={contactFormData.message}
                onChange={handleContactChange}
                required
                rows={6}
                className="contact-form-textarea"
                placeholder="Votre message..."
              />
            </div>
            <div className="contact-form-submit-container">
              <button
                type="submit"
                className="contact-form-submit-btn"
                style={{
                  opacity: sending ? 0.7 : 1,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
                disabled={sending}
              >
                {sending ? "⏳ Envoi en cours..." : "Envoyer le message"}
              </button>
            </div>
          </form>
          <div className="contact-info">
            <div className="contact-info-item">
              <b>Email :</b>{" "}
              <a href="mailto:rabab@rababali.com" className="contact-info-link">
                rabab@rababali.com
              </a>
            </div>
            <div className="contact-info-item">
              <b>Téléphone :</b>{" "}
              <a href="tel:+41772233030" className="contact-info-link">
                +41 77 223 30 30
              </a>
            </div>
            <div>
              <b>Instagram :</b>{" "}
              <a
                href="https://www.instagram.com/rabab_rit_a_la_vie"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-info-link"
              >
                @rabab_rit_a_la_vie
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookingAndContact;
