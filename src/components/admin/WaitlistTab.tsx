import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

interface WaitlistSession {
  id: number;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  price_label: string;
  capacity: number | null;
  status: "draft" | "open" | "closed" | "archived";
  entries_count?: number;
}

interface WaitlistEntry {
  id: number;
  session_id: number;
  nom: string;
  email: string;
  telephone: string;
  message: string;
  status: "pending" | "contacted" | "confirmed" | "cancelled";
  created_at: string;
}

interface WaitlistTabProps {
  API_BASE: string;
}

const initialForm = {
  title: "Journée de constellation familiale",
  session_date: "",
  start_time: "10:00",
  end_time: "16:00",
  location: "Grand-Lancy",
  price_label: "150 CHF",
  capacity: "",
  status: "open",
};

const WaitlistTab: React.FC<WaitlistTabProps> = ({ API_BASE }) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [sessions, setSessions] = useState<WaitlistSession[]>([]);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [updatingEntryId, setUpdatingEntryId] = useState<number | null>(null);
  const [editingStatusEntryId, setEditingStatusEntryId] = useState<number | null>(
    null
  );
  const [bulkStatus, setBulkStatus] =
    useState<WaitlistEntry["status"]>("confirmed");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const fetchSessions = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/rabab/api/db_connect.php?action=get_waitlist_sessions`
      );
      const data = await response.json();
      if (data.success) {
        setSessions(data.data || []);
      } else {
        toast.error(data.message || "Erreur chargement sessions");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    }
  };

  const fetchEntries = async (sessionId: number) => {
    try {
      const response = await fetch(
        `${API_BASE}/rabab/api/db_connect.php?action=get_waitlist_entries&session_id=${sessionId}`
      );
      const data = await response.json();
      if (data.success) {
        setEntries(data.data || []);
      } else {
        toast.error(data.message || "Erreur chargement inscriptions");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchEntries(selectedSessionId);
    } else {
      setEntries([]);
    }
  }, [selectedSessionId]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingSessionId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append(
        "action",
        editingSessionId ? "update_waitlist_session" : "add_waitlist_session"
      );
      if (editingSessionId) formData.append("id", String(editingSessionId));
      formData.append("title", form.title);
      formData.append("session_date", form.session_date);
      formData.append("start_time", form.start_time);
      formData.append("end_time", form.end_time);
      formData.append("location", form.location);
      formData.append("price_label", form.price_label);
      formData.append("capacity", form.capacity);
      formData.append("status", form.status);

      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || "Session enregistrée");
        resetForm();
        fetchSessions();
      } else {
        toast.error(data.message || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer cette session de liste d'attente ?")) return;
    try {
      const formData = new FormData();
      formData.append("action", "delete_waitlist_session");
      formData.append("id", String(id));
      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Session supprimée");
        if (selectedSessionId === id) setSelectedSessionId(null);
        fetchSessions();
      } else {
        toast.error(data.message || "Erreur suppression");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    }
  };

  const handleToggleEntries = (sessionId: number) => {
    setSelectedSessionId((prev) => (prev === sessionId ? null : sessionId));
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!selectedSessionId) return;
    if (!window.confirm("Supprimer cet inscrit de la liste d'attente ?")) return;
    try {
      const formData = new FormData();
      formData.append("action", "delete_waitlist_entry");
      formData.append("id", String(entryId));
      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Inscrit supprimé");
        fetchEntries(selectedSessionId);
        fetchSessions();
      } else {
        toast.error(data.message || "Erreur suppression inscrit");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    }
  };

  const handleUpdateEntryStatus = async (
    entryId: number,
    status: WaitlistEntry["status"]
  ) => {
    if (!selectedSessionId) return;
    setUpdatingEntryId(entryId);
    try {
      const formData = new FormData();
      formData.append("action", "update_waitlist_entry_status");
      formData.append("id", String(entryId));
      formData.append("status", status);

      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === entryId ? { ...entry, status } : entry
          )
        );
        setEditingStatusEntryId(null);
      } else {
        toast.error(data.message || "Erreur mise à jour du statut");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    } finally {
      setUpdatingEntryId(null);
    }
  };

  const handleUpdateAllEntriesStatus = async () => {
    if (!selectedSessionId || entries.length === 0) return;
    setBulkUpdating(true);
    try {
      const formData = new FormData();
      formData.append("action", "update_waitlist_entries_status_bulk");
      formData.append("session_id", String(selectedSessionId));
      formData.append("status", bulkStatus);

      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setEntries((prev) => prev.map((entry) => ({ ...entry, status: bulkStatus })));
        fetchSessions();
        toast.success(`Tous les inscrits sont passés à "${getEntryStatusLabel(bulkStatus)}"`);
      } else {
        toast.error(data.message || "Erreur de mise à jour globale");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    } finally {
      setBulkUpdating(false);
    }
  };

  const startEdit = (session: WaitlistSession) => {
    setEditingSessionId(session.id);
    setForm({
      title: session.title,
      session_date: session.session_date,
      start_time: (session.start_time || "").slice(0, 5),
      end_time: (session.end_time || "").slice(0, 5),
      location: session.location || "",
      price_label: session.price_label || "150 CHF",
      capacity: session.capacity ? String(session.capacity) : "",
      status: session.status || "open",
    });
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const getSessionStatusLabel = (status: WaitlistSession["status"]) => {
    if (status === "open") return "Ouverte";
    if (status === "closed") return "Fermée";
    if (status === "archived") return "Archivée";
    return "Brouillon";
  };

  const getEntryStatusLabel = (status: WaitlistEntry["status"]) => {
    if (status === "contacted") return "Contacté";
    if (status === "confirmed") return "Confirmé";
    if (status === "cancelled") return "Annulé";
    return "En attente";
  };

  const getSessionById = (id: number | null) =>
    sessions.find((session) => session.id === id) || null;

  const selectedSession = getSessionById(selectedSessionId);

  return (
    <div className="admin-tab-panel waitlist-tab">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="admin-form waitlist-form-card"
      >
        <h2 className="waitlist-section-title">
          {editingSessionId ? "Modifier une session liste d'attente" : "Créer une session liste d'attente"}
        </h2>
        <div className="waitlist-field">
          <label>Titre</label>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>
        <div className="waitlist-grid-3">
          <div className="waitlist-field">
            <label>Date</label>
            <input
              type="date"
              value={form.session_date}
              onChange={(e) => setForm((prev) => ({ ...prev, session_date: e.target.value }))}
              required
            />
          </div>
          <div className="waitlist-field">
            <label>Début</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
              required
            />
          </div>
          <div className="waitlist-field">
            <label>Fin</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
              required
            />
          </div>
        </div>
        <div className="waitlist-grid-3">
          <div className="waitlist-field">
            <label>Lieu</label>
            <input
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>
          <div className="waitlist-field">
            <label>Prix affiché</label>
            <input
              value={form.price_label}
              onChange={(e) => setForm((prev) => ({ ...prev, price_label: e.target.value }))}
            />
          </div>
          <div className="waitlist-field">
            <label>Capacité (optionnel)</label>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
            />
          </div>
        </div>
        <div className="waitlist-field">
          <label>Statut</label>
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as typeof initialForm.status }))}
          >
            <option value="draft">Brouillon</option>
            <option value="open">Ouverte</option>
            <option value="closed">Fermée</option>
            <option value="archived">Archivée</option>
          </select>
        </div>
        <div className="waitlist-actions-row">
          <button type="submit" className="btn-magical waitlist-primary-btn" disabled={loading}>
            {loading ? "Enregistrement..." : editingSessionId ? "Mettre à jour" : "Créer la session"}
          </button>
          {editingSessionId && (
            <button type="button" onClick={resetForm} className="waitlist-secondary-btn">
              Annuler l'édition
            </button>
          )}
        </div>
      </form>

      <section className="waitlist-table-card">
        <div className="waitlist-card-head">
          <h3 className="waitlist-section-title">Sessions existantes</h3>
          <span className="waitlist-total-pill">{sessions.length} session(s)</span>
        </div>
        <div className="waitlist-table-scroll">
          <table className="admin-table waitlist-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Horaires</th>
                <th>Lieu</th>
                <th>Statut</th>
                <th>Inscriptions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="waitlist-empty-cell">
                    Aucune session pour le moment.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <span className="waitlist-date-chip">
                        {new Date(session.session_date).toLocaleDateString("fr-FR")}
                      </span>
                    </td>
                    <td>
                      {String(session.start_time).slice(0, 5)} - {String(session.end_time).slice(0, 5)}
                    </td>
                    <td>{session.location || "-"}</td>
                    <td>
                      <span className={`waitlist-status-badge ${session.status}`}>
                        {getSessionStatusLabel(session.status)}
                      </span>
                    </td>
                    <td>
                      <span className="waitlist-count-badge">{session.entries_count ?? 0}</span>
                    </td>
                    <td>
                      <div className="waitlist-row-actions">
                        <button
                          type="button"
                          className="waitlist-row-btn"
                          onClick={() => startEdit(session)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="waitlist-row-btn"
                          onClick={() => handleToggleEntries(session.id)}
                        >
                          {selectedSessionId === session.id ? "Masquer inscrits" : "Voir inscrits"}
                        </button>
                        <button
                          type="button"
                          className="waitlist-row-btn danger"
                          onClick={() => handleDelete(session.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedSessionId && (
        <section className="waitlist-table-card waitlist-entries-card">
          <div className="waitlist-card-head">
            <h3 className="waitlist-section-title">
              Inscriptions - {selectedSession ? new Date(selectedSession.session_date).toLocaleDateString("fr-FR") : `session #${selectedSessionId}`}
            </h3>
            <div className="waitlist-card-head-actions">
              <span className="waitlist-total-pill">{entries.length} inscrit(s)</span>
              <button
                type="button"
                className="waitlist-close-btn"
                onClick={() => setSelectedSessionId(null)}
                aria-label="Fermer la liste des inscrits"
                title="Fermer"
              >
                ×
              </button>
            </div>
          </div>
          <div className="waitlist-bulk-actions">
            <span className="waitlist-bulk-label">Action globale:</span>
            <select
              className="waitlist-inline-status-select"
              value={bulkStatus}
              onChange={(e) =>
                setBulkStatus(e.target.value as WaitlistEntry["status"])
              }
              disabled={bulkUpdating || entries.length === 0}
            >
              <option value="pending">En attente</option>
              <option value="contacted">Contacté</option>
              <option value="confirmed">Confirmé</option>
              <option value="cancelled">Annulé</option>
            </select>
            <button
              type="button"
              className="waitlist-row-btn"
              onClick={handleUpdateAllEntriesStatus}
              disabled={bulkUpdating || entries.length === 0}
            >
              {bulkUpdating ? "Mise à jour..." : "Appliquer à tous"}
            </button>
          </div>
          <div className="waitlist-table-scroll">
            <table className="admin-table waitlist-table">
              <thead>
                <tr>
                  <th>Date inscription</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Message</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="waitlist-empty-cell">
                      Aucun inscrit pour cette session.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.created_at).toLocaleString("fr-FR")}</td>
                      <td>{entry.nom}</td>
                      <td className="waitlist-email-cell">{entry.email}</td>
                      <td>{entry.telephone}</td>
                      <td>{entry.message || "-"}</td>
                      <td>
                        {editingStatusEntryId === entry.id ? (
                          <select
                            autoFocus
                            className="waitlist-inline-status-select"
                            value={entry.status}
                            disabled={updatingEntryId === entry.id}
                            onBlur={() => setEditingStatusEntryId(null)}
                            onChange={(e) =>
                              handleUpdateEntryStatus(
                                entry.id,
                                e.target.value as WaitlistEntry["status"]
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                setEditingStatusEntryId(null);
                              }
                            }}
                          >
                            <option value="pending">En attente</option>
                            <option value="contacted">Contacté</option>
                            <option value="confirmed">Confirmé</option>
                            <option value="cancelled">Annulé</option>
                          </select>
                        ) : (
                          <button
                            type="button"
                            className={`waitlist-entry-status waitlist-entry-status-btn ${entry.status}`}
                            disabled={updatingEntryId === entry.id}
                            title="Cliquer pour modifier le statut"
                            onClick={() => setEditingStatusEntryId(entry.id)}
                          >
                            {updatingEntryId === entry.id
                              ? "Mise à jour..."
                              : getEntryStatusLabel(entry.status)}
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="waitlist-row-btn danger"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default WaitlistTab;
