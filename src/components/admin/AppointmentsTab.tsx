import React, { useState } from "react";
import { toast } from "react-toastify";
import AppointmentsCalendar from "../AppointmentsCalendar";

// Interface pour les rendez-vous
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

interface AppointmentForm {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  service_type: string;
  date_reservation: string;
  heure_reservation: string;
  montant: string;
  notes: string;
  statut: string;
}

interface AppointmentsTabProps {
  appointments: Appointment[];
  loadingAppointments: boolean;
  showAppointmentModal: boolean;
  setShowAppointmentModal: (show: boolean) => void;
  editingAppointment: Appointment | null;
  setEditingAppointment: React.Dispatch<
    React.SetStateAction<Appointment | null>
  >;
  appointmentForm: AppointmentForm;
  setAppointmentForm: React.Dispatch<React.SetStateAction<AppointmentForm>>;
  onRefreshAppointments: () => void;
  API_BASE: string;
  // Nouvelles props pour le dashboard
  statsExpanded: {
    revenus: boolean;
    activite: boolean;
    services: boolean;
  };
  setStatsExpanded: React.Dispatch<
    React.SetStateAction<{
      revenus: boolean;
      activite: boolean;
      services: boolean;
    }>
  >;
  onAddAppointment: () => void;
  onPrintReport: () => void;
  onExportCSV: () => void;
}

// Fonction utilitaire pour formater la date en jj-mm-aaaa
function formatDateFr(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}-${m}-${y}`;
}

const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  appointments,
  loadingAppointments,
  showAppointmentModal,
  setShowAppointmentModal,
  editingAppointment,
  setEditingAppointment,
  appointmentForm,
  setAppointmentForm,
  onRefreshAppointments,
  API_BASE,
  statsExpanded,
  setStatsExpanded,
  onAddAppointment,
  onPrintReport,
  onExportCSV,
}) => {
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineUpdatingId, setInlineUpdatingId] = useState<number | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarCopied, setCalendarCopied] = useState(false);

  const getCalendarUrl = (protocol: "webcal" | "https") =>
    `${protocol}://${window.location.hostname}/rabab/api/calendar.php`;

  const handleOpenCalendarSubscription = () => {
    const ua = navigator.userAgent || "";
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    if (isMobile) {
      window.location.href = getCalendarUrl("webcal");
      setTimeout(() => setShowCalendarModal(true), 1500);
    } else {
      setShowCalendarModal(true);
    }
  };

  const handleCopyCalendarUrl = () => {
    navigator.clipboard.writeText(getCalendarUrl("webcal")).then(() => {
      setCalendarCopied(true);
      setTimeout(() => setCalendarCopied(false), 2500);
    });
  };

  const handleInlineStatusChange = async (appointment: Appointment, newStatut: string) => {
    setInlineUpdatingId(appointment.id);
    try {
      const formData = new FormData();
      formData.append("action", "update_reservation");
      formData.append("id", String(appointment.id));
      formData.append("nom", appointment.nom);
      formData.append("prenom", appointment.prenom);
      formData.append("email", appointment.email);
      formData.append("telephone", appointment.telephone);
      formData.append("service_type", appointment.service_type);
      formData.append("date_reservation", appointment.date_reservation);
      formData.append("heure_reservation", appointment.heure_reservation);
      formData.append("montant", String(appointment.montant));
      formData.append("notes", appointment.notes || "");
      formData.append("statut", newStatut);
      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Statut mis à jour");
        onRefreshAppointments();
      } else {
        toast.error(data.message || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setInlineUpdatingId(null);
      setInlineEditingId(null);
    }
  };

  const isPaidStatus = (status: string) =>
    status === "payee_a_confirmer" || status === "confirmee" || status === "reportee";

  const getStatusLabel = (status: string) => {
    if (status === "payee_a_confirmer") return "💳 Payé, à confirmer";
    if (status === "confirmee" || status === "confirme") return "✅ Confirmé";
    if (status === "reportee") return "🔁 Reporté";
    if (status === "en_attente") return "⏳ En attente";
    if (status === "annulee") return "❌ Annulé";
    return status || "❓ Sans statut";
  };

  // Fonction pour ouvrir le modal d'édition
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setAppointmentForm({
      nom: appointment.nom,
      prenom: appointment.prenom,
      email: appointment.email,
      telephone: appointment.telephone,
      service_type: appointment.service_type,
      date_reservation: appointment.date_reservation,
      heure_reservation: appointment.heure_reservation,
      montant: appointment.montant.toString(),
      notes: appointment.notes,
      statut: appointment.statut,
    });
    setShowAppointmentModal(true);
  };

  // Fonction pour supprimer un rendez-vous
  const handleDeleteAppointment = async (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      try {
        const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `action=delete_reservation&id=${id}`,
        });
        const data = await response.json();
        if (data.success) {
          toast.success("Rendez-vous supprimé avec succès !");
          onRefreshAppointments();
        } else {
          toast.error(data.message || "Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur de connexion");
      }
    }
  };

  // Fonction pour annuler un rendez-vous sans le supprimer
  const handleCancelAppointment = async (id: number) => {
    if (
      !window.confirm(
        "Confirmer l'annulation de ce rendez-vous ? Le rendez-vous restera visible dans l'historique."
      )
    ) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append("action", "cancel_reservation");
      formData.append("id", String(id));
      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Rendez-vous annulé avec succès");
        onRefreshAppointments();
      } else {
        toast.error(data.message || "Erreur lors de l'annulation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion");
    }
  };

  // Fonction pour rembourser un rendez-vous payé via Stripe
  const handleRefundAppointment = async (appointment: Appointment) => {
    if (
      !window.confirm(
        "Confirmer le remboursement Stripe de ce rendez-vous ?"
      )
    ) {
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE}/rabab/api/payment.php?action=refund-reservation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reservation_id: appointment.id,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Remboursement effectué avec succès");
        onRefreshAppointments();
      } else {
        toast.error(data.message || "Remboursement impossible");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion");
    }
  };

  // Fonction pour soumettre le formulaire de rendez-vous
  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      const action = editingAppointment
        ? "update_reservation"
        : "create_reservation";
      formData.append("action", action);

      if (editingAppointment) {
        formData.append("id", editingAppointment.id.toString());
      }

      formData.append("nom", appointmentForm.nom);
      formData.append("prenom", appointmentForm.prenom);
      formData.append("email", appointmentForm.email);
      formData.append("telephone", appointmentForm.telephone);
      formData.append("service_type", appointmentForm.service_type);
      formData.append("date_reservation", appointmentForm.date_reservation);
      formData.append("heure_reservation", appointmentForm.heure_reservation);
      formData.append("montant", appointmentForm.montant);
      formData.append("notes", appointmentForm.notes);
      formData.append("statut", appointmentForm.statut);

      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          `Rendez-vous ${
            editingAppointment ? "modifié" : "ajouté"
          } avec succès !`
        );
        setShowAppointmentModal(false);
        onRefreshAppointments();
      } else {
        toast.error(
          data.message || "Erreur lors de la sauvegarde du rendez-vous."
        );
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde du rendez-vous.");
    }
  };

  // Fonction pour gérer les changements dans le formulaire
  const handleAppointmentFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setAppointmentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fonction pour télécharger une facture
  const handleDownloadInvoice = (appointment: Appointment) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const invoiceDate = new Date().toLocaleDateString("fr-FR");
    const serviceDate = formatDateFr(appointment.date_reservation);
    const invoiceNumber = `RDV-${appointment.id}-${new Date().getFullYear()}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture ${invoiceNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: white;
              color: #333;
            }
            .invoice-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: start;
              margin-bottom: 40px; 
              border-bottom: 3px solid #4682B4; 
              padding-bottom: 20px; 
            }
            .company-info { 
              flex: 1;
            }
            .company-info h1 { 
              color: #4682B4; 
              margin: 0 0 10px 0; 
              font-size: 2em;
            }
            .company-info p { 
              margin: 5px 0; 
              color: #666;
            }
            .invoice-details { 
              flex: 1; 
              text-align: right;
            }
            .invoice-number { 
              font-size: 1.2em; 
              font-weight: bold; 
              color: #4682B4; 
              margin-bottom: 10px;
            }
            .client-section { 
              background: #f8f9fa; 
              padding: 20px; 
              border-radius: 8px; 
              margin-bottom: 30px;
            }
            .client-section h3 { 
              color: #4682B4; 
              margin-top: 0;
            }
            .service-details { 
              margin: 30px 0;
            }
            .service-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
            }
            .service-table th, .service-table td { 
              padding: 15px; 
              text-align: left; 
              border: 1px solid #ddd;
            }
            .service-table th { 
              background-color: #4682B4; 
              color: white; 
              font-weight: bold;
            }
            .service-table .amount { 
              text-align: right; 
              font-weight: bold;
            }
            .total-section { 
              background: #e9ecef; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 30px 0;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 10px 0;
              font-size: 1.1em;
            }
            .total-final { 
              border-top: 2px solid #4682B4; 
              padding-top: 15px; 
              font-weight: bold; 
              font-size: 1.3em; 
              color: #4682B4;
            }
            .status { 
              display: inline-block; 
              padding: 8px 16px; 
              border-radius: 20px; 
              font-weight: bold;
              margin: 10px 0;
            }
            .status-paid { 
              background: #d4edda; 
              color: #155724; 
              border: 1px solid #c3e6cb;
            }
            .status-pending { 
              background: #fff3cd; 
              color: #856404; 
              border: 1px solid #ffeaa7;
            }
            .status-cancelled { 
              background: #f8d7da; 
              color: #721c24; 
              border: 1px solid #f5c6cb;
            }
            .footer { 
              margin-top: 50px; 
              text-align: center; 
              font-size: 0.9em; 
              color: #666; 
              border-top: 1px solid #ddd; 
              padding-top: 20px;
            }
            .notes { 
              background: #e8f4fd; 
              padding: 15px; 
              border-radius: 6px; 
              margin: 20px 0;
              border-left: 4px solid #4682B4;
            }
            @media print { 
              body { margin: 0; padding: 15px; } 
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div class="company-info">
              <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                <img src="/images/logo.png?v=1" alt="Logo Rabab Ali" style="width: 60px; height: 60px; object-fit: contain;" />
                <h1 style="margin: 0;">Rabab Ali</h1>
              </div>
              <p><strong>Thérapeute & Coach de Vie</strong></p>
              <p>📧 contact@rababali.com</p>
              <p>🌐 www.rababali.com</p>
            </div>
            <div class="invoice-details">
              <div class="invoice-number">Facture N° ${invoiceNumber}</div>
              <p><strong>Date d'émission:</strong> ${invoiceDate}</p>
              <p><strong>Date du service:</strong> ${serviceDate}</p>
            </div>
          </div>

          <div class="client-section">
            <h3>👤 Informations Client</h3>
            <p><strong>Nom:</strong> ${appointment.nom}</p>
            <p><strong>Prénom:</strong> ${appointment.prenom}</p>
            <p><strong>Email:</strong> ${appointment.email}</p>
            <p><strong>Téléphone:</strong> ${appointment.telephone}</p>
          </div>

          <div class="service-details">
            <h3>📋 Détails du Service</h3>
            <table class="service-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Date & Heure</th>
                  <th>Type</th>
                  <th class="amount">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Séance de thérapie individuelle</strong>
                    ${
                      appointment.notes
                        ? `<br><small><em>Note: ${appointment.notes}</em></small>`
                        : ""
                    }
                  </td>
                  <td>${serviceDate}<br>${appointment.heure_reservation}</td>
                  <td>${
                    appointment.service_type === "seance_online"
                      ? "💻 En ligne"
                      : "🏢 Présentiel"
                  }</td>
                  <td class="amount">${Number(appointment.montant).toFixed(
                    2
                  )} CHF</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <div class="total-row">
              <span>Sous-total:</span>
              <span>${Number(appointment.montant).toFixed(2)} CHF</span>
            </div>
            <div class="total-row">
              <span>TVA (exonérée):</span>
              <span>0.00 CHF</span>
            </div>
            <div class="total-row total-final">
              <span>Total à payer:</span>
              <span>${Number(appointment.montant).toFixed(2)} CHF</span>
            </div>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <span class="status ${
              isPaidStatus(appointment.statut)
                ? "status-paid"
                : appointment.statut === "en_attente"
                ? "status-pending"
                : "status-cancelled"
            }">
              ${
                appointment.statut === "payee_a_confirmer"
                  ? "💳 PAYÉ - EN ATTENTE DE CONFIRMATION"
                  : appointment.statut === "confirmee" || appointment.statut === "reportee"
                  ? "✅ PAYÉ ET CONFIRMÉ"
                  : appointment.statut === "en_attente"
                  ? "⏳ EN ATTENTE DE PAIEMENT"
                  : "❌ ANNULÉ"
              }
            </span>
          </div>

          ${
            appointment.statut === "en_attente"
              ? `
            <div class="notes">
              <strong>📝 Informations de paiement:</strong><br>
              Cette facture sera mise à jour automatiquement une fois le paiement reçu.
              Merci de conserver ce document pour vos dossiers.
            </div>
          `
              : ""
          }

          ${
            isPaidStatus(appointment.statut)
              ? `
            <div class="notes">
              <strong>✅ Paiement confirmé:</strong><br>
              Merci pour votre confiance. Cette facture fait office de reçu officiel.
            </div>
          `
              : ""
          }

          <div class="footer">
            <p><strong>Merci de votre confiance</strong></p>
            <p>Document généré automatiquement le ${invoiceDate}</p>
            <p style="margin-top: 15px;">
              <em>En cas de questions, n'hésitez pas à nous contacter par email ou téléphone.</em>
            </p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <>
      {loadingAppointments ? (
        <div className="admin-loading">Chargement des rendez-vous...</div>
      ) : (
        <>
          {/* Calendrier avec les rendez-vous */}
          <div className="admin-appointments-calendar">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <h2 style={{ color: "#4682B4", margin: 0 }}>
                📅 Calendrier des Rendez-vous
              </h2>
              <button
                onClick={handleOpenCalendarSubscription}
                className="btn-magical"
                style={{ fontSize: "0.8rem", padding: "0.4rem 0.9rem", background: "linear-gradient(135deg, #6c63ff, #5048e5)" }}
                title="Synchroniser avec votre calendrier téléphone"
              >
                📲 Ajouter au calendrier
              </button>
            </div>
            <AppointmentsCalendar appointments={appointments} />
          </div>

          {/* Liste des rendez-vous */}
          <div className="admin-appointments-list">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <h2 style={{ color: "#4682B4", margin: 0 }}>
                📋 Liste des Rendez-vous
              </h2>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={onPrintReport}
                  className="btn-magical"
                  style={{
                    fontSize: "0.8rem",
                    padding: "0.4rem 0.8rem",
                    background: "linear-gradient(135deg, #17a2b8, #138496)",
                  }}
                  title="Imprimer le rapport comptable"
                >
                  🖨️ Imprimer
                </button>
                <button
                  onClick={onExportCSV}
                  className="btn-magical"
                  style={{
                    fontSize: "0.8rem",
                    padding: "0.4rem 0.8rem",
                    background: "linear-gradient(135deg, #28a745, #20c997)",
                  }}
                  title="Télécharger en CSV pour Excel"
                >
                  📊 Export CSV
                </button>
              </div>
            </div>

            {/* Tableau de bord statistiques */}
            <div className="dashboard-stats">
              <h3
                style={{
                  color: "#4682B4",
                  marginBottom: "1rem",
                  textAlign: "center",
                }}
              >
                📊 Tableau de Bord Business
              </h3>

              {/* Revenus */}
              <div className="stats-section">
                <h4
                  style={{
                    color: "#4682B4",
                    marginBottom: "0.8rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onClick={() =>
                    setStatsExpanded((prev) => ({
                      ...prev,
                      revenus: !prev.revenus,
                    }))
                  }
                >
                  💰 Revenus
                  <span style={{ fontSize: "0.8rem" }}>
                    {statsExpanded.revenus ? "▼" : "▶"}
                  </span>
                </h4>
                {statsExpanded.revenus && (
                  <div className="admin-appointments-stats">
                    <div className="stat-card">
                      <span
                        className="stat-number"
                        style={{ color: "#28a745" }}
                      >
                        {appointments
                          .filter((appt) => isPaidStatus(appt.statut))
                          .reduce(
                            (total, appt) =>
                              total + (Number(appt.montant) || 0),
                            0
                          )
                          .toFixed(2)}{" "}
                        CHF
                      </span>
                      <span className="stat-label">Revenus encaissés</span>
                    </div>
                    <div className="stat-card">
                      <span
                        className="stat-number"
                        style={{ color: "#ffc107" }}
                      >
                        {appointments
                          .filter((appt) => appt.statut === "en_attente")
                          .reduce(
                            (total, appt) =>
                              total + (Number(appt.montant) || 0),
                            0
                          )
                          .toFixed(2)}{" "}
                        CHF
                      </span>
                      <span className="stat-label">En attente</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">
                        {(() => {
                          const paidAppointments = appointments.filter(
                            (appt) => isPaidStatus(appt.statut)
                          ).length;
                          const totalAppointments = appointments.filter(
                            (appt) => appt.statut !== "annulee"
                          ).length;
                          return totalAppointments > 0
                            ? Math.round(
                                (paidAppointments / totalAppointments) * 100
                              )
                            : 0;
                        })()}
                        %
                      </span>
                      <span className="stat-label">Taux de paiement</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Activité */}
              <div className="stats-section">
                <h4
                  style={{
                    color: "#4682B4",
                    marginBottom: "0.8rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onClick={() =>
                    setStatsExpanded((prev) => ({
                      ...prev,
                      activite: !prev.activite,
                    }))
                  }
                >
                  📅 Activité
                  <span style={{ fontSize: "0.8rem" }}>
                    {statsExpanded.activite ? "▼" : "▶"}
                  </span>
                </h4>
                {statsExpanded.activite && (
                  <div className="admin-appointments-stats">
                    <div className="stat-card">
                      <span className="stat-number">{appointments.length}</span>
                      <span className="stat-label">Total rendez-vous</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">
                        {
                          appointments.filter(
                            (appt) =>
                              new Date(appt.date_reservation) >= new Date() &&
                              appt.statut !== "annulee"
                          ).length
                        }
                      </span>
                      <span className="stat-label">À venir</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">
                        {(() => {
                          const thisMonth = new Date().getMonth();
                          const thisYear = new Date().getFullYear();
                          return appointments.filter((appt) => {
                            const apptDate = new Date(appt.date_reservation);
                            return (
                              apptDate.getMonth() === thisMonth &&
                              apptDate.getFullYear() === thisYear &&
                              appt.statut === "confirmee"
                              || appt.statut === "payee_a_confirmer"
                              || appt.statut === "reportee"
                            );
                          }).length;
                        })()}
                      </span>
                      <span className="stat-label">Ce mois payés</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Types de services */}
              <div className="stats-section">
                <h4
                  style={{
                    color: "#4682B4",
                    marginBottom: "0.8rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onClick={() =>
                    setStatsExpanded((prev) => ({
                      ...prev,
                      services: !prev.services,
                    }))
                  }
                >
                  🎯 Répartition des Services
                  <span style={{ fontSize: "0.8rem" }}>
                    {statsExpanded.services ? "▼" : "▶"}
                  </span>
                </h4>
                {statsExpanded.services && (
                  <div className="admin-appointments-stats">
                    <div className="stat-card">
                      <span
                        className="stat-number"
                        style={{ color: "#87ceeb" }}
                      >
                        {
                          appointments.filter(
                            (appt) =>
                              appt.service_type === "seance_online" &&
                              isPaidStatus(appt.statut)
                          ).length
                        }
                      </span>
                      <span className="stat-label">En ligne payées</span>
                    </div>
                    <div className="stat-card">
                      <span
                        className="stat-number"
                        style={{ color: "#4682b4" }}
                      >
                        {
                          appointments.filter(
                            (appt) =>
                              appt.service_type === "seance_presentiel" &&
                              isPaidStatus(appt.statut)
                          ).length
                        }
                      </span>
                      <span className="stat-label">Présentiel payées</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">
                        {(() => {
                          const paidAppointments = appointments.filter(
                            (appt) => isPaidStatus(appt.statut)
                          );
                          const avgRevenue =
                            paidAppointments.length > 0
                              ? paidAppointments.reduce(
                                  (total, appt) =>
                                    total + (Number(appt.montant) || 0),
                                  0
                                ) / paidAppointments.length
                              : 0;
                          return avgRevenue.toFixed(0);
                        })()}{" "}
                        CHF
                      </span>
                      <span className="stat-label">Revenu moyen</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Note explicative pour l'export */}
            {appointments.length > 0 && (
              <div
                style={{
                  background: "#e8f4fd",
                  border: "1px solid #bee5eb",
                  borderRadius: "6px",
                  padding: "0.8rem",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                  color: "#0c5460",
                }}
              >
                💡 <strong>Gestion des documents:</strong>
                <br />• <strong>🖨️ Imprimer</strong> → Rapport comptable global
                <br />• <strong>📊 Export CSV</strong> → Données pour
                Excel/comptabilité
                <br />• <strong>🧾 Facture individuelle</strong> → Cliquez sur
                l'icône 🧾 dans chaque ligne pour générer la facture client
                <br />
                <small style={{ opacity: 0.8 }}>
                  Les factures incluent automatiquement le statut de paiement
                  (✅ Payé, ⏳ En attente, ❌ Annulé)
                </small>
              </div>
            )}

            {/* Tableau des rendez-vous */}
            <div className="admin-appointments-table">
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "0.75rem",
                }}
              >
                <button
                  onClick={onAddAppointment}
                  className="btn-magical"
                  style={{ fontSize: "0.85rem", padding: "0.45rem 0.95rem" }}
                >
                  ➕ Ajouter un rendez-vous
                </button>
              </div>
              {appointments.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "#888",
                    padding: "2rem",
                  }}
                >
                  Aucun rendez-vous pour le moment.
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Heure</th>
                      <th>Client</th>
                      <th>Service</th>
                      <th>Montant</th>
                      <th>Statut</th>
                      <th>Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments
                      .sort(
                        (a, b) =>
                          new Date(
                            b.date_reservation + " " + b.heure_reservation
                          ).getTime() -
                          new Date(
                            a.date_reservation + " " + a.heure_reservation
                          ).getTime()
                      )
                      .map((appointment) => (
                        <tr key={appointment.id}>
                          <td>{formatDateFr(appointment.date_reservation)}</td>
                          <td>{appointment.heure_reservation}</td>
                          <td>
                            <strong>
                              {appointment.prenom} {appointment.nom}
                            </strong>
                            {appointment.notes && (
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#666",
                                  marginTop: "4px",
                                }}
                              >
                                📝 {appointment.notes}
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              className={`service-badge ${appointment.service_type}`}
                            >
                              {appointment.service_type === "seance_online"
                                ? "En ligne"
                                : "Présentiel"}
                            </span>
                          </td>
                          <td>
                            <strong>
                              {Number(appointment.montant).toFixed(2)} CHF
                            </strong>
                          </td>
                          <td>
                            {inlineEditingId === appointment.id ? (
                              <select
                                className="inline-status-select"
                                defaultValue={appointment.statut}
                                disabled={inlineUpdatingId === appointment.id}
                                autoFocus
                                onChange={(e) =>
                                  handleInlineStatusChange(appointment, e.target.value)
                                }
                                onBlur={() => setInlineEditingId(null)}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") setInlineEditingId(null);
                                }}
                              >
                                <option value="payee_a_confirmer">💳 Payé, à confirmer</option>
                                <option value="confirmee">✅ Confirmé</option>
                                <option value="reportee">🔁 Reporté</option>
                                <option value="en_attente">⏳ En attente</option>
                                <option value="annulee">❌ Annulé</option>
                              </select>
                            ) : (
                              <span
                                className={`status-badge ${appointment.statut}`}
                                onClick={() => setInlineEditingId(appointment.id)}
                                title="Cliquer pour modifier le statut"
                                style={{ cursor: "pointer" }}
                              >
                                {inlineUpdatingId === appointment.id
                                  ? "⏳..."
                                  : getStatusLabel(appointment.statut)}
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: "0.8rem" }}>
                              📧 {appointment.email}
                              <br />
                              📞 {appointment.telephone}
                            </div>
                          </td>
                          <td>
                            <div className="appointment-actions">
                              <button
                                onClick={() =>
                                  handleDownloadInvoice(appointment)
                                }
                                className="btn-download"
                                title="Télécharger la facture"
                              >
                                🧾
                              </button>
                              <button
                                onClick={() =>
                                  handleEditAppointment(appointment)
                                }
                                className="btn-edit"
                                title="Modifier"
                              >
                                ✏️
                              </button>
                              {isPaidStatus(appointment.statut) && (
                                <button
                                  onClick={() =>
                                    handleRefundAppointment(appointment)
                                  }
                                  className="btn-delete"
                                  title="Rembourser"
                                  style={{ background: "#6f42c1" }}
                                >
                                  💸
                                </button>
                              )}
                              {appointment.statut !== "annulee" && (
                                <button
                                  onClick={() =>
                                    handleCancelAppointment(appointment.id)
                                  }
                                  className="btn-delete"
                                  title="Annuler le rendez-vous"
                                  style={{ background: "#cc8a00" }}
                                >
                                  🚫
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  handleDeleteAppointment(appointment.id)
                                }
                                className="btn-delete"
                                title="Supprimer"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Modal de gestion des rendez-vous */}
          {showAppointmentModal && (
            <div className="booking-modal-overlay">
              <div className="booking-modal-content">
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="booking-modal-close"
                >
                  &times;
                </button>
                <h2 className="booking-modal-title">
                  {editingAppointment
                    ? "Modifier le rendez-vous"
                    : "Ajouter un rendez-vous"}
                </h2>

                <form
                  onSubmit={handleSubmitAppointment}
                  className="booking-form"
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <input
                      name="nom"
                      type="text"
                      placeholder="Nom"
                      value={appointmentForm.nom}
                      onChange={handleAppointmentFormChange}
                      required
                      className="booking-form-input"
                    />
                    <input
                      name="prenom"
                      type="text"
                      placeholder="Prénom"
                      value={appointmentForm.prenom}
                      onChange={handleAppointmentFormChange}
                      required
                      className="booking-form-input"
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <input
                      name="email"
                      type="email"
                      placeholder="Email"
                      value={appointmentForm.email}
                      onChange={handleAppointmentFormChange}
                      required
                      className="booking-form-input"
                    />
                    <input
                      name="telephone"
                      type="tel"
                      placeholder="Téléphone"
                      value={appointmentForm.telephone}
                      onChange={handleAppointmentFormChange}
                      required
                      className="booking-form-input"
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <select
                      name="service_type"
                      value={appointmentForm.service_type}
                      onChange={handleAppointmentFormChange}
                      className="booking-form-input"
                    >
                      <option value="seance_online">Séance en ligne</option>
                      <option value="seance_presentiel">
                        Séance en présentiel
                      </option>
                    </select>
                    <select
                      name="statut"
                      value={appointmentForm.statut}
                      onChange={handleAppointmentFormChange}
                      className="booking-form-input"
                    >
                      <option value="payee_a_confirmer">Payé, à confirmer</option>
                      <option value="confirmee">Confirmé</option>
                      <option value="reportee">Reporté</option>
                      <option value="en_attente">En attente de paiement</option>
                      <option value="annulee">Annulé</option>
                    </select>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <input
                      name="date_reservation"
                      type="date"
                      value={appointmentForm.date_reservation}
                      onChange={handleAppointmentFormChange}
                      required
                      className="booking-form-input"
                    />
                    <input
                      name="heure_reservation"
                      type="time"
                      value={appointmentForm.heure_reservation}
                      onChange={handleAppointmentFormChange}
                      required
                      className="booking-form-input"
                    />
                    <input
                      name="montant"
                      type="number"
                      step="0.01"
                      placeholder="Montant (CHF)"
                      value={appointmentForm.montant}
                      onChange={handleAppointmentFormChange}
                      required
                      className="booking-form-input"
                    />
                  </div>

                  <textarea
                    name="notes"
                    placeholder="Notes (optionnel)"
                    value={appointmentForm.notes}
                    onChange={handleAppointmentFormChange}
                    className="booking-form-textarea"
                    rows={3}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowAppointmentModal(false)}
                      className="booking-form-cancel"
                      style={{
                        background: "#ccc",
                        color: "#333",
                        border: "none",
                        padding: "0.8rem 1.5rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      Annuler
                    </button>
                    <button type="submit" className="booking-form-submit">
                      {editingAppointment ? "Modifier" : "Ajouter"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modale calendrier */}
          {showCalendarModal && (
            <div
              className="booking-modal-overlay"
              style={{ zIndex: 9999 }}
              onClick={() => setShowCalendarModal(false)}
            >
              <div
                className="booking-modal-content"
                style={{ maxWidth: "420px", textAlign: "center" }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="booking-modal-close"
                  onClick={() => setShowCalendarModal(false)}
                  style={{ position: "absolute", top: "1rem", right: "1rem" }}
                >
                  ✕
                </button>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📲</div>
                <h3 style={{ color: "#4682B4", marginBottom: "0.5rem" }}>
                  Ajouter au calendrier
                </h3>

                {/* Bouton ouverture directe */}
                <button
                  onClick={() => { window.location.href = getCalendarUrl("webcal"); }}
                  className="btn-magical"
                  style={{ width: "100%", padding: "0.7rem", marginBottom: "1rem", background: "linear-gradient(135deg, #6c63ff, #5048e5)" }}
                >
                  📅 Ouvrir dans l'app Calendrier
                </button>

                <p style={{ color: "#777", fontSize: "0.85rem", marginBottom: "0.8rem" }}>
                  Si le bouton ci-dessus ne fonctionne pas, copiez l'URL et collez-la manuellement :
                </p>
                <p style={{ color: "#555", fontSize: "0.8rem", marginBottom: "0.6rem" }}>
                  <strong>Google Agenda :</strong> Autres agendas → + → À partir de l'URL
                </p>
                <p style={{ color: "#555", fontSize: "0.8rem", marginBottom: "1rem" }}>
                  <strong>Samsung Calendrier :</strong> Menu → Gérer les agendas → Ajouter un compte
                </p>

                <div
                  style={{
                    background: "#f4f4f4",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "0.7rem 1rem",
                    marginBottom: "0.8rem",
                    wordBreak: "break-all",
                    fontSize: "0.75rem",
                    color: "#333",
                    textAlign: "left",
                  }}
                >
                  {getCalendarUrl("webcal")}
                </div>
                <button
                  onClick={handleCopyCalendarUrl}
                  className="btn-magical"
                  style={{ width: "100%", padding: "0.7rem", marginBottom: "1rem", background: calendarCopied ? "linear-gradient(135deg, #28a745, #20c997)" : "linear-gradient(135deg, #17a2b8, #138496)" }}
                >
                  {calendarCopied ? "✅ Copié !" : "📋 Copier l'URL"}
                </button>

                <div
                  style={{
                    background: "#fff8e1",
                    border: "1px solid #ffe082",
                    borderRadius: "8px",
                    padding: "0.6rem 0.8rem",
                    fontSize: "0.78rem",
                    color: "#795548",
                    textAlign: "left",
                  }}
                >
                  ⚠️ <strong>Google Agenda</strong> peut mettre jusqu'à <strong>24h</strong> pour afficher les rendez-vous après l'ajout de l'URL. C'est une limitation de Google, pas un bug.
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default AppointmentsTab;
