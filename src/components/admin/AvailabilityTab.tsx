import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface AvailabilityRule {
  weekday: number;
  is_enabled: number;
  start_time: string;
  end_time: string;
  slot_interval_minutes: number;
}

interface AvailabilityTabProps {
  API_BASE: string;
}

interface VacationPeriod {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  is_active: number;
}

const weekdays = [
  { value: 0, label: "Dimanche" },
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
];

const AvailabilityTab: React.FC<AvailabilityTabProps> = ({ API_BASE }) => {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [savingAllRules, setSavingAllRules] = useState(false);
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  const [vacationForm, setVacationForm] = useState({
    title: "Vacances",
    start_date: "",
    end_date: "",
    is_active: 1,
  });
  const [editingVacationId, setEditingVacationId] = useState<number | null>(null);
  const [savingVacation, setSavingVacation] = useState(false);
  const [deletingVacationId, setDeletingVacationId] = useState<number | null>(null);

  const fetchRules = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/rabab/api/db_connect.php?action=get_availability_rules`
      );
      const data = await response.json();
      if (data.success) {
        setRules(Array.isArray(data.data) ? data.data : []);
      } else {
        toast.error(data.message || "Erreur chargement disponibilités");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    }
  };

  useEffect(() => {
    fetchRules();
    fetchVacationPeriods();
  }, []);

  const fetchVacationPeriods = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/rabab/api/db_connect.php?action=get_vacation_periods`
      );
      const data = await response.json();
      if (data.success) {
        setVacationPeriods(Array.isArray(data.data) ? data.data : []);
      } else {
        toast.error(data.message || "Erreur chargement vacances");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    }
  };

  const updateLocalRule = (
    weekday: number,
    partial: Partial<AvailabilityRule>
  ) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.weekday === weekday ? { ...rule, ...partial } : rule
      )
    );
  };

  const saveAllRules = async () => {
    setSavingAllRules(true);
    try {
      const rulesToSave: AvailabilityRule[] = weekdays.map((day) => {
        const rule = rules.find((r) => r.weekday === day.value);
        if (rule) return rule;
        return {
          weekday: day.value,
          is_enabled: day.value === 0 ? 0 : 1,
          start_time: "09:00:00",
          end_time: "18:30:00",
          slot_interval_minutes: 30,
        };
      });

      const responses = await Promise.all(
        rulesToSave.map(async (rule) => {
          const formData = new FormData();
          formData.append("action", "update_availability_rule");
          formData.append("weekday", String(rule.weekday));
          formData.append("is_enabled", rule.is_enabled ? "1" : "0");
          formData.append("start_time", String(rule.start_time).slice(0, 5));
          formData.append("end_time", String(rule.end_time).slice(0, 5));
          formData.append(
            "slot_interval_minutes",
            String(rule.slot_interval_minutes || 30)
          );

          const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
            method: "POST",
            body: formData,
          });
          return response.json();
        })
      );

      const failedResponse = responses.find((res) => !res?.success);
      if (failedResponse) {
        toast.error(failedResponse.message || "Erreur mise à jour");
      } else {
        toast.success("Toutes les disponibilités ont été enregistrées");
        fetchRules();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    } finally {
      setSavingAllRules(false);
    }
  };

  const resetVacationForm = () => {
    setVacationForm({
      title: "Vacances",
      start_date: "",
      end_date: "",
      is_active: 1,
    });
    setEditingVacationId(null);
  };

  const startEditVacation = (period: VacationPeriod) => {
    setEditingVacationId(period.id);
    setVacationForm({
      title: period.title || "Vacances",
      start_date: period.start_date,
      end_date: period.end_date,
      is_active: Number(period.is_active) === 1 ? 1 : 0,
    });
  };

  const saveVacationPeriod = async () => {
    if (!vacationForm.start_date || !vacationForm.end_date) {
      toast.error("Sélectionnez une date de début et une date de fin");
      return;
    }
    if (vacationForm.start_date > vacationForm.end_date) {
      toast.error("La date de fin doit être après la date de début");
      return;
    }

    setSavingVacation(true);
    try {
      const formData = new FormData();
      formData.append(
        "action",
        editingVacationId ? "update_vacation_period" : "add_vacation_period"
      );
      if (editingVacationId) formData.append("id", String(editingVacationId));
      formData.append("title", vacationForm.title || "Vacances");
      formData.append("start_date", vacationForm.start_date);
      formData.append("end_date", vacationForm.end_date);
      formData.append("is_active", vacationForm.is_active ? "1" : "0");

      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        toast.success(
          editingVacationId
            ? "Période de vacances mise à jour"
            : "Période de vacances ajoutée"
        );
        resetVacationForm();
        fetchVacationPeriods();
      } else {
        toast.error(data.message || "Erreur enregistrement vacances");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    } finally {
      setSavingVacation(false);
    }
  };

  const deleteVacationPeriod = async (id: number) => {
    if (!window.confirm("Supprimer cette période de vacances ?")) return;
    setDeletingVacationId(id);
    try {
      const formData = new FormData();
      formData.append("action", "delete_vacation_period");
      formData.append("id", String(id));
      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Période supprimée");
        if (editingVacationId === id) resetVacationForm();
        fetchVacationPeriods();
      } else {
        toast.error(data.message || "Erreur suppression");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion");
    } finally {
      setDeletingVacationId(null);
    }
  };

  return (
    <div className="admin-tab-panel availability-tab">
      <div className="admin-form availability-table-card">
        <h2 className="availability-title">Disponibilités du calendrier</h2>
        <p className="availability-lead">
          Modifiez les jours ouverts, les horaires et l'intervalle de pause utilisé pour calculer la prochaine disponibilité.
        </p>

        <div className="availability-table-wrap">
          <table className="availability-table">
            <thead>
              <tr>
                <th>Jour</th>
                <th>Ouvert</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Intervalle</th>
              </tr>
            </thead>
            <tbody>
              {weekdays.map((day) => {
                const rule =
                  rules.find((r) => r.weekday === day.value) ||
                  ({
                    weekday: day.value,
                    is_enabled: day.value === 0 ? 0 : 1,
                    start_time: "09:00:00",
                    end_time: "18:30:00",
                    slot_interval_minutes: 30,
                  } as AvailabilityRule);

                return (
                  <tr key={day.value}>
                    <td>
                      <span className="availability-day-pill">{day.label}</span>
                    </td>
                    <td>
                      <label className="availability-switch">
                        <input
                          type="checkbox"
                          checked={Number(rule.is_enabled) === 1}
                          onChange={(e) =>
                            updateLocalRule(day.value, {
                              is_enabled: e.target.checked ? 1 : 0,
                            })
                          }
                        />
                        <span>
                          {Number(rule.is_enabled) === 1 ? "Ouvert" : "Fermé"}
                        </span>
                      </label>
                    </td>
                    <td>
                      <input
                        className="availability-time-input"
                        type="time"
                        value={String(rule.start_time).slice(0, 5)}
                        onChange={(e) =>
                          updateLocalRule(day.value, {
                            start_time: e.target.value + ":00",
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="availability-time-input"
                        type="time"
                        value={String(rule.end_time).slice(0, 5)}
                        onChange={(e) =>
                          updateLocalRule(day.value, {
                            end_time: e.target.value + ":00",
                          })
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="availability-interval-select"
                        value={rule.slot_interval_minutes || 30}
                        onChange={(e) =>
                          updateLocalRule(day.value, {
                            slot_interval_minutes: Number(e.target.value),
                          })
                        }
                      >
                        <option value={15}>15 min</option>
                        <option value={20}>20 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="availability-vacation-actions">
          <button
            type="button"
            className="availability-save-btn"
            onClick={saveAllRules}
            disabled={savingAllRules}
          >
            {savingAllRules
              ? "Enregistrement..."
              : "Enregistrer toutes les disponibilités"}
          </button>
        </div>

        <div className="availability-vacations-card">
          <h3 className="availability-subtitle">Vacances / indisponibilités</h3>
          <p className="availability-sublead">
            Bloquez les réservations sur une période (par exemple du 10/08 au 24/08).
          </p>

          <div className="availability-vacation-form-grid">
            <div>
              <label>Libellé</label>
              <input
                type="text"
                value={vacationForm.title}
                onChange={(e) =>
                  setVacationForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Ex: Vacances d'été"
              />
            </div>
            <div>
              <label>Date de début</label>
              <input
                type="date"
                value={vacationForm.start_date}
                onChange={(e) =>
                  setVacationForm((prev) => ({ ...prev, start_date: e.target.value }))
                }
              />
            </div>
            <div>
              <label>Date de fin</label>
              <input
                type="date"
                value={vacationForm.end_date}
                onChange={(e) =>
                  setVacationForm((prev) => ({ ...prev, end_date: e.target.value }))
                }
              />
            </div>
            <div>
              <label>Actif</label>
              <select
                value={vacationForm.is_active}
                onChange={(e) =>
                  setVacationForm((prev) => ({
                    ...prev,
                    is_active: Number(e.target.value) === 1 ? 1 : 0,
                  }))
                }
              >
                <option value={1}>Oui</option>
                <option value={0}>Non</option>
              </select>
            </div>
          </div>

          <div className="availability-vacation-actions">
            <button
              type="button"
              className="availability-save-btn"
              onClick={saveVacationPeriod}
              disabled={savingVacation}
            >
              {savingVacation
                ? "Enregistrement..."
                : editingVacationId
                ? "Mettre à jour"
                : "Ajouter la période"}
            </button>
            {editingVacationId && (
              <button
                type="button"
                className="waitlist-secondary-btn"
                onClick={resetVacationForm}
              >
                Annuler
              </button>
            )}
          </div>

          <div className="availability-vacations-table-wrap">
            <table className="availability-vacations-table">
              <thead>
                <tr>
                  <th>Libellé</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Actif</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vacationPeriods.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="availability-empty-cell">
                      Aucune période de vacances enregistrée.
                    </td>
                  </tr>
                ) : (
                  vacationPeriods.map((period) => (
                    <tr key={period.id}>
                      <td>{period.title || "Vacances"}</td>
                      <td>{period.start_date}</td>
                      <td>{period.end_date}</td>
                      <td>
                        <span
                          className={`waitlist-status-badge ${
                            Number(period.is_active) === 1 ? "open" : "archived"
                          }`}
                        >
                          {Number(period.is_active) === 1 ? "Oui" : "Non"}
                        </span>
                      </td>
                      <td>
                        <div className="waitlist-row-actions">
                          <button
                            type="button"
                            className="waitlist-row-btn"
                            onClick={() => startEditVacation(period)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="waitlist-row-btn danger"
                            onClick={() => deleteVacationPeriod(period.id)}
                            disabled={deletingVacationId === period.id}
                          >
                            {deletingVacationId === period.id
                              ? "Suppression..."
                              : "Supprimer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityTab;
