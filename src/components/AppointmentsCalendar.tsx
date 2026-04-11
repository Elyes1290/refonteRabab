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

const monthNames = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

const statusIcon = (statut: string) => {
  if (statut === "confirmee") return "✅";
  if (statut === "payee_a_confirmer") return "💳";
  if (statut === "reportee") return "🔁";
  if (statut === "en_attente") return "⏳";
  if (statut === "annulee") return "❌";
  return "❓";
};

const serviceLabel = (type: string) => {
  if (type === "seance_online") return "En ligne";
  if (type === "seance_presentiel") return "Présentiel";
  if (type === "seance_domicile") return "Domicile";
  return type;
};

const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({
  appointments,
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: adjustedFirstDay }, () => null);

  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const date = appointment.date_reservation;
    if (!acc[date]) acc[date] = [];
    acc[date].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const prevMonth = () => {
    setSelectedDateKey(null);
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    setSelectedDateKey(null);
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const formatDate = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const handleDayClick = (dateKey: string, hasAppointments: boolean) => {
    if (!hasAppointments) { setSelectedDateKey(null); return; }
    setSelectedDateKey((prev) => (prev === dateKey ? null : dateKey));
  };

  const selectedAppointments = selectedDateKey
    ? (appointmentsByDate[selectedDateKey] || [])
    : [];

  const formatSelectedDate = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  };

  return (
    <div className="appointments-calendar">
      {/* Header */}
      <div className="calendar-header">
        <button onClick={prevMonth} className="calendar-nav-btn">←</button>
        <h3 className="calendar-title">{monthNames[currentMonth]} {currentYear}</h3>
        <button onClick={nextMonth} className="calendar-nav-btn">→</button>
      </div>

      {/* Jours de la semaine */}
      <div className="calendar-weekdays">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>

      {/* Grille */}
      <div className="calendar-grid">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="calendar-day empty" />
        ))}

        {days.map((day) => {
          const dateKey = formatDate(currentYear, currentMonth, day);
          const dayAppointments = appointmentsByDate[dateKey] || [];
          const isToday =
            currentYear === today.getFullYear() &&
            currentMonth === today.getMonth() &&
            day === today.getDate();
          const isSelected = selectedDateKey === dateKey;

          return (
            <div
              key={day}
              onClick={() => handleDayClick(dateKey, dayAppointments.length > 0)}
              className={[
                "calendar-day",
                isToday ? "today" : "",
                dayAppointments.length > 0 ? "has-appointments" : "",
                isSelected ? "selected-day" : "",
              ].filter(Boolean).join(" ")}
            >
              <span className="day-number">{day}</span>
              {dayAppointments.length > 0 && (
                <div className="appointments-indicator">
                  {/* Affichage desktop : nom + compteur (masqué sur touch) */}
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

                  {/* Affichage mobile : badges heure/nom lisibles */}
                  <div className="cal-mobile-badges">
                    {dayAppointments
                      .slice()
                      .sort((a, b) => a.heure_reservation.localeCompare(b.heure_reservation))
                      .slice(0, 2)
                      .map((apt) => (
                        <div key={apt.id} className="cal-mobile-badge">
                          <span className="cal-mobile-badge-time">
                            {apt.heure_reservation.slice(0, 5)}
                          </span>
                          <span className="cal-mobile-badge-name">
                            {apt.prenom}
                          </span>
                        </div>
                      ))}
                    {dayAppointments.length > 2 && (
                      <div className="cal-mobile-badge cal-mobile-badge-more">
                        +{dayAppointments.length - 2}
                      </div>
                    )}
                  </div>

                  {/* Tooltip desktop uniquement (hover) */}
                  <div className="appointment-details desktop-only-tooltip">
                    {dayAppointments.map((apt) => (
                      <div key={apt.id} className="appointment-item">
                        <span className="appointment-time">{apt.heure_reservation}</span>
                        <span className="appointment-client">{apt.prenom} {apt.nom}</span>
                        <span className={`appointment-type ${apt.service_type}`}>
                          {serviceLabel(apt.service_type)}
                        </span>
                        <span className="appointment-status">{statusIcon(apt.statut)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Panneau détail jour — visible sur mobile après tap */}
      {selectedDateKey && selectedAppointments.length > 0 && (
        <div className="calendar-day-panel">
          <div className="calendar-day-panel-header">
            <span className="calendar-day-panel-date">
              {formatSelectedDate(selectedDateKey)}
            </span>
            <button
              className="calendar-day-panel-close"
              onClick={() => setSelectedDateKey(null)}
            >
              ✕
            </button>
          </div>
          {selectedAppointments
            .slice()
            .sort((a, b) => a.heure_reservation.localeCompare(b.heure_reservation))
            .map((apt) => (
              <div key={apt.id} className="calendar-day-panel-item">
                <div className="calendar-day-panel-time">{apt.heure_reservation}</div>
                <div className="calendar-day-panel-info">
                  <strong>{apt.prenom} {apt.nom}</strong>
                  <span className="calendar-day-panel-service">
                    {serviceLabel(apt.service_type)}
                  </span>
                  {apt.notes && (
                    <span className="calendar-day-panel-notes">📝 {apt.notes}</span>
                  )}
                </div>
                <div className="calendar-day-panel-status">
                  {statusIcon(apt.statut)}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsCalendar;
