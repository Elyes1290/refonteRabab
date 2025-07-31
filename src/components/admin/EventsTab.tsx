import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import { Rnd } from "react-rnd";
import { v4 as uuidv4 } from "uuid";

// Types et constantes pour le Flyer Libre Editor
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

// Fonction utilitaire pour formater la date en jj-mm-aaaa
function formatDateFr(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}-${m}-${y}`;
}

// Types
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
}

interface FormData {
  titre: string;
  description: string;
  date_event: string;
  date_fin: string;
  prix: string;
  devise: string;
  image: File | null;
}

// Interfaces pour les flyers
interface FlyerData {
  titre: string;
  sousTitre: string;
  date: string;
  date_fin: string;
  prix: string;
  devise: string;
  lieu: string;
  texte: string;
  image1: File | null;
  image2: File | null;
  image3: File | null;
  image1Url: string;
  image2Url: string;
  image3Url: string;
}

interface EventsTabProps {
  events: EventItem[];
  eventType: "event" | "flyer";
  setEventType: (type: "event" | "flyer") => void;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  submitting: boolean;
  setSubmitting: (submitting: boolean) => void;
  editingEvent: EventItem | null;
  setEditingEvent: React.Dispatch<React.SetStateAction<EventItem | null>>;
  onRefreshEvents: () => void;
  API_BASE: string;
  showFlyerModels?: boolean;
  setShowFlyerModels?: (show: boolean | ((prev: boolean) => boolean)) => void;
  selectedFlyerModel?: number | null;
  setSelectedFlyerModel?: (model: number | null) => void;
  flyerCircles?: FlyerData;
  setFlyerCircles?: React.Dispatch<React.SetStateAction<FlyerData>>;
  flyerSquares?: FlyerData;
  setFlyerSquares?: React.Dispatch<React.SetStateAction<FlyerData>>;
}

const EventsTab: React.FC<EventsTabProps> = ({
  events,
  eventType,
  setEventType,
  form,
  setForm,
  submitting,
  setSubmitting,
  editingEvent,
  setEditingEvent,
  onRefreshEvents,
  API_BASE,
  showFlyerModels = false,
  setShowFlyerModels = () => {},
  selectedFlyerModel = null,
  setSelectedFlyerModel = () => {},
  flyerCircles = {
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
  },
  setFlyerCircles = () => {},
  flyerSquares = {
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
  },
  setFlyerSquares = () => {},
}) => {
  // Références pour les aperçus de flyers
  const flyerCirclesRef = useRef<HTMLDivElement>(null);
  const flyerSquaresRef = useRef<HTMLDivElement>(null);

  // Gestionnaires pour les flyers Cercles
  const handleFlyerCirclesChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFlyerCircles((prev) => ({ ...prev, [name]: value }));
  };

  const handleFlyerCirclesImage = (idx: 1 | 2 | 3, file: File | null) => {
    const url = file ? URL.createObjectURL(file) : "";
    setFlyerCircles((prev) => ({
      ...prev,
      [`image${idx}`]: file,
      [`image${idx}Url`]: url,
    }));
  };

  // Gestionnaires pour les flyers Carrés/Losanges
  const handleFlyerSquaresChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFlyerSquares((prev) => ({ ...prev, [name]: value }));
  };

  const handleFlyerSquaresImage = (idx: 1 | 2 | 3, file: File | null) => {
    const url = file ? URL.createObjectURL(file) : "";
    setFlyerSquares((prev) => ({
      ...prev,
      [`image${idx}`]: file,
      [`image${idx}Url`]: url,
    }));
  };

  // Gestionnaire de téléchargement pour flyer Cercles
  const handleDownloadFlyerCircles = async () => {
    if (!flyerCirclesRef.current) return;
    const canvas = await html2canvas(flyerCirclesRef.current, {
      allowTaint: true,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `flyer-cercles-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Gestionnaire de téléchargement pour flyer Carrés
  const handleDownloadFlyerSquares = async () => {
    if (!flyerSquaresRef.current) return;
    const canvas = await html2canvas(flyerSquaresRef.current, {
      allowTaint: true,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `flyer-carres-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
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
        onRefreshEvents();
      } else {
        toast.error(data.message || "Erreur lors de l'ajout du flyer");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion");
    }
  };

  // Soumission du flyer Carrés/Losanges
  const handleSubmitFlyerSquares = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Soumission flyer carrés", flyerSquares);
    if (!flyerSquaresRef.current) {
      toast.error("Erreur : aperçu flyer non disponible.");
      return;
    }
    // Générer l'image fusionnée du flyer
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
    const file = new File(
      [blob],
      `flyer-${selectedFlyerModel}-${Date.now()}.png`,
      {
        type: "image/png",
      }
    );
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

    // Déterminer le modèle selon selectedFlyerModel
    let modele = "carres"; // par défaut
    if (selectedFlyerModel === 10) modele = "sobre";
    else if (selectedFlyerModel === 11) modele = "externe";
    else if (selectedFlyerModel === 12) modele = "fond_image";
    else if (selectedFlyerModel === 13) modele = "libre";

    formData.append("modele", modele);
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
        onRefreshEvents();
      } else {
        toast.error(data.message || "Erreur lors de l'ajout du flyer");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion");
    }
  };

  // Gestionnaire pour les changements de formulaire événement classique
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gestionnaire pour l'image événement classique
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({
      ...prev,
      image: file,
    }));
  };

  // Fonction de soumission pour le modèle 13 (FlyerLibreEditor)
  const handleSubmitFlyerLibre = async (canvas: HTMLCanvasElement) => {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!blob) {
      toast.error("Erreur lors de la génération de l'image du flyer.");
      return;
    }
    const file = new File([blob], `flyer-libre-${Date.now()}.png`, {
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
    formData.append("modele", "libre");
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
        onRefreshEvents();
      } else {
        toast.error(data.message || "Erreur lors de l'ajout du flyer");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion");
    }
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
            ? `${API_BASE}${eventItem?.image_url}`
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
            ? `${API_BASE}${eventItem.image_url}`
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
            ? `${API_BASE}${eventItem.image_url}`
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
            ? `${API_BASE}${eventItem.image_url}`
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
            ? `${API_BASE}${eventItem.image_url}`
            : "",
          image2Url: "",
          image3Url: "",
        });
      } else if (eventItem.modele === "libre") {
        setSelectedFlyerModel(13);
        // Pour le modèle libre, on utilise aussi flyerSquares pour la cohérence
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
            ? `${API_BASE}${eventItem.image_url}`
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

  // Fonction pour supprimer un événement
  const handleDeleteEvent = async (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      try {
        const response = await fetch(`${API_BASE}/rabab/api/db_connect.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `action=delete_event&id=${id}`,
        });
        const data = await response.json();
        if (data.success) {
          toast.success("Événement supprimé avec succès !");
          onRefreshEvents();
        } else {
          toast.error(data.message || "Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur de connexion");
      }
    }
  };

  // Fonction pour soumettre un événement classique
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.date_event) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const isEditing = editingEvent !== null;

    setSubmitting(true);
    try {
      const formData = new FormData();
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

      if (form.image) {
        formData.append("image", form.image);
      }

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
        onRefreshEvents();
      } else {
        toast.error(data.message || "Erreur lors de la soumission");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
              {editingEvent ? "Modifier un événement" : "Ajouter un événement"}
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
              required={!(editingEvent && editingEvent.modele === "externe")}
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
              onChange={handleChange}
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
              {editingEvent ? "(optionnel - garder actuelle ou changer)" : ""}
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

            <input type="file" accept="image/*" onChange={handleImageChange} />

            {editingEvent && (
              <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>
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
                ? `⏳ ${editingEvent ? "Modification" : "Ajout"} en cours...`
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
              {showFlyerModels ? "Masquer les modèles" : "Afficher les modèles"}
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
                <img src="/images/flyers/flyers1.jpg" alt="Modèle Cercles" />
                <div className="admin-flyer-model-label">Cercles</div>
              </div>
              <div
                className={`admin-flyer-model${
                  selectedFlyerModel === 2 ? " selected" : ""
                }`}
                onClick={() => setSelectedFlyerModel(2)}
              >
                <img src="/images/flyers/flyers2.jpg" alt="Modèle Carrés" />
                <div className="admin-flyer-model-label">Carrés/Losanges</div>
              </div>
              <div
                className={`admin-flyer-model${
                  selectedFlyerModel === 3 ? " selected" : ""
                }`}
                onClick={() => setSelectedFlyerModel(3)}
              >
                <img src="/images/flyers/flyers3.jpg" alt="Modèle Plantes" />
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
                <div className="admin-flyer-model-label">Pétales bleues</div>
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
                <img src="/images/flyers/flyers8.jpg" alt="Modèle Robe rouge" />
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
                  <span style={{ color: "#888", fontSize: 13, marginTop: 8 }}>
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

          {/* Formulaires dynamiques selon le modèle choisi */}
          {selectedFlyerModel === 1 && (
            <div className="admin-flyer-form">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <h3 style={{ color: "#4682B4", margin: 0 }}>
                  {editingEvent ? "Modifier un flyer" : "Flyer Cercles"}
                </h3>
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent(null);
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
                          Pour modifier : ajoutez de nouvelles images ci-dessous
                        </div>
                      </div>
                    )}

                    <label>Image Cercle 1</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFlyerCirclesImage(1, e.target.files?.[0] || null)
                      }
                    />
                    <label>Image Cercle 2</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFlyerCirclesImage(2, e.target.files?.[0] || null)
                      }
                    />
                    <label>Image Cercle 3</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFlyerCirclesImage(3, e.target.files?.[0] || null)
                      }
                    />
                  </div>
                </div>
                {/* Aperçu en temps réel */}
                <div
                  className="admin-flyer-form-col"
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <div ref={flyerCirclesRef} className="flyer-circles-preview">
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

          {/* Modèle 10 - Sobre (3 images à droite) */}
          {selectedFlyerModel === 10 && (
            <div className="admin-flyer-form">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <h3 style={{ color: "#4682B4", margin: 0 }}>
                  {editingEvent
                    ? "Modifier un flyer"
                    : "Flyer Sobre (3 images à droite)"}
                </h3>
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent(null);
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
              <form
                className="admin-flyer-form-flex"
                onSubmit={handleSubmitFlyerSquares}
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
                          Pour modifier : ajoutez de nouvelles images ci-dessous
                        </div>
                      </div>
                    )}

                    <label>Image Carré 1</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFlyerSquaresImage(1, e.target.files?.[0] || null)
                      }
                    />
                    <label>Image Carré 2</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFlyerSquaresImage(2, e.target.files?.[0] || null)
                      }
                    />
                    <label>Image Carré 3</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFlyerSquaresImage(3, e.target.files?.[0] || null)
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
              </form>
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
            </div>
          )}

          {/* Modèle 11 - Flyer importé */}
          {selectedFlyerModel === 11 && (
            <div className="admin-flyer-form">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <h3 style={{ color: "#4682B4", margin: 0 }}>
                  {editingEvent
                    ? "Modifier un flyer"
                    : "Importer un flyer externe"}
                </h3>
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent(null);
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
              <form
                className="admin-flyer-form-flex"
                onSubmit={handleSubmitFlyerSquares}
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
                      handleFlyerSquaresImage(1, e.target.files?.[0] || null)
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
              </form>
              <div className="admin-flyer-actions">
                <button type="submit" className="admin-flyer-btn">
                  Importer le flyer
                </button>
              </div>
            </div>
          )}

          {/* Modèle 12 - Image fond + texte */}
          {selectedFlyerModel === 12 && (
            <div className="admin-flyer-form">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <h3 style={{ color: "#4682B4", margin: 0 }}>
                  {editingEvent
                    ? "Modifier un flyer"
                    : "Flyer Image de fond + texte"}
                </h3>
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent(null);
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
              <form
                className="admin-flyer-form-flex"
                onSubmit={handleSubmitFlyerSquares}
              >
                <div className="admin-flyer-form-col">
                  <label>Image de fond (obligatoire)</label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) =>
                      handleFlyerSquaresImage(1, e.target.files?.[0] || null)
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
              </form>
              <div className="admin-flyer-actions">
                <button type="submit" className="admin-flyer-btn">
                  Enregistrer le flyer
                </button>
              </div>
            </div>
          )}

          {/* Modèle 13 - Libre personnalisé */}
          {selectedFlyerModel === 13 && (
            <FlyerLibreEditor
              onSubmit={handleSubmitFlyerLibre}
              editingEvent={editingEvent}
              setEditingEvent={setEditingEvent}
              setSelectedFlyerModel={setSelectedFlyerModel}
              setFlyerSquares={setFlyerSquares}
            />
          )}

          {/* Modèle 2 - Carrés/Losanges */}
          {selectedFlyerModel === 2 && (
            <div className="admin-flyer-form">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <h3 style={{ color: "#4682B4", margin: 0 }}>
                  {editingEvent ? "Modifier un flyer" : "Flyer Carrés/Losanges"}
                </h3>
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent(null);
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
                          Pour modifier : ajoutez de nouvelles images ci-dessous
                        </div>
                      </div>
                    )}

                    <label>Image Carré 1</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFlyerSquaresImage(1, e.target.files?.[0] || null)
                      }
                    />
                    <label>Image Carré 2</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFlyerSquaresImage(2, e.target.files?.[0] || null)
                      }
                    />
                  </div>
                </div>
                {/* Aperçu en temps réel */}
                <div
                  className="admin-flyer-form-col"
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <div ref={flyerSquaresRef} className="flyer-squares-preview">
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

          {/* Autres modèles non encore implémentés */}
          {selectedFlyerModel &&
            ![1, 2, 10, 11, 12, 13].includes(selectedFlyerModel) && (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  backgroundColor: "#f8f9fa",
                  borderRadius: 8,
                  marginTop: 20,
                }}
              >
                <h3 style={{ color: "#4682B4", marginBottom: "1rem" }}>
                  Modèle {selectedFlyerModel}
                </h3>
                <p style={{ color: "#666", fontSize: "1.1rem" }}>
                  Ce modèle de flyer sera disponible dans une prochaine version.
                </p>
                <button
                  onClick={() => setSelectedFlyerModel(null)}
                  style={{
                    background: "#4682B4",
                    color: "white",
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    marginTop: "1rem",
                  }}
                >
                  Retour aux modèles
                </button>
              </div>
            )}
        </div>
      )}

      {/* Liste des événements existants */}
      <h2 style={{ color: "#4682B4", fontSize: "1.3rem", marginBottom: 18 }}>
        Événements existants
      </h2>
      {events.length === 0 ? (
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
  );
};

// Composant FlyerLibreEditor pour le modèle 13
interface FlyerLibreEditorProps {
  onSubmit: (canvas: HTMLCanvasElement) => Promise<void>;
  editingEvent?: EventItem | null;
  setEditingEvent?: React.Dispatch<React.SetStateAction<EventItem | null>>;
  setSelectedFlyerModel?: (model: number | null) => void;
  setFlyerSquares?: React.Dispatch<React.SetStateAction<FlyerData>>;
}

function FlyerLibreEditor({
  onSubmit,
  editingEvent,
  setEditingEvent,
  setSelectedFlyerModel,
  setFlyerSquares,
}: FlyerLibreEditorProps) {
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

  // Modification d'un élément
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

    // Utiliser la fonction onSubmit si elle est fournie, sinon télécharger
    if (onSubmit) {
      await onSubmit(canvas);
    } else {
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
    }
  };

  // Duplication d'un élément
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <h3 style={{ color: "#4682B4", margin: 0 }}>
          {editingEvent ? "Modifier un flyer" : "Flyer Libre (personnalisé)"}
        </h3>
        {editingEvent && (
          <button
            type="button"
            onClick={() => {
              setEditingEvent?.(null);
              setSelectedFlyerModel?.(null);
              setFlyerSquares?.({
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
              // Désélectionne si on clique sur le fond du canvas
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
                          padding: 0,
                          overflow: "hidden",
                        }}
                        rows={3}
                      />
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
                        pointerEvents: "auto",
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
                          pointerEvents: "none",
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

      {/* Boutons d'action */}
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

      {/* Contrôles de fond */}
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

export default EventsTab;
