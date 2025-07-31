import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/Admin.css";
import { Rnd } from "react-rnd";
import { v4 as uuidv4 } from "uuid";
import AppointmentsCalendar from "../components/AppointmentsCalendar";

// Utiliser toujours rababali.com (API configurée avec CORS)
const API_BASE = "https://rababali.com";

interface EventForm {
  titre: string;
  description: string;
  date_event: string;
  date_fin: string;
  prix: string;
  devise: string;
  image: File | null;
}

interface EventItem {
  id: number;
  titre: string;
  description: string;
  date_event: string;
  date_fin: string;
  prix: string;
  devise: string;
  image_url?: string; // Optionnel car peut être vide
  type?: string; // "event" ou "flyer"
  modele?: string; // Pour différencier les modèles de flyers
  sous_titre?: string; // Sous-titre pour les flyers
  lieu?: string; // Lieu pour les flyers
  texte?: string; // Texte additionnel pour les flyers
}

// Interface pour les expériences/avis
interface Experience {
  id: number;
  nom: string;
  titre: string;
  message: string;
  date_creation: string;
  statut: string; // 'en_attente', 'valide', 'refuse'
}

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

// Fonction utilitaire pour formater la date en jj-mm-aaaa
function formatDateFr(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}-${m}-${y}`;
}

const Admin: React.FC = () => {
  const [form, setForm] = useState<EventForm>({
    titre: "",
    description: "",
    date_event: "",
    date_fin: "",
    prix: "",
    devise: "€",
    image: null,
  });
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Vérifier immédiatement si l'utilisateur est déjà authentifié
    return localStorage.getItem("admin_auth") === "true";
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [eventType, setEventType] = useState<"event" | "flyer">("event");
  const [selectedFlyerModel, setSelectedFlyerModel] = useState<number | null>(
    null
  );
  const [showFlyerModels, setShowFlyerModels] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loadingExperiences, setLoadingExperiences] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "events" | "experiences" | "appointments"
  >("events");

  // États pour la gestion des rendez-vous
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

  // Pour le flyer Carrés/Losanges
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

  // Réf pour l'aperçu Cercles
  const flyerCirclesRef = React.useRef<HTMLDivElement>(null);
  const handleDownloadFlyerCircles = async () => {
    if (!flyerCirclesRef.current) return;
    const canvas = await html2canvas(flyerCirclesRef.current, {
      background: "transparent",
    });
    const link = document.createElement("a");
    link.download = `flyer-cercles.png`;
    link.href = canvas.toDataURL();
    link.click();
  };
  // Réf pour l'aperçu Carrés
  const flyerSquaresRef = React.useRef<HTMLDivElement>(null);
  const handleDownloadFlyerSquares = async () => {
    if (!flyerSquaresRef.current) return;
    const canvas = await html2canvas(flyerSquaresRef.current, {
      background: "transparent",
    });
    const link = document.createElement("a");
    link.download = `flyer-carres.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Charger les événements existants
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/rabab/api/db_connect.php?action=get_events`
        );
        const data = await response.json();
        if (data.success) {
          setEvents(data.data);
        }
      } catch {
        toast.error("Erreur lors du chargement des événements.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Charger les expériences/avis
  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/rabab/api/db_connect.php?action=get_experiences&all=1`
        );
        const data = await response.json();
        if (data.success) {
          setExperiences(data.data);
        }
      } catch {
        toast.error("Erreur lors du chargement des avis.");
      } finally {
        setLoadingExperiences(false);
      }
    };
    fetchExperiences();
  }, []);

  // Charger les rendez-vous
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/rabab/api/db_connect.php?action=get_reservations`
        );
        const data = await response.json();
        if (data.success) {
          setAppointments(data.data);
        }
      } catch {
        toast.error("Erreur lors du chargement des rendez-vous.");
      } finally {
        setLoadingAppointments(false);
      }
    };
    fetchAppointments();
  }, []);

  // Gérer le changement de champ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Gérer l'image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm((prev) => ({ ...prev, image: e.target.files![0] }));
    }
  };

  // Gestion des champs Cercles
  const handleFlyerCirclesChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFlyerCircles((prev) => ({ ...prev, [name]: value }));
  };
  const handleFlyerCirclesImage = (idx: 1 | 2 | 3, file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFlyerCircles((prev) => ({
      ...prev,
      [`image${idx}`]: file,
      [`image${idx}Url`]: url,
    }));
  };

  // Gestion des champs Carrés/Losanges
  const handleFlyerSquaresChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFlyerSquares((prev) => ({ ...prev, [name]: value }));
  };
  const handleFlyerSquaresImage = (idx: 1 | 2 | 3, file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFlyerSquares((prev) => ({
      ...prev,
      [`image${idx}`]: file,
      [`image${idx}Url`]: url,
    }));
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const formData = new FormData();
      const isEditing = editingEvent !== null;
      formData.append("action", isEditing ? "update_event" : "add_event");

      if (isEditing) {
        formData.append("id", editingEvent.id.toString());
      }

      formData.append("titre", form.titre);
      formData.append("description", form.description);
      formData.append("date_event", form.date_event);
      formData.append("date_fin", form.date_fin);
      formData.append("prix", form.prix);
      formData.append("devise", form.devise);
      if (form.image) formData.append("image", form.image);

      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        toast.success(
          `Événement ${isEditing ? "modifié" : "ajouté"} avec succès !`
        );
        setForm({
          titre: "",
          description: "",
          date_event: "",
          date_fin: "",
          prix: "",
          devise: "€",
          image: null,
        });
        setEditingEvent(null);
        // Recharger la liste
        const refresh = await fetch(
          `${API_BASE}/rabab/api/db_connect.php?action=get_events`
        );
        const refreshData = await refresh.json();
        if (refreshData.success) setEvents(refreshData.data);
      } else {
        toast.error(
          data.message ||
            `Erreur lors de ${isEditing ? "la modification" : "l'ajout"}.`
        );
      }
    } catch {
      toast.error("Erreur lors de l'envoi du formulaire.");
    } finally {
      setSubmitting(false);
    }
  };

  // Soumission du flyer Cercles
  const handleSubmitFlyerCircles = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Soumission flyer cercles", flyerCircles);
    if (!flyerCirclesRef.current) {
      toast.error("Erreur : aperçu flyer non disponible.");
      return;
    }
    // Générer l'image fusionnée du flyer
    const canvas = await html2canvas(flyerCirclesRef.current, {
      background: "transparent",
    });
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!blob) {
      toast.error("Erreur lors de la génération de l'image du flyer.");
      return;
    }
    const file = new File([blob], `flyer-cercles-${Date.now()}.png`, {
      type: "image/png",
    });
    const formData = new FormData();
    const isEditing = editingEvent !== null;
    formData.append("action", isEditing ? "update_event" : "add_flyer");

    if (isEditing) {
      formData.append("id", editingEvent.id.toString());
    }

    formData.append("titre", flyerCircles.titre);
    formData.append("sous_titre", flyerCircles.sousTitre);
    formData.append("date_event", flyerCircles.date);
    formData.append("date_fin", flyerCircles.date_fin);
    formData.append("lieu", flyerCircles.lieu);
    formData.append("texte", flyerCircles.texte);
    formData.append("modele", "cercles");
    formData.append("image", file);
    formData.append("prix", flyerCircles.prix);
    formData.append("devise", flyerCircles.devise);
    try {
      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("Réponse API flyer:", data);
      if (data.success) {
        toast.success(
          `Flyer ${isEditing ? "modifié" : "ajouté"} avec succès !`
        );
        setFlyerCircles({
          titre: "",
          sousTitre: "",
          date: "",
          date_fin: "",
          prix: "",
          devise: "€",
          lieu: "",
          texte: "",
          image1: null,
          image2: null,
          image3: null,
          image1Url: "",
          image2Url: "",
          image3Url: "",
        });
        setSelectedFlyerModel(null);
        setEditingEvent(null);
        // Recharger la liste des événements
        const refresh = await fetch(
          `${API_BASE}/rabab/api/db_connect.php?action=get_events`
        );
        const refreshData = await refresh.json();
        if (refreshData.success) setEvents(refreshData.data);
      } else {
        toast.error(
          (data && data.message) || "Erreur lors de l'ajout du flyer."
        );
      }
    } catch (err) {
      toast.error(
        "Erreur lors de l'envoi du flyer : " +
          (err instanceof Error ? err.message : String(err))
      );
      console.error("Erreur lors de l'envoi du flyer:", err);
    }
  };
  // Soumission du flyer Carrés/Losanges
  const handleSubmitFlyerSquares = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flyerSquaresRef.current) {
      toast.error("Erreur : aperçu flyer non disponible.");
      return;
    }
    // Générer l'image fusionnée du flyer Carrés
    const canvas = await html2canvas(flyerSquaresRef.current, {
      background: "transparent",
    });
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!blob) {
      toast.error("Erreur lors de la génération de l'image du flyer.");
      return;
    }
    const file = new File([blob], `flyer-carres-${Date.now()}.png`, {
      type: "image/png",
    });
    const formData = new FormData();
    const isEditing = editingEvent !== null;
    formData.append("action", isEditing ? "update_event" : "add_flyer");

    if (isEditing) {
      formData.append("id", editingEvent.id.toString());
    }

    formData.append("titre", flyerSquares.titre);
    formData.append("sous_titre", flyerSquares.sousTitre);
    formData.append("date_event", flyerSquares.date);
    formData.append("date_fin", flyerSquares.date_fin);
    formData.append("lieu", flyerSquares.lieu);
    formData.append("texte", flyerSquares.texte);
    formData.append("modele", "carres");
    formData.append("image", file);
    formData.append("prix", flyerSquares.prix);
    formData.append("devise", flyerSquares.devise);
    try {
      const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        toast.success(
          `Flyer ${isEditing ? "modifié" : "ajouté"} avec succès !`
        );
        setFlyerSquares({
          titre: "",
          sousTitre: "",
          date: "",
          date_fin: "",
          prix: "",
          devise: "€",
          lieu: "",
          texte: "",
          image1: null,
          image2: null,
          image3: null,
          image1Url: "",
          image2Url: "",
          image3Url: "",
        });
        setSelectedFlyerModel(null);
        setEditingEvent(null);
        // Recharger la liste des événements
        const refresh = await fetch(
          `${API_BASE}/rabab/api/db_connect.php?action=get_events`
        );
        const refreshData = await refresh.json();
        if (refreshData.success) setEvents(refreshData.data);
      } else {
        toast.error(data.message || "Erreur lors de l'ajout du flyer.");
      }
    } catch (err) {
      toast.error(
        "Erreur lors de l'envoi du flyer : " +
          (err instanceof Error ? err.message : String(err))
      );
      console.error("Erreur lors de l'envoi du flyer:", err);
    }
  };

  // Gestion du formulaire de connexion
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const response = await fetch(
        `${API_BASE}/rabab/api/login.php?username=${encodeURIComponent(
          usernameInput
        )}&password=${encodeURIComponent(passwordInput)}`
      );
      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem("admin_auth", "true");
        setAuthError(null);
      } else {
        setAuthError(data.message || "Erreur d'authentification");
      }
    } catch {
      setAuthError("Erreur de connexion au serveur.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_auth");
    setUsernameInput("");
    setPasswordInput("");
  };

  // Fonction pour éditer un événement
  const handleEditEvent = (eventItem: EventItem) => {
    setEditingEvent(eventItem);

    // Détecter le type d'événement
    const isFlyer =
      (eventItem.modele && eventItem.modele !== "") ||
      eventItem.type === "flyer";

    if (isFlyer) {
      // C'est un flyer - définir le type et le modèle
      setEventType("flyer");

      // Déterminer quel modèle de flyer
      if (eventItem.modele === "cercles") {
        setSelectedFlyerModel(1);
        setFlyerCircles({
          titre: eventItem.titre,
          sousTitre: eventItem.sous_titre || "",
          date: eventItem.date_event,
          date_fin: eventItem.date_fin,
          prix: eventItem.prix,
          devise: eventItem.devise,
          lieu: eventItem.lieu || "",
          texte: eventItem.texte || eventItem.description,
          image1: null,
          image2: null,
          image3: null,
          image1Url: eventItem?.image_url
            ? `https://rababali.com${eventItem?.image_url}`
            : "",
          image2Url: "", // Les flyers complexes n'ont qu'une image fusionnée
          image3Url: "",
        });
      } else if (eventItem.modele === "carres") {
        setSelectedFlyerModel(2);
        setFlyerSquares({
          titre: eventItem.titre,
          sousTitre: eventItem.sous_titre || "",
          date: eventItem.date_event,
          date_fin: eventItem.date_fin,
          prix: eventItem.prix,
          devise: eventItem.devise,
          lieu: eventItem.lieu || "",
          texte: eventItem.texte || eventItem.description,
          image1: null,
          image2: null,
          image3: null,
          image1Url: eventItem?.image_url
            ? `https://rababali.com${eventItem.image_url}`
            : "",
          image2Url: "",
          image3Url: "",
        });
      } else if (eventItem.modele === "sobre") {
        setSelectedFlyerModel(10);
        setFlyerSquares({
          titre: eventItem.titre,
          sousTitre: eventItem.sous_titre || "",
          date: eventItem.date_event,
          date_fin: eventItem.date_fin,
          prix: eventItem.prix,
          devise: eventItem.devise,
          lieu: eventItem.lieu || "",
          texte: eventItem.texte || eventItem.description,
          image1: null,
          image2: null,
          image3: null,
          image1Url: eventItem?.image_url
            ? `https://rababali.com${eventItem.image_url}`
            : "",
          image2Url: "",
          image3Url: "",
        });
      } else if (eventItem.modele === "externe") {
        setSelectedFlyerModel(11);
        setFlyerSquares({
          titre: eventItem.titre,
          sousTitre: eventItem.sous_titre || "",
          date: eventItem.date_event,
          date_fin: eventItem.date_fin,
          prix: eventItem.prix,
          devise: eventItem.devise,
          lieu: eventItem.lieu || "",
          texte: eventItem.texte || eventItem.description,
          image1: null,
          image2: null,
          image3: null,
          image1Url: eventItem?.image_url
            ? `https://rababali.com${eventItem.image_url}`
            : "",
          image2Url: "",
          image3Url: "",
        });
      } else if (eventItem.modele === "fond_image") {
        setSelectedFlyerModel(12);
        setFlyerSquares({
          titre: eventItem.titre,
          sousTitre: eventItem.sous_titre || "",
          date: eventItem.date_event,
          date_fin: eventItem.date_fin,
          prix: eventItem.prix,
          devise: eventItem.devise,
          lieu: eventItem.lieu || "",
          texte: eventItem.texte || eventItem.description,
          image1: null,
          image2: null,
          image3: null,
          image1Url: eventItem?.image_url
            ? `https://rababali.com${eventItem.image_url}`
            : "",
          image2Url: "",
          image3Url: "",
        });
      } else {
        // Autres modèles de flyers
        setSelectedFlyerModel(null);
      }

      setShowFlyerModels(true); // Afficher les modèles pour l'édition
    } else {
      // C'est un événement classique
      setEventType("event");
      setForm({
        titre: eventItem.titre,
        description: eventItem.description,
        date_event: eventItem.date_event,
        date_fin: eventItem.date_fin,
        prix: eventItem.prix,
        devise: eventItem.devise,
        image: null, // L'image sera optionnelle lors de la modification
      });
    }

    // Défiler vers le formulaire
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Ajout de la fonction de suppression d'événement
  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet événement ?"))
      return;
    try {
      const response = await fetch(
        `${API_BASE}/rabab/api/db_connect.php?action=delete_event&id=${id}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Événement supprimé avec succès !");
        setEvents((prev) => prev.filter((e) => e.id !== id));
      } else {
        toast.error(data.message || "Erreur lors de la suppression.");
      }
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Suppression d'un avis
  const handleDeleteExperience = async (id: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet avis ?")) return;
    try {
      const response = await fetch(
        `${API_BASE}/rabab/api/db_connect.php?action=delete_experience&id=${id}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Avis supprimé avec succès !");
        setExperiences((prev) => prev.filter((e) => e.id !== id));
      } else {
        toast.error(data.message || "Erreur lors de la suppression de l'avis.");
      }
    } catch {
      toast.error("Erreur lors de la suppression de l'avis.");
    }
  };

  // Fonction pour valider/refuser un avis
  const handleModerateExperience = async (
    id: number,
    statut: "valide" | "refuse"
  ) => {
    try {
      const response = await fetch(
        `${API_BASE}/rabab/api/db_connect.php?action=moderate_experience&id=${id}&statut=${statut}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(
          `Avis ${statut === "valide" ? "validé" : "refusé"} avec succès !`
        );
        setExperiences((prev) =>
          prev.map((e) => (e.id === id ? { ...e, statut } : e))
        );
      } else {
        toast.error(data.message || "Erreur lors de la modération de l'avis.");
      }
    } catch {
      toast.error("Erreur lors de la modération de l'avis.");
    }
  };

  // === FONCTIONS DE GESTION DES RENDEZ-VOUS ===

  // Gestion du formulaire de rendez-vous
  const handleAppointmentFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setAppointmentForm((prev) => ({ ...prev, [name]: value }));
  };

  // Ouvrir le modal pour ajouter un rendez-vous
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

  // Ouvrir le modal pour modifier un rendez-vous
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

  // Supprimer un rendez-vous
  const handleDeleteAppointment = async (id: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce rendez-vous ?"))
      return;

    try {
      const response = await fetch(
        `${API_BASE}/rabab/api/db_connect.php?action=delete_reservation&id=${id}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Rendez-vous supprimé avec succès !");
        setAppointments((prev) => prev.filter((apt) => apt.id !== id));
      } else {
        toast.error(
          data.message || "Erreur lors de la suppression du rendez-vous."
        );
      }
    } catch {
      toast.error("Erreur lors de la suppression du rendez-vous.");
    }
  };

  // Sauvegarder un rendez-vous (ajouter ou modifier)
  // Fonctions d'export comptabilité
  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const today = new Date().toLocaleDateString("fr-FR");
    const paidAppointments = appointments.filter(
      (appt) => appt.statut === "confirmee"
    );
    const pendingAppointments = appointments.filter(
      (appt) => appt.statut === "en_attente"
    );
    const totalPaid = paidAppointments.reduce(
      (total, appt) => total + (Number(appt.montant) || 0),
      0
    );
    const totalPending = pendingAppointments.reduce(
      (total, appt) => total + (Number(appt.montant) || 0),
      0
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapport Comptable - ${today}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4682B4; padding-bottom: 15px; }
            .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .summary-item { text-align: center; }
            .summary-value { font-size: 1.5em; font-weight: bold; color: #4682B4; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 8px 12px; text-align: left; border: 1px solid #ddd; }
            th { background-color: #4682B4; color: white; }
            .status-paid { color: #28a745; font-weight: bold; }
            .status-pending { color: #ffc107; font-weight: bold; }
            .status-cancelled { color: #dc3545; font-weight: bold; }
            .totals { margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 8px; }
            .footer { margin-top: 30px; text-align: center; font-size: 0.9em; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Rapport Comptable - Rendez-vous</h1>
            <p>Généré le ${today} | Total rendez-vous: ${
      appointments.length
    }</p>
          </div>

          <div class="summary">
            <h3>📈 Résumé Financier</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value">${totalPaid.toFixed(2)} CHF</div>
                <div>Revenus Encaissés</div>
                <div><small>(${
                  paidAppointments.length
                } rendez-vous payés)</small></div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${totalPending.toFixed(2)} CHF</div>
                <div>En Attente de Paiement</div>
                <div><small>(${
                  pendingAppointments.length
                } rendez-vous en attente)</small></div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Heure</th>
                <th>Client</th>
                <th>Service</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${appointments
                .sort(
                  (a, b) =>
                    new Date(a.date_reservation).getTime() -
                    new Date(b.date_reservation).getTime()
                )
                .map(
                  (appt) => `
                  <tr>
                    <td>${formatDateFr(appt.date_reservation)}</td>
                    <td>${appt.heure_reservation}</td>
                    <td>${appt.nom}</td>
                    <td>${
                      appt.service_type === "seance_online"
                        ? "En ligne"
                        : "Présentiel"
                    }</td>
                    <td>${Number(appt.montant).toFixed(2)} CHF</td>
                    <td class="status-${
                      appt.statut === "confirmee"
                        ? "paid"
                        : appt.statut === "en_attente"
                        ? "pending"
                        : "cancelled"
                    }">
                      ${
                        appt.statut === "confirmee"
                          ? "✅ Payé"
                          : appt.statut === "en_attente"
                          ? "⏳ En attente"
                          : appt.statut === "annulee"
                          ? "❌ Annulé"
                          : appt.statut
                      }
                    </td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <h3>💰 Totaux</h3>
            <p><strong>Total Encaissé:</strong> ${totalPaid.toFixed(2)} CHF</p>
            <p><strong>Total En Attente:</strong> ${totalPending.toFixed(
              2
            )} CHF</p>
            <p><strong>Total Potentiel:</strong> ${(
              totalPaid + totalPending
            ).toFixed(2)} CHF</p>
            <p><strong>Taux de Paiement:</strong> ${
              appointments.filter((a) => a.statut !== "annulee").length > 0
                ? Math.round(
                    (paidAppointments.length /
                      appointments.filter((a) => a.statut !== "annulee")
                        .length) *
                      100
                  )
                : 0
            }%</p>
          </div>

          <div class="footer">
            <p>Rapport généré automatiquement | © ${new Date().getFullYear()}</p>
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
                 <img src="/images/logo.png" alt="Logo Rabab Ali" style="width: 60px; height: 60px; object-fit: contain;" />
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
              appointment.statut === "confirmee"
                ? "status-paid"
                : appointment.statut === "en_attente"
                ? "status-pending"
                : "status-cancelled"
            }">
              ${
                appointment.statut === "confirmee"
                  ? "✅ PAYÉ"
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
            appointment.statut === "confirmee"
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
        formatDateFr(appt.date_reservation),
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

  const handleSaveAppointment = async (e: React.FormEvent) => {
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

        // Recharger la liste des rendez-vous
        const refreshResponse = await fetch(
          `${API_BASE}/rabab/api/db_connect.php?action=get_reservations`
        );
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setAppointments(refreshData.data);
        }

        setShowAppointmentModal(false);
      } else {
        toast.error(
          data.message || "Erreur lors de la sauvegarde du rendez-vous."
        );
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde du rendez-vous.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div
        className="admin-form"
        style={{
          maxWidth: 400,
          margin: "6rem auto",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#4682B4",
            fontFamily: "Playfair Display, serif",
            fontSize: "2rem",
            marginBottom: "2rem",
          }}
        >
          Accès Admin
        </h1>
        <form onSubmit={handleAuthSubmit}>
          <label
            style={{
              fontWeight: 600,
              color: "#4682B4",
              display: "block",
              marginBottom: 8,
            }}
          >
            Nom d'utilisateur
          </label>
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "2px solid #e0e0e0",
              fontSize: "1rem",
              marginBottom: 16,
            }}
            autoFocus
          />
          <label
            style={{
              fontWeight: 600,
              color: "#4682B4",
              display: "block",
              marginBottom: 8,
            }}
          >
            Mot de passe
          </label>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "2px solid #e0e0e0",
              fontSize: "1rem",
              marginBottom: 16,
            }}
          />
          {authError && (
            <div
              style={{
                color: "#b22222",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {authError}
            </div>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              background: "#4682B4",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.7rem",
              fontWeight: 600,
              fontSize: "1.1rem",
              cursor: "pointer",
            }}
          >
            Se connecter
          </button>
        </form>
      </div>
    );
  }

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
          ? "des avis"
          : "des rendez-vous"}
      </h1>
      {message && <div className="admin-message">{message}</div>}
      {/* Onglets de navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "2rem 0 2.5rem",
        }}
      >
        <button
          onClick={() => setActiveTab("events")}
          style={{
            padding: "10px 24px",
            borderRadius: "8px 0 0 8px",
            border: "2px solid #4682B4",
            background: activeTab === "events" ? "#4682B4" : "#fff",
            color: activeTab === "events" ? "#fff" : "#4682B4",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            outline: "none",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          Événements
        </button>
        <button
          onClick={() => setActiveTab("experiences")}
          style={{
            padding: "10px 24px",
            borderRadius: "0",
            border: "2px solid #4682B4",
            borderLeft: "none",
            background: activeTab === "experiences" ? "#4682B4" : "#fff",
            color: activeTab === "experiences" ? "#fff" : "#4682B4",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            outline: "none",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          Témoignages
        </button>
        <button
          onClick={() => setActiveTab("appointments")}
          style={{
            padding: "10px 24px",
            borderRadius: "0 8px 8px 0",
            border: "2px solid #4682B4",
            borderLeft: "none",
            background: activeTab === "appointments" ? "#4682B4" : "#fff",
            color: activeTab === "appointments" ? "#fff" : "#4682B4",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            outline: "none",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          Rendez-vous
        </button>
      </div>
      {/* Section Événements */}
      {activeTab === "events" && (
        <>
          {/* Sélecteur de type d'événement et formulaires */}
          <div className="admin-type-selector">
            <label
              style={{
                fontWeight: 600,
                color: eventType === "event" ? "#4682B4" : "#888",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="eventType"
                value="event"
                checked={eventType === "event"}
                onChange={() => setEventType("event")}
                style={{ marginRight: 8 }}
              />
              Événement classique
            </label>
            <label
              style={{
                fontWeight: 600,
                color: eventType === "flyer" ? "#4682B4" : "#888",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="eventType"
                value="flyer"
                checked={eventType === "flyer"}
                onChange={() => setEventType("flyer")}
                style={{ marginRight: 8 }}
              />
              Flyer
            </label>
          </div>
          {/* Formulaire selon le type choisi */}
          {eventType === "event" ? (
            <form onSubmit={handleSubmit} className="admin-form">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <h2
                  style={{
                    color: "#4682B4",
                    fontSize: "1.3rem",
                    margin: 0,
                  }}
                >
                  {editingEvent
                    ? "Modifier un événement"
                    : "Ajouter un événement"}
                </h2>
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent(null);
                      setForm({
                        titre: "",
                        description: "",
                        date_event: "",
                        date_fin: "",
                        prix: "",
                        devise: "€",
                        image: null,
                      });
                    }}
                    style={{
                      background: "#888",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Annuler
                  </button>
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontWeight: 600,
                    color: "#4682B4",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Titre *
                </label>
                <input
                  type="text"
                  name="titre"
                  value={form.titre}
                  onChange={handleChange}
                  required
                  maxLength={200}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "2px solid #e0e0e0",
                    fontSize: "1rem",
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontWeight: 600,
                    color: "#4682B4",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Description{" "}
                  {editingEvent && editingEvent.modele === "externe"
                    ? "(optionnel)"
                    : "*"}
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required={
                    !(editingEvent && editingEvent.modele === "externe")
                  }
                  rows={4}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "2px solid #e0e0e0",
                    fontSize: "1rem",
                    resize: "vertical",
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontWeight: 600,
                    color: "#4682B4",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Date de l'événement *
                </label>
                <input
                  type="date"
                  name="date_event"
                  value={form.date_event}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "2px solid #e0e0e0",
                    fontSize: "1rem",
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontWeight: 600,
                    color: "#4682B4",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Date de fin *
                </label>
                <input
                  type="date"
                  name="date_fin"
                  value={form.date_fin}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "2px solid #e0e0e0",
                    fontSize: "1rem",
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontWeight: 600,
                    color: "#4682B4",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Prix *
                </label>
                <input
                  type="text"
                  name="prix"
                  value={form.prix}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "2px solid #e0e0e0",
                    fontSize: "1rem",
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontWeight: 600,
                    color: "#4682B4",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Devise *
                </label>
                <select
                  name="devise"
                  value={form.devise}
                  onChange={handleSelectChange}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "2px solid #e0e0e0",
                    fontSize: "1rem",
                  }}
                >
                  <option value="€">€</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontWeight: 600,
                    color: "#4682B4",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Flyer / Image{" "}
                  {editingEvent
                    ? "(optionnel - garder actuelle ou changer)"
                    : ""}
                </label>

                {/* Affichage de l'image actuelle en mode édition */}
                {editingEvent && editingEvent.image_url && (
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#666",
                        marginBottom: 6,
                      }}
                    >
                      Image actuelle :
                    </div>
                    <img
                      src={`https://rababali.com${editingEvent.image_url}`}
                      alt="Image actuelle"
                      style={{
                        maxWidth: "200px",
                        maxHeight: "150px",
                        objectFit: "cover",
                        borderRadius: 6,
                        border: "2px solid #e0e0e0",
                      }}
                    />
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />

                {editingEvent && (
                  <div
                    style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}
                  >
                    Laisser vide pour conserver l'image actuelle
                  </div>
                )}
              </div>
              <div style={{ textAlign: "center" }}>
                <button
                  type="submit"
                  className="btn-magical zoom-hover"
                  style={{
                    fontSize: "1.1rem",
                    minWidth: 180,
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                  disabled={submitting}
                >
                  {submitting
                    ? `⏳ ${
                        editingEvent ? "Modification" : "Ajout"
                      } en cours...`
                    : `${editingEvent ? "Modifier" : "Ajouter"} l'événement`}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <h2
                style={{
                  color: "#4682B4",
                  fontSize: "1.3rem",
                  marginBottom: 18,
                  textAlign: "center",
                }}
              >
                Choisissez un modèle de flyer
              </h2>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <button
                  type="button"
                  className="admin-flyer-btn"
                  onClick={() => setShowFlyerModels((v) => !v)}
                >
                  {showFlyerModels
                    ? "Masquer les modèles"
                    : "Afficher les modèles"}
                </button>
              </div>
              {showFlyerModels && (
                <div className="admin-flyer-models">
                  <div
                    className={`admin-flyer-model${
                      selectedFlyerModel === 1 ? " selected" : ""
                    }`}
                    onClick={() => setSelectedFlyerModel(1)}
                  >
                    <img
                      src="/images/flyers/flyers1.jpg"
                      alt="Modèle Cercles"
                    />
                    <div className="admin-flyer-model-label">Cercles</div>
                  </div>
                  <div
                    className={`admin-flyer-model${
                      selectedFlyerModel === 2 ? " selected" : ""
                    }`}
                    onClick={() => setSelectedFlyerModel(2)}
                  >
                    <img src="/images/flyers/flyers2.jpg" alt="Modèle Carrés" />
                    <div className="admin-flyer-model-label">
                      Carrés/Losanges
                    </div>
                  </div>
                  <div
                    className={`admin-flyer-model${
                      selectedFlyerModel === 3 ? " selected" : ""
                    }`}
                    onClick={() => setSelectedFlyerModel(3)}
                  >
                    <img
                      src="/images/flyers/flyers3.jpg"
                      alt="Modèle Plantes"
                    />
                    <div className="admin-flyer-model-label">Plantes</div>
                  </div>
                  <div
                    className={`admin-flyer-model${
                      selectedFlyerModel === 4 ? " selected" : ""
                    }`}
                    onClick={() => setSelectedFlyerModel(4)}
                  >
                    <img
                      src="/images/flyers/flyers4.jpg"
                      alt="Modèle Pétales bleues"
                    />
                    <div className="admin-flyer-model-label">
                      Pétales bleues
                    </div>
                  </div>
                  <div
                    className={`admin-flyer-model${
                      selectedFlyerModel === 5 ? " selected" : ""
                    }`}
                    onClick={() => setSelectedFlyerModel(5)}
                  >
                    <img
                      src="/images/flyers/flyers5.jpg"
                      alt="Modèle Pont lumineux"
                    />
                    <div className="admin-flyer-model-label">Pont lumineux</div>
                  </div>
                  <div
                    className={`admin-flyer-model${
                      selectedFlyerModel === 6 ? " selected" : ""
                    }`}
                    onClick={() => setSelectedFlyerModel(6)}
                  >
                    <img
                      src="/images/flyers/flyers6.jpg"
                      alt="Modèle Motifs arabes"
                    />
                    <div className="admin-flyer-model-label">Motifs arabes</div>
                  </div>
                  <div
                    className={`admin-flyer-model${
                      selectedFlyerModel === 7 ? " selected" : ""
                    }`}
                    onClick={() => setSelectedFlyerModel(7)}
                  >
                    <img
                      src="/images/flyers/flyers7.jpg"
                      alt="Modèle Papyrus doré"
                    />
                    <div className="admin-flyer-model-label">Papyrus doré</div>
                  </div>
                  <div
                    className={`admin-flyer-model${
                      selectedFlyerModel === 8 ? " selected" : ""
                    }`}
                    onClick={() => setSelectedFlyerModel(8)}
                  >
                    <img
                      src="/images/flyers/flyers8.jpg"
                      alt="Modèle Robe rouge"
                    />
                    <div className="admin-flyer-model-label">Robe rouge</div>
                  </div>
                  <div
                    className={`admin-flyer-model${
                      selectedFlyerModel === 9 ? " selected" : ""
                    }`}
                    onClick={() => setSelectedFlyerModel(9)}
                  >
                    <img
                      src="/images/flyers/flyers9.jpg"
                      alt="Modèle Rideau blanc"
                    />
                    <div className="admin-flyer-model-label">Rideau blanc</div>
                  </div>
                  <div
                    className={`admin-flyer-model${
                      selectedFlyerModel === 10 ? " selected" : ""
                    }`}
                    onClick={() => setSelectedFlyerModel(10)}
                  >
                    <div
                      style={{
                        width: 120,
                        height: 180,
                        background: "#fff",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        border: "2px solid #eee",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ flex: 1 }} />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          marginRight: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            background: "#e0e0e0",
                            borderRadius: 6,
                          }}
                        />
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            background: "#e0e0e0",
                            borderRadius: 6,
                          }}
                        />
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            background: "#e0e0e0",
                            borderRadius: 6,
                          }}
                        />
                      </div>
                    </div>
                    <div className="admin-flyer-model-label">
                      Sobre (3 images à droite)
                    </div>
                  </div>
                  <div
                    className={`admin-flyer-model${
                      selectedFlyerModel === 11 ? " selected" : ""
                    }`}
                    onClick={() => setSelectedFlyerModel(11)}
                  >
                    <div
                      style={{
                        width: 120,
                        height: 180,
                        background: "#f5f5f5",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        border: "2px solid #eee",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <span style={{ color: "#888", fontSize: 32 }}>🖼️</span>
                      <span
                        style={{ color: "#888", fontSize: 13, marginTop: 8 }}
                      >
                        Importé
                      </span>
                    </div>
                    <div className="admin-flyer-model-label">Flyer importé</div>
                  </div>
                  <div
                    className={`admin-flyer-model${
                      selectedFlyerModel === 12 ? " selected" : ""
                    }`}
                    onClick={() => setSelectedFlyerModel(12)}
                  >
                    <div
                      style={{
                        width: 120,
                        height: 180,
                        background: "#e0e0e0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        border: "2px solid #eee",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <span style={{ color: "#888", fontSize: 32 }}>🖼️</span>
                    </div>
                    <div className="admin-flyer-model-label">
                      Image fond + texte
                    </div>
                  </div>
                  <div
                    className={`admin-flyer-model${
                      selectedFlyerModel === 13 ? " selected" : ""
                    }`}
                    onClick={() => setSelectedFlyerModel(13)}
                  >
                    <div
                      style={{
                        width: 120,
                        height: 180,
                        background: "#f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        border: "2px solid #eee",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <span style={{ color: "#888", fontSize: 32 }}>🎨</span>
                    </div>
                    <div className="admin-flyer-model-label">
                      Libre (personnalisé)
                    </div>
                  </div>
                </div>
              )}
              {/* Formulaire dynamique selon le modèle choisi */}
              {selectedFlyerModel === 1 && (
                <div className="admin-flyer-form">
                  <h3 style={{ color: "#4682B4", marginBottom: 16 }}>
                    Flyer Cercles
                  </h3>
                  <form
                    onSubmit={handleSubmitFlyerCircles}
                    className="admin-flyer-form-flex"
                  >
                    <div className="admin-flyer-form-col">
                      <label>Titre</label>
                      <input
                        type="text"
                        name="titre"
                        value={flyerCircles.titre}
                        onChange={handleFlyerCirclesChange}
                      />
                      <label>Sous-titre (optionnel)</label>
                      <input
                        type="text"
                        name="sousTitre"
                        value={flyerCircles.sousTitre}
                        onChange={handleFlyerCirclesChange}
                        placeholder="Laisser vide si pas de sous-titre"
                      />
                      <label>Date</label>
                      <input
                        type="date"
                        name="date"
                        value={flyerCircles.date}
                        onChange={handleFlyerCirclesChange}
                      />
                      <label>Date de fin</label>
                      <input
                        type="date"
                        name="date_fin"
                        value={flyerCircles.date_fin}
                        onChange={handleFlyerCirclesChange}
                      />
                      <label>Lieu</label>
                      <input
                        type="text"
                        name="lieu"
                        value={flyerCircles.lieu}
                        onChange={handleFlyerCirclesChange}
                      />
                      <label>Texte additionnel</label>
                      <textarea
                        name="texte"
                        value={flyerCircles.texte}
                        onChange={handleFlyerCirclesChange}
                        rows={3}
                        placeholder="Ajoutez un texte libre..."
                      />
                      <div style={{ marginBottom: 10 }}>
                        {editingEvent && editingEvent.image_url && (
                          <div
                            style={{
                              marginBottom: 15,
                              padding: 10,
                              backgroundColor: "#f8f9fa",
                              borderRadius: 6,
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.9rem",
                                color: "#495057",
                                marginBottom: 8,
                              }}
                            >
                              <strong>🖼️ Flyer actuel :</strong>
                            </div>
                            <img
                              src={`https://rababali.com${editingEvent.image_url}`}
                              alt="Flyer actuel"
                              style={{
                                maxWidth: "150px",
                                maxHeight: "200px",
                                objectFit: "cover",
                                borderRadius: 4,
                                border: "1px solid #dee2e6",
                              }}
                            />
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "#6c757d",
                                marginTop: 8,
                              }}
                            >
                              Pour modifier : ajoutez de nouvelles images
                              ci-dessous
                            </div>
                          </div>
                        )}

                        <label>Image Cercle 1</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFlyerCirclesImage(
                              1,
                              e.target.files?.[0] || null
                            )
                          }
                        />
                        <label>Image Cercle 2</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFlyerCirclesImage(
                              2,
                              e.target.files?.[0] || null
                            )
                          }
                        />
                        <label>Image Cercle 3</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFlyerCirclesImage(
                              3,
                              e.target.files?.[0] || null
                            )
                          }
                        />
                      </div>
                    </div>
                    {/* Aperçu en temps réel */}
                    <div
                      className="admin-flyer-form-col"
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <div
                        ref={flyerCirclesRef}
                        className="flyer-circles-preview"
                      >
                        {/* Cercles images positionnés précisément */}
                        <div className="flyer-cercle-img flyer-cercle1">
                          {flyerCircles.image1Url ? (
                            <img src={flyerCircles.image1Url} alt="" />
                          ) : (
                            <span style={{ color: "#bbb", fontSize: 12 }}>
                              Image 1
                            </span>
                          )}
                        </div>
                        <div className="flyer-cercle-img flyer-cercle2">
                          {flyerCircles.image2Url ? (
                            <img src={flyerCircles.image2Url} alt="" />
                          ) : (
                            <span style={{ color: "#bbb", fontSize: 12 }}>
                              Image 2
                            </span>
                          )}
                        </div>
                        <div className="flyer-cercle-img flyer-cercle3">
                          {flyerCircles.image3Url ? (
                            <img src={flyerCircles.image3Url} alt="" />
                          ) : (
                            <span style={{ color: "#bbb", fontSize: 12 }}>
                              Image 3
                            </span>
                          )}
                        </div>
                        {/* Textes */}
                        <div className="flyer-circles-titre">
                          {flyerCircles.titre || "Titre du flyer"}
                        </div>
                        {flyerCircles.sousTitre && (
                          <div className="flyer-circles-sous-titre">
                            {flyerCircles.sousTitre}
                          </div>
                        )}
                        <div className="flyer-circles-date">
                          {flyerCircles.date
                            ? formatDateFr(flyerCircles.date)
                            : "Date"}
                        </div>
                        {flyerCircles.date_fin && (
                          <div className="flyer-circles-date-fin">
                            Fin : {formatDateFr(flyerCircles.date_fin)}
                          </div>
                        )}
                        <div className="flyer-circles-lieu">
                          {flyerCircles.lieu || "Lieu"}
                        </div>
                        <div className="flyer-circles-texte">
                          {flyerCircles.texte}
                        </div>
                      </div>
                    </div>
                  </form>
                  <div className="admin-flyer-actions">
                    <button
                      type="submit"
                      onClick={handleSubmitFlyerCircles}
                      className="admin-flyer-btn"
                    >
                      Enregistrer le flyer
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadFlyerCircles}
                      className="admin-flyer-btn download"
                    >
                      Télécharger le flyer
                    </button>
                  </div>
                </div>
              )}
              {selectedFlyerModel === 2 && (
                <div className="admin-flyer-form">
                  <h3 style={{ color: "#4682B4", marginBottom: 16 }}>
                    Flyer Carrés/Losanges
                  </h3>
                  <form
                    onSubmit={handleSubmitFlyerSquares}
                    className="admin-flyer-form-flex"
                  >
                    <div className="admin-flyer-form-col">
                      <label>Titre</label>
                      <input
                        type="text"
                        name="titre"
                        value={flyerSquares.titre}
                        onChange={handleFlyerSquaresChange}
                      />
                      <label>Sous-titre (optionnel)</label>
                      <input
                        type="text"
                        name="sousTitre"
                        value={flyerSquares.sousTitre}
                        onChange={handleFlyerSquaresChange}
                        placeholder="Laisser vide si pas de sous-titre"
                      />
                      <label>Date</label>
                      <input
                        type="date"
                        name="date"
                        value={flyerSquares.date}
                        onChange={handleFlyerSquaresChange}
                      />
                      <label>Date de fin</label>
                      <input
                        type="date"
                        name="date_fin"
                        value={flyerSquares.date_fin}
                        onChange={handleFlyerSquaresChange}
                      />
                      <label>Lieu</label>
                      <input
                        type="text"
                        name="lieu"
                        value={flyerSquares.lieu}
                        onChange={handleFlyerSquaresChange}
                      />
                      <label>Texte additionnel</label>
                      <textarea
                        name="texte"
                        value={flyerSquares.texte}
                        onChange={handleFlyerSquaresChange}
                        rows={3}
                        placeholder="Ajoutez un texte libre..."
                      />
                      <div style={{ marginBottom: 10 }}>
                        {editingEvent && editingEvent.image_url && (
                          <div
                            style={{
                              marginBottom: 15,
                              padding: 10,
                              backgroundColor: "#f8f9fa",
                              borderRadius: 6,
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.9rem",
                                color: "#495057",
                                marginBottom: 8,
                              }}
                            >
                              <strong>🖼️ Flyer actuel :</strong>
                            </div>
                            <img
                              src={`https://rababali.com${editingEvent.image_url}`}
                              alt="Flyer actuel"
                              style={{
                                maxWidth: "150px",
                                maxHeight: "200px",
                                objectFit: "cover",
                                borderRadius: 4,
                                border: "1px solid #dee2e6",
                              }}
                            />
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "#6c757d",
                                marginTop: 8,
                              }}
                            >
                              Pour modifier : ajoutez de nouvelles images
                              ci-dessous
                            </div>
                          </div>
                        )}

                        <label>Image Carré 1</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFlyerSquaresImage(
                              1,
                              e.target.files?.[0] || null
                            )
                          }
                        />
                        <label>Image Carré 2</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFlyerSquaresImage(
                              2,
                              e.target.files?.[0] || null
                            )
                          }
                        />
                      </div>
                    </div>
                    {/* Aperçu en temps réel */}
                    <div
                      className="admin-flyer-form-col"
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <div
                        ref={flyerSquaresRef}
                        className="flyer-squares-preview"
                      >
                        {/* Carré 1 */}
                        <div className="flyer-carre-img flyer-carre1">
                          {flyerSquares.image1Url ? (
                            <img src={flyerSquares.image1Url} alt="" />
                          ) : (
                            <span style={{ color: "#bbb", fontSize: 12 }}>
                              Image 1
                            </span>
                          )}
                        </div>
                        {/* Carré 2 */}
                        <div className="flyer-carre-img flyer-carre2">
                          {flyerSquares.image2Url ? (
                            <img src={flyerSquares.image2Url} alt="" />
                          ) : (
                            <span style={{ color: "#bbb", fontSize: 12 }}>
                              Image 2
                            </span>
                          )}
                        </div>
                        {/* Textes */}
                        <div className="flyer-squares-titre">
                          {flyerSquares.titre || "Titre du flyer"}
                        </div>
                        {flyerSquares.sousTitre && (
                          <div className="flyer-squares-sous-titre">
                            {flyerSquares.sousTitre}
                          </div>
                        )}
                        <div className="flyer-squares-date">
                          {flyerSquares.date
                            ? formatDateFr(flyerSquares.date)
                            : "Date"}
                        </div>
                        {flyerSquares.date_fin && (
                          <div className="flyer-squares-date-fin">
                            Fin : {formatDateFr(flyerSquares.date_fin)}
                          </div>
                        )}
                        <div className="flyer-squares-lieu">
                          {flyerSquares.lieu || "Lieu"}
                        </div>
                        <div className="flyer-squares-texte">
                          {flyerSquares.texte}
                        </div>
                      </div>
                    </div>
                    <div className="admin-flyer-actions">
                      <button type="submit" className="admin-flyer-btn">
                        Enregistrer le flyer
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadFlyerSquares}
                        className="admin-flyer-btn download"
                      >
                        Télécharger le flyer
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {selectedFlyerModel === 10 && (
                <div className="admin-flyer-form">
                  <h3 style={{ color: "#4682B4", marginBottom: 16 }}>
                    Flyer Sobre (3 images à droite)
                  </h3>
                  <form
                    className="admin-flyer-form-flex"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!flyerSquaresRef.current) {
                        toast.error("Erreur : aperçu flyer non disponible.");
                        return;
                      }
                      const canvas = await html2canvas(
                        flyerSquaresRef.current,
                        {
                          background: "transparent",
                        }
                      );
                      const blob = await new Promise((resolve) =>
                        canvas.toBlob((b) => resolve(b), "image/png")
                      );
                      if (!blob) {
                        toast.error(
                          "Erreur lors de la génération de l'image du flyer."
                        );
                        return;
                      }
                      const file = new File(
                        [blob as Blob],
                        `flyer-sobre-${Date.now()}.png`,
                        { type: "image/png" }
                      );
                      const formData = new FormData();
                      const isEditing = editingEvent !== null;
                      formData.append(
                        "action",
                        isEditing ? "update_event" : "add_flyer"
                      );

                      if (isEditing) {
                        formData.append("id", editingEvent.id.toString());
                      }

                      formData.append("titre", flyerSquares.titre);
                      formData.append("sous_titre", flyerSquares.sousTitre);
                      formData.append("date_event", flyerSquares.date);
                      formData.append("date_fin", flyerSquares.date_fin);
                      formData.append("lieu", flyerSquares.lieu);
                      formData.append("texte", flyerSquares.texte);
                      formData.append("modele", "sobre");
                      formData.append("image", file);
                      formData.append("prix", flyerSquares.prix);
                      formData.append("devise", flyerSquares.devise);
                      try {
                        const response = await fetch(
                          `${API_BASE}/rabab/api/db_connect.php`,
                          {
                            method: "POST",
                            body: formData,
                          }
                        );
                        const data = await response.json();
                        if (data.success) {
                          toast.success(
                            `Flyer ${
                              isEditing ? "modifié" : "ajouté"
                            } avec succès !`
                          );
                          setFlyerSquares({
                            titre: "",
                            sousTitre: "",
                            date: "",
                            date_fin: "",
                            prix: "",
                            devise: "€",
                            lieu: "",
                            texte: "",
                            image1: null,
                            image2: null,
                            image3: null,
                            image1Url: "",
                            image2Url: "",
                            image3Url: "",
                          });
                          setSelectedFlyerModel(null);
                          setEditingEvent(null);
                          const refresh = await fetch(
                            `${API_BASE}/rabab/api/db_connect.php?action=get_events`
                          );
                          const refreshData = await refresh.json();
                          if (refreshData.success) setEvents(refreshData.data);
                        } else {
                          toast.error(
                            data.message || "Erreur lors de l'ajout du flyer."
                          );
                        }
                      } catch (err) {
                        toast.error(
                          "Erreur lors de l'envoi du flyer : " +
                            (err instanceof Error ? err.message : String(err))
                        );
                        console.error("Erreur lors de l'envoi du flyer:", err);
                      }
                    }}
                  >
                    <div className="admin-flyer-form-col">
                      <label>Titre</label>
                      <input
                        type="text"
                        name="titre"
                        value={flyerSquares.titre}
                        onChange={handleFlyerSquaresChange}
                      />
                      <label>Sous-titre (optionnel)</label>
                      <input
                        type="text"
                        name="sousTitre"
                        value={flyerSquares.sousTitre}
                        onChange={handleFlyerSquaresChange}
                        placeholder="Laisser vide si pas de sous-titre"
                      />
                      <label>Date</label>
                      <input
                        type="date"
                        name="date"
                        value={flyerSquares.date}
                        onChange={handleFlyerSquaresChange}
                      />
                      <label>Date de fin</label>
                      <input
                        type="date"
                        name="date_fin"
                        value={flyerSquares.date_fin}
                        onChange={handleFlyerSquaresChange}
                      />
                      <label>Lieu</label>
                      <input
                        type="text"
                        name="lieu"
                        value={flyerSquares.lieu}
                        onChange={handleFlyerSquaresChange}
                      />
                      <label>Texte additionnel</label>
                      <textarea
                        name="texte"
                        value={flyerSquares.texte}
                        onChange={handleFlyerSquaresChange}
                        rows={3}
                        placeholder="Ajoutez un texte libre..."
                      />
                      <div style={{ marginBottom: 10 }}>
                        {editingEvent && editingEvent.image_url && (
                          <div
                            style={{
                              marginBottom: 15,
                              padding: 10,
                              backgroundColor: "#f8f9fa",
                              borderRadius: 6,
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.9rem",
                                color: "#495057",
                                marginBottom: 8,
                              }}
                            >
                              <strong>🖼️ Flyer actuel :</strong>
                            </div>
                            <img
                              src={`https://rababali.com${editingEvent.image_url}`}
                              alt="Flyer actuel"
                              style={{
                                maxWidth: "150px",
                                maxHeight: "200px",
                                objectFit: "cover",
                                borderRadius: 4,
                                border: "1px solid #dee2e6",
                              }}
                            />
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "#6c757d",
                                marginTop: 8,
                              }}
                            >
                              Pour modifier : ajoutez de nouvelles images
                              ci-dessous
                            </div>
                          </div>
                        )}

                        <label>Image Carré 1</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFlyerSquaresImage(
                              1,
                              e.target.files?.[0] || null
                            )
                          }
                        />
                        <label>Image Carré 2</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFlyerSquaresImage(
                              2,
                              e.target.files?.[0] || null
                            )
                          }
                        />
                        <label>Image Carré 3</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFlyerSquaresImage(
                              3,
                              e.target.files?.[0] || null
                            )
                          }
                        />
                      </div>
                    </div>
                    <div
                      className="admin-flyer-form-col"
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <div
                        ref={flyerSquaresRef}
                        style={{
                          width: 260,
                          height: 390,
                          background: "#fff",
                          borderRadius: 12,
                          display: "flex",
                          flexDirection: "row",
                          boxShadow: "0 2px 12px #0001",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            padding: 18,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              color: "#4682B4",
                              fontWeight: 700,
                              fontSize: 18,
                              marginBottom: 8,
                            }}
                          >
                            {flyerSquares.titre || "Titre du flyer"}
                          </div>
                          {flyerSquares.sousTitre && (
                            <div
                              style={{
                                color: "#4682B4",
                                fontWeight: 500,
                                fontSize: 15,
                                marginBottom: 8,
                              }}
                            >
                              {flyerSquares.sousTitre}
                            </div>
                          )}
                          <div
                            style={{
                              color: "#f5c24b",
                              fontWeight: 600,
                              fontSize: 15,
                              marginBottom: 8,
                            }}
                          >
                            {flyerSquares.date
                              ? formatDateFr(flyerSquares.date)
                              : "Date"}
                          </div>
                          {flyerSquares.date_fin && (
                            <div className="flyer-squares-date-fin">
                              Fin : {formatDateFr(flyerSquares.date_fin)}
                            </div>
                          )}
                          <div
                            style={{
                              color: "#4682B4",
                              fontWeight: 600,
                              fontSize: 15,
                              marginBottom: 8,
                            }}
                          >
                            {flyerSquares.lieu || "Lieu"}
                          </div>
                          <div
                            style={{
                              color: "#222",
                              fontWeight: 400,
                              fontSize: 13,
                              marginTop: 8,
                              whiteSpace: "pre-line",
                            }}
                          >
                            {flyerSquares.texte}
                          </div>
                        </div>
                        <div
                          style={{
                            width: 70,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            marginRight: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 60,
                              height: 60,
                              background: "#eee",
                              borderRadius: 8,
                              overflow: "hidden",
                              border: "2px solid #e0e0e0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {flyerSquares.image1Url ? (
                              <img
                                src={flyerSquares.image1Url}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <span style={{ color: "#bbb", fontSize: 12 }}>
                                Image 1
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              width: 60,
                              height: 60,
                              background: "#eee",
                              borderRadius: 8,
                              overflow: "hidden",
                              border: "2px solid #e0e0e0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {flyerSquares.image2Url ? (
                              <img
                                src={flyerSquares.image2Url}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <span style={{ color: "#bbb", fontSize: 12 }}>
                                Image 2
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              width: 60,
                              height: 60,
                              background: "#eee",
                              borderRadius: 8,
                              overflow: "hidden",
                              border: "2px solid #e0e0e0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {flyerSquares.image3Url ? (
                              <img
                                src={flyerSquares.image3Url}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <span style={{ color: "#bbb", fontSize: 12 }}>
                                Image 3
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="admin-flyer-actions">
                      <button type="submit" className="admin-flyer-btn">
                        Enregistrer le flyer
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadFlyerSquares}
                        className="admin-flyer-btn download"
                      >
                        Télécharger le flyer
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {selectedFlyerModel === 11 && (
                <div className="admin-flyer-form">
                  <h3 style={{ color: "#4682B4", marginBottom: 16 }}>
                    Importer un flyer externe
                  </h3>
                  <form
                    className="admin-flyer-form-flex"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const isEditing = editingEvent !== null;

                      if (!flyerSquares.image1 && !isEditing) {
                        toast.error(
                          "Veuillez sélectionner une image à importer."
                        );
                        return;
                      }
                      const formData = new FormData();
                      formData.append(
                        "action",
                        isEditing ? "update_event" : "add_flyer"
                      );

                      if (isEditing) {
                        formData.append("id", editingEvent.id.toString());
                      }

                      formData.append("titre", flyerSquares.titre);
                      formData.append("date_event", flyerSquares.date);
                      formData.append("date_fin", flyerSquares.date_fin);
                      formData.append("description", flyerSquares.texte || "");
                      formData.append("modele", "externe");

                      // Ajouter l'image seulement si une nouvelle image est sélectionnée
                      if (flyerSquares.image1) {
                        formData.append("image", flyerSquares.image1);
                      }

                      formData.append("prix", flyerSquares.prix);
                      formData.append("devise", flyerSquares.devise);
                      try {
                        const response = await fetch(
                          `${API_BASE}/rabab/api/db_connect.php`,
                          {
                            method: "POST",
                            body: formData,
                          }
                        );
                        const data = await response.json();
                        if (data.success) {
                          toast.success(
                            `Flyer ${
                              isEditing ? "modifié" : "importé"
                            } avec succès !`
                          );
                          setFlyerSquares({
                            titre: "",
                            sousTitre: "",
                            date: "",
                            date_fin: "",
                            prix: "",
                            devise: "€",
                            lieu: "",
                            texte: "",
                            image1: null,
                            image2: null,
                            image3: null,
                            image1Url: "",
                            image2Url: "",
                            image3Url: "",
                          });
                          setSelectedFlyerModel(null);
                          setEditingEvent(null);
                          const refresh = await fetch(
                            `${API_BASE}/rabab/api/db_connect.php?action=get_events`
                          );
                          const refreshData = await refresh.json();
                          if (refreshData.success) setEvents(refreshData.data);
                        } else {
                          toast.error(
                            data.message || "Erreur lors de l'import du flyer."
                          );
                        }
                      } catch (err) {
                        toast.error(
                          "Erreur lors de l'envoi du flyer : " +
                            (err instanceof Error ? err.message : String(err))
                        );
                      }
                    }}
                  >
                    <div className="admin-flyer-form-col">
                      <label>Titre</label>
                      <input
                        type="text"
                        name="titre"
                        value={flyerSquares.titre}
                        onChange={handleFlyerSquaresChange}
                        required
                      />
                      <label>Date</label>
                      <input
                        type="date"
                        name="date"
                        value={flyerSquares.date}
                        onChange={handleFlyerSquaresChange}
                        required
                      />
                      <label>Date de fin</label>
                      <input
                        type="date"
                        name="date_fin"
                        value={flyerSquares.date_fin}
                        onChange={handleFlyerSquaresChange}
                        required
                      />
                      <label>Description (optionnel)</label>
                      <textarea
                        name="texte"
                        value={flyerSquares.texte}
                        onChange={handleFlyerSquaresChange}
                        rows={2}
                        placeholder="Ajoutez une description..."
                      />
                      <label>
                        Image du flyer{" "}
                        {editingEvent
                          ? "(optionnel - garder actuelle ou changer)"
                          : "(obligatoire)"}
                      </label>

                      {/* Affichage de l'image actuelle en mode édition */}
                      {editingEvent && editingEvent.image_url && (
                        <div
                          style={{
                            marginBottom: 15,
                            padding: 10,
                            backgroundColor: "#f8f9fa",
                            borderRadius: 6,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "#495057",
                              marginBottom: 8,
                            }}
                          >
                            <strong>🖼️ Flyer actuel :</strong>
                          </div>
                          <img
                            src={`https://rababali.com${editingEvent.image_url}`}
                            alt="Flyer actuel"
                            style={{
                              maxWidth: "200px",
                              maxHeight: "250px",
                              objectFit: "cover",
                              borderRadius: 4,
                              border: "1px solid #dee2e6",
                            }}
                          />
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#6c757d",
                              marginTop: 8,
                            }}
                          >
                            Laisser vide pour conserver ce flyer
                          </div>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        required={!editingEvent}
                        onChange={(e) =>
                          handleFlyerSquaresImage(
                            1,
                            e.target.files?.[0] || null
                          )
                        }
                      />
                    </div>
                    <div
                      className="admin-flyer-form-col"
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <div
                        style={{
                          width: 260,
                          height: 390,
                          background: "#fff",
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 12px #0001",
                          overflow: "hidden",
                        }}
                      >
                        {flyerSquares.image1Url ? (
                          <img
                            src={flyerSquares.image1Url}
                            alt="Aperçu flyer importé"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <span style={{ color: "#bbb", fontSize: 14 }}>
                            Aperçu du flyer importé
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="admin-flyer-actions">
                      <button type="submit" className="admin-flyer-btn">
                        Importer le flyer
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {selectedFlyerModel !== null &&
                [3, 4, 5, 6, 7, 8, 9].includes(selectedFlyerModel) && (
                  <div className="admin-flyer-form">
                    <h3 style={{ color: "#4682B4", marginBottom: 16 }}>
                      {(() => {
                        switch (selectedFlyerModel) {
                          case 3:
                            return "Flyer Plantes";
                          case 4:
                            return "Flyer Pétales bleues";
                          case 5:
                            return "Flyer Pont lumineux";
                          case 6:
                            return "Flyer Motifs arabes";
                          case 7:
                            return "Flyer Papyrus doré";
                          case 8:
                            return "Flyer Robe rouge";
                          case 9:
                            return "Flyer Rideau blanc";
                          default:
                            return "Flyer";
                        }
                      })()}
                    </h3>
                    <form className="admin-flyer-form-flex">
                      <div className="admin-flyer-form-col">
                        <label>Titre</label>
                        <input
                          type="text"
                          name="titre"
                          value={flyerSquares.titre}
                          onChange={handleFlyerSquaresChange}
                        />
                        <label>Sous-titre (optionnel)</label>
                        <input
                          type="text"
                          name="sousTitre"
                          value={flyerSquares.sousTitre}
                          onChange={handleFlyerSquaresChange}
                          placeholder="Laisser vide si pas de sous-titre"
                        />
                        <label>Date</label>
                        <input
                          type="date"
                          name="date"
                          value={flyerSquares.date}
                          onChange={handleFlyerSquaresChange}
                        />
                        <label>Date de fin</label>
                        <input
                          type="date"
                          name="date_fin"
                          value={flyerSquares.date_fin}
                          onChange={handleFlyerSquaresChange}
                        />
                        <label>Lieu</label>
                        <input
                          type="text"
                          name="lieu"
                          value={flyerSquares.lieu}
                          onChange={handleFlyerSquaresChange}
                        />
                        <label>Texte additionnel</label>
                        <textarea
                          name="texte"
                          value={flyerSquares.texte}
                          onChange={handleFlyerSquaresChange}
                          rows={3}
                          placeholder="Ajoutez un texte libre..."
                        />
                        <div style={{ marginBottom: 10 }}>
                          <label>Image principale</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleFlyerSquaresImage(
                                1,
                                e.target.files?.[0] || null
                              )
                            }
                          />
                        </div>
                      </div>
                      <div
                        className="admin-flyer-form-col"
                        style={{ display: "flex", justifyContent: "center" }}
                      >
                        <div
                          style={{
                            width: 260,
                            height: 390,
                            background: `url(${API_BASE}/images/flyers/flyers${selectedFlyerModel}.jpg) center/cover no-repeat`,
                            borderRadius: 12,
                            position: "relative",
                            boxShadow: "0 2px 12px #0001",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              left: 18,
                              top: 18,
                              width: 220,
                              color: "#4682B4",
                              fontWeight: 700,
                              fontSize: 18,
                              textShadow: "0 1px 4px #fff8",
                            }}
                          >
                            {flyerSquares.titre || "Titre du flyer"}
                          </div>
                          {flyerSquares.sousTitre && (
                            <div
                              style={{
                                position: "absolute",
                                left: 18,
                                top: 48,
                                width: 220,
                                color: "#4682B4",
                                fontWeight: 500,
                                fontSize: 15,
                                textShadow: "0 1px 4px #fff8",
                              }}
                            >
                              {flyerSquares.sousTitre}
                            </div>
                          )}
                          <div
                            style={{
                              position: "absolute",
                              left: 18,
                              top: 78,
                              width: 220,
                              color: "#f5c24b",
                              fontWeight: 600,
                              fontSize: 15,
                              textShadow: "0 1px 4px #fff8",
                            }}
                          >
                            {flyerSquares.date
                              ? formatDateFr(flyerSquares.date)
                              : "Date"}
                          </div>
                          {flyerSquares.date_fin && (
                            <div className="flyer-squares-date-fin">
                              Fin : {formatDateFr(flyerSquares.date_fin)}
                            </div>
                          )}
                          <div
                            style={{
                              position: "absolute",
                              left: 18,
                              top: 108,
                              width: 220,
                              color: "#4682B4",
                              fontWeight: 600,
                              fontSize: 15,
                              textShadow: "0 1px 4px #fff8",
                            }}
                          >
                            {flyerSquares.lieu || "Lieu"}
                          </div>
                          <div
                            style={{
                              position: "absolute",
                              left: 18,
                              top: 138,
                              width: 220,
                              color: "#222",
                              fontWeight: 400,
                              fontSize: 13,
                              whiteSpace: "pre-line",
                              textShadow: "0 1px 4px #fff8",
                            }}
                          >
                            {flyerSquares.texte}
                          </div>
                          {flyerSquares.image1Url && (
                            <img
                              src={flyerSquares.image1Url}
                              alt="Aperçu flyer"
                              style={{
                                position: "absolute",
                                left: "50%",
                                top: "65%",
                                transform: "translate(-50%, -50%)",
                                width: 120,
                                height: 120,
                                objectFit: "cover",
                                borderRadius: 16,
                                boxShadow: "0 2px 12px #0002",
                                border: "3px solid #fff",
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              {selectedFlyerModel === 12 && (
                <div className="admin-flyer-form">
                  <h3 style={{ color: "#4682B4", marginBottom: 16 }}>
                    Flyer Image de fond + texte
                  </h3>
                  <form
                    className="admin-flyer-form-flex"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!flyerSquares.image1) {
                        toast.error("Veuillez sélectionner une image de fond.");
                        return;
                      }
                      if (!flyerSquares.titre) {
                        toast.error("Veuillez saisir un titre.");
                        return;
                      }
                      if (!flyerSquares.date) {
                        toast.error("Veuillez saisir une date.");
                        return;
                      }
                      // Générer l'aperçu via html2canvas
                      if (!flyerSquaresRef.current) {
                        toast.error("Erreur : aperçu flyer non disponible.");
                        return;
                      }
                      const canvas = await html2canvas(
                        flyerSquaresRef.current,
                        {
                          background: "transparent",
                        }
                      );
                      const blob = await new Promise<Blob | null>((resolve) =>
                        canvas.toBlob((b) => resolve(b), "image/png")
                      );
                      if (!blob) {
                        toast.error(
                          "Erreur lors de la génération de l'image du flyer."
                        );
                        return;
                      }
                      const file = new File(
                        [blob],
                        `flyer-fond-image-${Date.now()}.png`,
                        { type: "image/png" }
                      );
                      const formData = new FormData();
                      const isEditing = editingEvent !== null;
                      formData.append(
                        "action",
                        isEditing ? "update_event" : "add_flyer"
                      );

                      if (isEditing) {
                        formData.append("id", editingEvent.id.toString());
                      }

                      formData.append("titre", flyerSquares.titre);
                      formData.append("sous_titre", flyerSquares.sousTitre);
                      formData.append("date_event", flyerSquares.date);
                      formData.append("date_fin", flyerSquares.date_fin);
                      formData.append("lieu", flyerSquares.lieu);
                      formData.append("texte", flyerSquares.texte);
                      formData.append("modele", "fond_image");
                      formData.append("image", file);
                      formData.append("prix", flyerSquares.prix);
                      formData.append("devise", flyerSquares.devise);
                      try {
                        const response = await fetch(
                          `${API_BASE}/rabab/api/db_connect.php`,
                          {
                            method: "POST",
                            body: formData,
                          }
                        );
                        const data = await response.json();
                        if (data.success) {
                          toast.success(
                            `Flyer ${
                              isEditing ? "modifié" : "ajouté"
                            } avec succès !`
                          );
                          setFlyerSquares({
                            titre: "",
                            sousTitre: "",
                            date: "",
                            date_fin: "",
                            prix: "",
                            devise: "€",
                            lieu: "",
                            texte: "",
                            image1: null,
                            image2: null,
                            image3: null,
                            image1Url: "",
                            image2Url: "",
                            image3Url: "",
                          });
                          setSelectedFlyerModel(null);
                          setEditingEvent(null);
                          const refresh = await fetch(
                            `${API_BASE}/rabab/api/db_connect.php?action=get_events`
                          );
                          const refreshData = await refresh.json();
                          if (refreshData.success) setEvents(refreshData.data);
                        } else {
                          toast.error(
                            data.message || "Erreur lors de l'ajout du flyer."
                          );
                        }
                      } catch (err) {
                        toast.error(
                          "Erreur lors de l'envoi du flyer : " +
                            (err instanceof Error ? err.message : String(err))
                        );
                      }
                    }}
                  >
                    <div className="admin-flyer-form-col">
                      <label>Image de fond (obligatoire)</label>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) =>
                          handleFlyerSquaresImage(
                            1,
                            e.target.files?.[0] || null
                          )
                        }
                      />
                      <label>Titre</label>
                      <input
                        type="text"
                        name="titre"
                        value={flyerSquares.titre}
                        onChange={handleFlyerSquaresChange}
                        required
                      />
                      <label>Sous-titre (optionnel)</label>
                      <input
                        type="text"
                        name="sousTitre"
                        value={flyerSquares.sousTitre}
                        onChange={handleFlyerSquaresChange}
                      />
                      <label>Date</label>
                      <input
                        type="date"
                        name="date"
                        value={flyerSquares.date}
                        onChange={handleFlyerSquaresChange}
                        required
                      />
                      <label>Date de fin</label>
                      <input
                        type="date"
                        name="date_fin"
                        value={flyerSquares.date_fin}
                        onChange={handleFlyerSquaresChange}
                        required
                      />
                      <label>Lieu</label>
                      <input
                        type="text"
                        name="lieu"
                        value={flyerSquares.lieu}
                        onChange={handleFlyerSquaresChange}
                      />
                      <label>Texte additionnel</label>
                      <textarea
                        name="texte"
                        value={flyerSquares.texte}
                        onChange={handleFlyerSquaresChange}
                        rows={3}
                        placeholder="Ajoutez un texte libre..."
                      />
                    </div>
                    <div
                      className="admin-flyer-form-col"
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <div
                        ref={flyerSquaresRef}
                        style={{
                          width: 260,
                          height: 390,
                          background: flyerSquares.image1Url
                            ? `url(${flyerSquares.image1Url}) center/cover no-repeat`
                            : "#eee",
                          borderRadius: 12,
                          position: "relative",
                          boxShadow: "0 2px 12px #0001",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 24,
                            left: 0,
                            width: "100%",
                            textAlign: "center",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 22,
                            textShadow: "0 2px 8px #000b",
                            padding: "0 12px",
                          }}
                        >
                          {flyerSquares.titre || "Titre du flyer"}
                        </div>
                        {flyerSquares.sousTitre && (
                          <div
                            style={{
                              position: "absolute",
                              top: 60,
                              left: 0,
                              width: "100%",
                              textAlign: "center",
                              color: "#fff",
                              fontWeight: 500,
                              fontSize: 16,
                              textShadow: "0 2px 8px #000b",
                              padding: "0 12px",
                            }}
                          >
                            {flyerSquares.sousTitre}
                          </div>
                        )}
                        <div
                          style={{
                            position: "absolute",
                            top: 100,
                            left: 0,
                            width: "100%",
                            textAlign: "center",
                            color: "#ffe082",
                            fontWeight: 600,
                            fontSize: 15,
                            textShadow: "0 2px 8px #000b",
                            padding: "0 12px",
                          }}
                        >
                          {flyerSquares.date
                            ? formatDateFr(flyerSquares.date)
                            : "Date"}
                        </div>
                        {flyerSquares.date_fin && (
                          <div className="flyer-squares-date-fin">
                            Fin : {formatDateFr(flyerSquares.date_fin)}
                          </div>
                        )}
                        <div
                          style={{
                            position: "absolute",
                            bottom: 24,
                            left: 0,
                            width: "100%",
                            textAlign: "center",
                            color: "#fff",
                            fontWeight: 400,
                            fontSize: 13,
                            textShadow: "0 2px 8px #000b",
                            padding: "0 12px",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {flyerSquares.texte}
                        </div>
                      </div>
                    </div>
                    <div className="admin-flyer-actions">
                      <button type="submit" className="admin-flyer-btn">
                        Enregistrer le flyer
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {selectedFlyerModel === 13 && <FlyerLibreEditor />}
            </div>
          )}
          {/* Liste des événements existants */}
          <h2
            style={{ color: "#4682B4", fontSize: "1.3rem", marginBottom: 18 }}
          >
            Événements existants
          </h2>
          {loading ? (
            <div style={{ textAlign: "center", color: "#4682B4" }}>
              Chargement...
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", color: "#888" }}>
              Aucun événement pour le moment.
            </div>
          ) : (
            <div className="admin-events-grid">
              {events.map((event) => (
                <div key={event.id} className="admin-event-card">
                  <div className="admin-event-title">{event.titre}</div>
                  <div className="admin-event-desc">{event.description}</div>
                  <div className="admin-event-date">
                    📅 {formatDateFr(event.date_event)}
                    {event.date_fin ? ` → ${formatDateFr(event.date_fin)}` : ""}
                  </div>
                  {event.image_url && (
                    <img
                      src={`${API_BASE}${event.image_url}`}
                      alt={event.titre}
                      className="admin-event-img"
                    />
                  )}
                  <div className="admin-event-prix">
                    {event.prix &&
                      event.devise &&
                      `💶 ${event.prix} ${event.devise}`}
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: 10 }}>
                    <button
                      className="admin-event-edit-btn"
                      onClick={() => handleEditEvent(event)}
                      style={{
                        background: "#4682B4",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 14px",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "background 0.2s",
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      className="admin-event-delete-btn"
                      onClick={() => handleDeleteEvent(event.id)}
                      style={{
                        background: "#b22222",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 14px",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "background 0.2s",
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Section Rendez-vous */}
      {activeTab === "appointments" && (
        <>
          {loadingAppointments ? (
            <div className="admin-loading">Chargement des rendez-vous...</div>
          ) : (
            <>
              {/* Calendrier avec les rendez-vous */}
              <div className="admin-appointments-calendar">
                <h2
                  style={{
                    color: "#4682B4",
                    marginBottom: "1rem",
                    textAlign: "center",
                  }}
                >
                  📅 Calendrier des Rendez-vous
                </h2>
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
                  <div
                    style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                  >
                    <button
                      onClick={handlePrintReport}
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
                      onClick={handleExportCSV}
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
                    <button
                      onClick={handleAddAppointment}
                      className="btn-magical"
                      style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                    >
                      ➕ Ajouter
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
                              .filter((appt) => appt.statut === "confirmee")
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
                                (appt) => appt.statut === "confirmee"
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
                          <span className="stat-number">
                            {appointments.length}
                          </span>
                          <span className="stat-label">Total rendez-vous</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-number">
                            {
                              appointments.filter(
                                (appt) =>
                                  new Date(appt.date_reservation) >=
                                    new Date() && appt.statut !== "annulee"
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
                                const apptDate = new Date(
                                  appt.date_reservation
                                );
                                return (
                                  apptDate.getMonth() === thisMonth &&
                                  apptDate.getFullYear() === thisYear &&
                                  appt.statut === "confirmee"
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
                                  appt.statut === "confirmee"
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
                                  appt.statut === "confirmee"
                              ).length
                            }
                          </span>
                          <span className="stat-label">Présentiel payées</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-number">
                            {(() => {
                              const paidAppointments = appointments.filter(
                                (appt) => appt.statut === "confirmee"
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
                    <br />• <strong>🖨️ Imprimer</strong> → Rapport comptable
                    global
                    <br />• <strong>📊 Export CSV</strong> → Données pour
                    Excel/comptabilité
                    <br />• <strong>🧾 Facture individuelle</strong> → Cliquez
                    sur l'icône 🧾 dans chaque ligne pour générer la facture
                    client
                    <br />
                    <small style={{ opacity: 0.8 }}>
                      Les factures incluent automatiquement le statut de
                      paiement (✅ Payé, ⏳ En attente, ❌ Annulé)
                    </small>
                  </div>
                )}

                {/* Tableau des rendez-vous */}
                <div className="admin-appointments-table">
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
                              <td>
                                {formatDateFr(appointment.date_reservation)}
                              </td>
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
                                <span
                                  className={`status-badge ${appointment.statut}`}
                                >
                                  {appointment.statut === "confirme" ||
                                  appointment.statut === "confirmee"
                                    ? "✅ Payé"
                                    : appointment.statut === "en_attente"
                                    ? "⏳ En attente"
                                    : appointment.statut === "annulee"
                                    ? "❌ Annulé"
                                    : appointment.statut || "❓ Sans statut"}
                                </span>
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
                      onSubmit={handleSaveAppointment}
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
                          <option value="confirmee">Payé</option>
                          <option value="en_attente">
                            En attente de paiement
                          </option>
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
            </>
          )}
        </>
      )}

      {/* Section Avis & Témoignages */}
      {activeTab === "experiences" && (
        <>
          <h2
            style={{
              color: "#4682B4",
              fontSize: "1.3rem",
              margin: "2.5rem 0 18px",
            }}
          >
            Avis & Témoignages
          </h2>
          {loadingExperiences ? (
            <div style={{ textAlign: "center", color: "#4682B4" }}>
              Chargement...
            </div>
          ) : experiences.length === 0 ? (
            <div style={{ textAlign: "center", color: "#888" }}>
              Aucun avis pour le moment.
            </div>
          ) : (
            <div className="admin-events-grid">
              {experiences.map((exp) => (
                <div key={exp.id} className="admin-event-card">
                  <div className="admin-event-title">{exp.titre}</div>
                  <div className="admin-event-desc">{exp.message}</div>
                  <div className="admin-event-date">🗓️ {exp.date_creation}</div>
                  <div
                    className="admin-event-prix"
                    style={{ color: "#4682B4", fontWeight: 500 }}
                  >
                    {exp.nom}
                  </div>
                  <div style={{ margin: "8px 0", fontSize: 13 }}>
                    Statut :{" "}
                    {exp.statut === "valide"
                      ? "✅ Validé"
                      : exp.statut === "refuse"
                      ? "❌ Refusé"
                      : "⏳ En attente"}
                  </div>
                  {exp.statut === "en_attente" && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <button
                        onClick={() =>
                          handleModerateExperience(exp.id, "valide")
                        }
                        style={{
                          background: "#4caf50",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 14px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Valider
                      </button>
                      <button
                        onClick={() =>
                          handleModerateExperience(exp.id, "refuse")
                        }
                        style={{
                          background: "#b22222",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 14px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                  <button
                    className="admin-event-delete-btn"
                    onClick={() => handleDeleteExperience(exp.id)}
                    style={{
                      background: "#b22222",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 14px",
                      marginTop: 10,
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "background 0.2s",
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Admin;

// --- Composant d'édition du flyer libre ---

type TypeFlyerElement =
  | {
      id: string;
      type: "text" | "date";
      value: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fontSize: number;
      color: string;
      fontWeight: number;
      fontFamily?: string;
      fontStyle?: string;
      textAlign?: "left" | "center" | "right";
      textDecoration?: string;
      lineHeight?: number;
      letterSpacing?: number;
      textShadow?: string;
      opacity?: number;
    }
  | {
      id: string;
      type: "image";
      src: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      id: string;
      type: "shape";
      shapeType: "rectangle" | "square" | "circle" | "ellipse";
      x: number;
      y: number;
      width: number;
      height: number;
      fillColor: string;
      borderColor: string;
      borderWidth: number;
      borderRadius?: number;
      opacity?: number;
    };

const CANVAS_WIDTH = 390;
const CANVAS_HEIGHT = 600;
const defaultBgColor = "#fff";

function FlyerLibreEditor() {
  const [elements, setElements] = useState<TypeFlyerElement[]>([]);
  const [bgColor, setBgColor] = useState(defaultBgColor);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Ajout d'un texte
  const addText = () => {
    setElements((els) => [
      ...els,
      {
        id: uuidv4(),
        type: "text",
        value: "Texte ici",
        x: 50,
        y: 50,
        width: 180,
        height: 40,
        fontSize: 22,
        color: "#222",
        fontWeight: 700,
      },
    ]);
  };
  // Ajout d'une image
  const addImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setElements((els) => [
        ...els,
        {
          id: uuidv4(),
          type: "image",
          src: e.target?.result as string,
          x: 80,
          y: 80,
          width: 120,
          height: 120,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };
  // Ajout d'une date
  const addDate = () => {
    setElements((els) => [
      ...els,
      {
        id: uuidv4(),
        type: "date",
        value: new Date().toLocaleDateString("fr-FR"),
        x: 100,
        y: 100,
        width: 120,
        height: 32,
        fontSize: 18,
        color: "#4682B4",
        fontWeight: 600,
      },
    ]);
  };
  // Suppression d'un élément
  const removeElement = (id: string) => {
    setElements((els) => els.filter((el) => el.id !== id));
  };
  // Modification d'un élément (texte, position, taille...)
  const updateElement = (id: string, changes: Partial<TypeFlyerElement>) => {
    setElements((els) =>
      els.map((el) =>
        el.id === id ? ({ ...el, ...changes } as TypeFlyerElement) : el
      )
    );
  };

  // Exporter le flyer
  const handleExport = async () => {
    if (!canvasRef.current) return;
    const canvas = await html2canvas(canvasRef.current, {
      background: "transparent",
      useCORS: true,
    });
    canvas.toBlob((blob) => {
      if (blob) {
        // Téléchargement direct
        const link = document.createElement("a");
        link.download = `flyer-libre-${Date.now()}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        toast.success("Flyer téléchargé avec succès !");
      }
    });
  };
  // Ajoute la fonction de duplication
  const duplicateElement = (id: string) => {
    setElements((els) => {
      const el = els.find((e) => e.id === id);
      if (!el) return els;
      const newEl = {
        ...el,
        id: uuidv4(),
        x: el.x + 20,
        y: el.y + 20,
      };
      return [...els, newEl];
    });
  };
  return (
    <div style={{ margin: "2rem 0" }}>
      <h3 style={{ color: "#4682B4", marginBottom: 16 }}>
        Flyer Libre (personnalisé)
      </h3>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 32,
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            width: CANVAS_WIDTH,
            flex: "0 0 390px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            ref={canvasRef}
            onClick={(e) => {
              // Désélectionne si on clique sur le fond du canvas (pas sur un élément)
              if (e.target === canvasRef.current) setSelectedId(null);
            }}
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              background: bgImage
                ? `url(${bgImage}) center/cover no-repeat`
                : bgColor,
              borderRadius: 16,
              boxShadow: "0 2px 12px #0001",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {elements.map((el) => {
              const isSelected = selectedId === el.id;
              return (
                <Rnd
                  key={el.id}
                  size={{ width: el.width, height: el.height }}
                  position={{ x: el.x, y: el.y }}
                  onDragStop={(_e, d) =>
                    updateElement(el.id, { x: d.x, y: d.y })
                  }
                  onResizeStop={(_e, _dir, ref, _delta, pos) =>
                    updateElement(el.id, {
                      width: parseInt(ref.style.width),
                      height: parseInt(ref.style.height),
                      x: pos.x,
                      y: pos.y,
                    })
                  }
                  bounds="parent"
                  style={{
                    zIndex: isSelected ? 2 : 1,
                    border: isSelected ? "2px solid #4682B4" : "none",
                    boxShadow: isSelected ? "0 0 0 2px #90caf9" : "none",
                    borderRadius: 10,
                    backgroundClip: "padding-box",
                  }}
                  onClick={() => setSelectedId(el.id)}
                >
                  {el.type === "image" ? (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      <img
                        src={el.src}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                      {isSelected && (
                        <button
                          onClick={() => removeElement(el.id)}
                          style={{
                            position: "absolute",
                            top: -12,
                            right: -12,
                            background: "#fff",
                            border: "1.5px solid #b22222",
                            borderRadius: "50%",
                            cursor: "pointer",
                            fontSize: 16,
                            padding: "2px 7px",
                            color: "#b22222",
                            fontWeight: 700,
                            boxShadow: "0 1px 4px #0002",
                            zIndex: 20,
                            opacity: 0.92,
                          }}
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : el.type === "text" || el.type === "date" ? (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      {(el.type === "text" || el.type === "date") && (
                        <textarea
                          value={el.value}
                          onChange={(e) =>
                            updateElement(el.id, { value: e.target.value })
                          }
                          style={{
                            fontSize: el.fontSize,
                            color: el.color,
                            fontWeight: el.fontWeight,
                            fontStyle: el.fontStyle || "normal",
                            fontFamily: el.fontFamily || "Arial, sans-serif",
                            width: "90%",
                            height: "80%",
                            border: "none",
                            background: "transparent",
                            outline: "none",
                            textAlign: el.textAlign || "center",
                            textDecoration: el.textDecoration || "none",
                            lineHeight: el.lineHeight || 1.2,
                            letterSpacing: el.letterSpacing || 0,
                            textShadow: el.textShadow || "none",
                            opacity: el.opacity ?? 1,
                            resize: "none",
                            textAlignLast: el.textAlign || "center",
                            padding: 0,
                            overflow: "hidden",
                          }}
                          rows={3}
                        />
                      )}
                      {isSelected && (
                        <>
                          <button
                            onClick={() => duplicateElement(el.id)}
                            style={{
                              position: "absolute",
                              top: el.type === "date" ? -28 : -12,
                              right: el.type === "date" ? 40 : 28,
                              background: "#fff",
                              border: "1.5px solid #4682B4",
                              borderRadius: "50%",
                              cursor: "pointer",
                              fontSize: 16,
                              padding: "2px 7px",
                              color: "#4682B4",
                              fontWeight: 700,
                              boxShadow: "0 1px 4px #0002",
                              zIndex: 20,
                              opacity: 0.92,
                            }}
                            title="Dupliquer"
                          >
                            📄
                          </button>
                          <button
                            onClick={() => removeElement(el.id)}
                            style={{
                              position: "absolute",
                              top: el.type === "date" ? -28 : -12,
                              right: el.type === "date" ? 0 : -12,
                              background: "#fff",
                              border: "1.5px solid #b22222",
                              borderRadius: "50%",
                              cursor: "pointer",
                              fontSize: 16,
                              padding: "2px 7px",
                              color: "#b22222",
                              fontWeight: 700,
                              boxShadow: "0 1px 4px #0002",
                              zIndex: 20,
                              opacity: 0.92,
                            }}
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  ) : el.type === "shape" ? (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "auto", // Ajouté ici pour rendre les boutons cliquables
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: el.fillColor,
                          border: `${el.borderWidth}px solid ${el.borderColor}`,
                          borderRadius:
                            el.shapeType === "rectangle" ||
                            el.shapeType === "square"
                              ? el.borderRadius ?? 0
                              : 999,
                          opacity: el.opacity ?? 1,
                          pointerEvents: "none", // Garde ici pour empêcher la sélection du fond
                        }}
                      />
                      {isSelected && (
                        <>
                          <button
                            onClick={() => duplicateElement(el.id)}
                            style={{
                              position: "absolute",
                              top: -28,
                              right: 28,
                              background: "#fff",
                              border: "1.5px solid #4682B4",
                              borderRadius: "50%",
                              cursor: "pointer",
                              fontSize: 16,
                              padding: "2px 7px",
                              color: "#4682B4",
                              fontWeight: 700,
                              boxShadow: "0 1px 4px #0002",
                              zIndex: 20,
                              opacity: 0.92,
                            }}
                            title="Dupliquer"
                          >
                            📄
                          </button>
                          <button
                            onClick={() => removeElement(el.id)}
                            style={{
                              position: "absolute",
                              top: -28,
                              right: -12,
                              background: "#fff",
                              border: "1.5px solid #b22222",
                              borderRadius: "50%",
                              cursor: "pointer",
                              fontSize: 16,
                              padding: "2px 7px",
                              color: "#b22222",
                              fontWeight: 700,
                              boxShadow: "0 1px 4px #0002",
                              zIndex: 20,
                              opacity: 0.92,
                            }}
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  ) : null}
                </Rnd>
              );
            })}
          </div>
        </div>
        {/* Barre de réglages à droite du flyer */}
        <div
          style={{
            minWidth: 220,
            maxWidth: 320,
            flex: "0 0 220px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          {(() => {
            const selected = elements.find(
              (el) =>
                el.id === selectedId &&
                (el.type === "text" ||
                  el.type === "date" ||
                  el.type === "shape")
            ) as
              | Extract<TypeFlyerElement, { type: "text" | "date" | "shape" }>
              | undefined;
            if (!selected) return null;
            if (selected.type === "shape") {
              return (
                <div
                  style={{
                    background: "#fff",
                    boxShadow: "0 2px 8px #0002",
                    borderRadius: 8,
                    padding: "12px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    alignItems: "flex-start",
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "#4682B4",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Réglages de la forme sélectionnée :
                  </span>
                  <label style={{ fontSize: 13 }}>
                    Couleur
                    <input
                      type="color"
                      value={selected.fillColor}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          fillColor: e.target.value,
                        })
                      }
                      style={{ marginLeft: 8 }}
                    />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    Couleur de bordure
                    <input
                      type="color"
                      value={selected.borderColor}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          borderColor: e.target.value,
                        })
                      }
                      style={{ marginLeft: 8 }}
                    />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    Largeur de bordure
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={selected.borderWidth}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          borderWidth: parseInt(e.target.value),
                        })
                      }
                      style={{ width: 100, marginLeft: 8 }}
                    />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    Rayon de coin
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={selected.borderRadius ?? 0}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          borderRadius: parseInt(e.target.value),
                        })
                      }
                      style={{ width: 100, marginLeft: 8 }}
                    />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    Opacité
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.1}
                      value={selected.opacity ?? 1}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          opacity: parseFloat(e.target.value),
                        })
                      }
                      style={{ width: 100, marginLeft: 8 }}
                    />
                  </label>
                </div>
              );
            } else if (selected.type === "text" || selected.type === "date") {
              return (
                <div
                  style={{
                    background: "#fff",
                    boxShadow: "0 2px 8px #0002",
                    borderRadius: 8,
                    padding: "12px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    alignItems: "flex-start",
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "#4682B4",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Réglages du texte sélectionné :
                  </span>
                  <label style={{ fontSize: 13 }}>
                    Taille
                    <input
                      type="range"
                      min={12}
                      max={48}
                      value={selected.fontSize}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          fontSize: parseInt(e.target.value),
                        })
                      }
                      style={{ width: 80, marginLeft: 8 }}
                    />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    Couleur
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(e) =>
                        updateElement(selected.id, { color: e.target.value })
                      }
                      style={{ marginLeft: 8 }}
                    />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    Police
                    <select
                      value={selected.fontFamily || "Arial"}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          fontFamily: e.target.value,
                        })
                      }
                      style={{ fontSize: 13, marginLeft: 8 }}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </label>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(selected.id, { textAlign: "left" })
                      }
                      style={{
                        background:
                          selected.textAlign === "left" ? "#4682B4" : "#eee",
                        color: selected.textAlign === "left" ? "#fff" : "#222",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        width: 32,
                        height: 32,
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                      title="Aligner à gauche"
                    >
                      <span style={{ fontSize: 18 }}>⯇</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(selected.id, { textAlign: "center" })
                      }
                      style={{
                        background:
                          selected.textAlign === "center" ? "#4682B4" : "#eee",
                        color:
                          selected.textAlign === "center" ? "#fff" : "#222",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        width: 32,
                        height: 32,
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                      title="Centrer"
                    >
                      <span style={{ fontSize: 18 }}>≡</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(selected.id, { textAlign: "right" })
                      }
                      style={{
                        background:
                          selected.textAlign === "right" ? "#4682B4" : "#eee",
                        color: selected.textAlign === "right" ? "#fff" : "#222",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        width: 32,
                        height: 32,
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                      title="Aligner à droite"
                    >
                      <span style={{ fontSize: 18 }}>⯈</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(selected.id, {
                          textDecoration:
                            selected.textDecoration === "underline"
                              ? "none"
                              : "underline",
                        })
                      }
                      style={{
                        background:
                          selected.textDecoration === "underline"
                            ? "#4682B4"
                            : "#eee",
                        color:
                          selected.textDecoration === "underline"
                            ? "#fff"
                            : "#222",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        width: 32,
                        height: 32,
                        cursor: "pointer",
                        fontWeight: 700,
                        textDecoration: "underline",
                      }}
                      title="Souligné"
                    >
                      U
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <label style={{ fontSize: 13 }}>
                      Hauteur ligne
                      <input
                        type="range"
                        min={1}
                        max={2}
                        step={0.05}
                        value={selected.lineHeight ?? 1.2}
                        onChange={(e) =>
                          updateElement(selected.id, {
                            lineHeight: parseFloat(e.target.value),
                          })
                        }
                        style={{ width: 60, marginLeft: 8 }}
                      />
                    </label>
                    <label style={{ fontSize: 13 }}>
                      Espacement
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={0.5}
                        value={selected.letterSpacing ?? 0}
                        onChange={(e) =>
                          updateElement(selected.id, {
                            letterSpacing: parseFloat(e.target.value),
                          })
                        }
                        style={{ width: 60, marginLeft: 8 }}
                      />
                    </label>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <label style={{ fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={!!selected.textShadow}
                        onChange={(e) =>
                          updateElement(selected.id, {
                            textShadow: e.target.checked
                              ? "2px 2px 6px #2226"
                              : "",
                          })
                        }
                        style={{ marginRight: 6 }}
                      />
                      Ombre
                    </label>
                    <label style={{ fontSize: 13 }}>
                      Opacité
                      <input
                        type="range"
                        min={0.2}
                        max={1}
                        step={0.05}
                        value={selected.opacity ?? 1}
                        onChange={(e) =>
                          updateElement(selected.id, {
                            opacity: parseFloat(e.target.value),
                          })
                        }
                        style={{ width: 60, marginLeft: 8 }}
                      />
                    </label>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          marginTop: 24,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={addText}
          className="admin-flyer-btn"
          style={{ minWidth: 140 }}
        >
          Ajouter un texte
        </button>
        <button
          onClick={addDate}
          className="admin-flyer-btn"
          style={{ minWidth: 140 }}
        >
          Ajouter une date
        </button>
        <label
          className="admin-flyer-btn"
          style={{
            minWidth: 140,
            marginBottom: 0,
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          Ajouter une image
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files?.[0]) addImage(e.target.files[0]);
            }}
          />
        </label>
        <button
          onClick={handleExport}
          className="admin-flyer-btn download"
          style={{ minWidth: 140 }}
        >
          <span role="img" aria-label="Télécharger">
            ⬇️
          </span>{" "}
          Télécharger le flyer
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select id="shapeTypeSelect" style={{ minWidth: 100 }}>
            <option value="rectangle">Rectangle</option>
            <option value="square">Carré</option>
            <option value="circle">Cercle</option>
            <option value="ellipse">Ellipse</option>
          </select>
          <button
            className="admin-flyer-btn"
            style={{ minWidth: 140 }}
            onClick={() => {
              const select = document.getElementById(
                "shapeTypeSelect"
              ) as HTMLSelectElement;
              const shapeType = select.value as
                | "rectangle"
                | "square"
                | "circle"
                | "ellipse";
              setElements((els) => [
                ...els,
                {
                  id: uuidv4(),
                  type: "shape",
                  shapeType,
                  x: 80,
                  y: 80,
                  width: shapeType === "square" ? 100 : 140,
                  height:
                    shapeType === "circle"
                      ? 100
                      : shapeType === "square"
                      ? 100
                      : 80,
                  fillColor: "#90caf9",
                  borderColor: "#4682B4",
                  borderWidth: 2,
                  borderRadius:
                    shapeType === "rectangle"
                      ? 12
                      : shapeType === "square"
                      ? 16
                      : 999,
                  opacity: 1,
                },
              ]);
            }}
          >
            Ajouter une forme
          </button>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          marginTop: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontWeight: 500 }}>Fond (couleur) :</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => {
              setBgColor(e.target.value);
              setBgImage(null);
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontWeight: 500 }}>Fond (image) :</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => setBgImage(ev.target?.result as string);
                reader.readAsDataURL(e.target.files[0]);
              }
            }}
          />
          {bgImage && (
            <button
              type="button"
              onClick={() => setBgImage(null)}
              style={{
                background: "#ffeaea",
                border: "1px solid #e57373",
                color: "#b22222",
                borderRadius: 6,
                padding: "2px 12px",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span role="img" aria-label="Supprimer">
                🗑️
              </span>{" "}
              Supprimer l'image de fond
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
