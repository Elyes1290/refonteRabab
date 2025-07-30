import React, { useState } from "react";

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

interface AppointmentsCalendarProps {
  appointments: Appointment[];
}

const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({
  appointments,
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const monthNames = [
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

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Lundi = 0

  // Créer un tableau des jours du mois
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: adjustedFirstDay }, () => null);

  // Grouper les rendez-vous par date
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const date = appointment.date_reservation;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  return (
    <div className="appointments-calendar">
      {/* Header du calendrier */}
      <div className="calendar-header">
        <button onClick={prevMonth} className="calendar-nav-btn">
          ←
        </button>
        <h3 className="calendar-title">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button onClick={nextMonth} className="calendar-nav-btn">
          →
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="calendar-weekdays">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Grille du calendrier */}
      <div className="calendar-grid">
        {/* Jours vides */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="calendar-day empty"></div>
        ))}

        {/* Jours du mois */}
        {days.map((day) => {
          const dateKey = formatDate(currentYear, currentMonth, day);
          const dayAppointments = appointmentsByDate[dateKey] || [];
          const isToday =
            currentYear === today.getFullYear() &&
            currentMonth === today.getMonth() &&
            day === today.getDate();

          return (
            <div
              key={day}
              className={`calendar-day ${isToday ? "today" : ""} ${
                dayAppointments.length > 0 ? "has-appointments" : ""
              }`}
            >
              <span className="day-number">{day}</span>
              {dayAppointments.length > 0 && (
                <div className="appointments-indicator">
                  {/* Afficher le nom de la première personne + compteur s'il y en a plusieurs */}
                  <div className="appointment-preview">
                    <span className="client-name">
                      {dayAppointments[0].prenom} {dayAppointments[0].nom}
                    </span>
                    {dayAppointments.length > 1 && (
                      <span className="appointment-count">
                        +{dayAppointments.length - 1}
                      </span>
                    )}
                  </div>

                  {/* Détails complets au survol */}
                  <div className="appointment-details">
                    {dayAppointments.map((apt) => (
                      <div key={apt.id} className="appointment-item">
                        <span className="appointment-time">
                          {apt.heure_reservation}
                        </span>
                        <span className="appointment-client">
                          {apt.prenom} {apt.nom}
                        </span>
                        <span
                          className={`appointment-type ${apt.service_type}`}
                        >
                          {apt.service_type === "seance_online"
                            ? "En ligne"
                            : "Présentiel"}
                        </span>
                        <span className={`appointment-status ${apt.statut}`}>
                          {apt.statut === "confirmee"
                            ? "✅"
                            : apt.statut === "en_attente"
                            ? "⏳"
                            : apt.statut === "annulee"
                            ? "❌"
                            : "❓"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AppointmentsCalendar;
