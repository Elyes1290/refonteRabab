// Toujours utiliser rababali.com (API configurée avec CORS)
const API_BASE_URL = "https://rababali.com/rabab/api/db_connect.php";

// Fonction utilitaire pour générer les URLs
export const getApiUrl = (
  endpoint: string = "db_connect.php",
  action?: string
) => {
  const baseUrl = "https://rababali.com/rabab/api";
  const url = `${baseUrl}/${endpoint}`;
  return action ? `${url}?action=${action}` : url;
};

export const getDomainUrl = () => {
  return "https://rababali.com";
};

export interface ReservationData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  service_type: "seance_online" | "seance_presentiel";
  date_reservation: string;
  heure_reservation: string;
  montant: number;
  notes?: string;
}

export interface Reservation extends ReservationData {
  id: number;
  statut: "en_attente" | "confirmee" | "annulee" | "terminee";
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions: RequestInit = {
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erreur ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("Erreur API:", error);
      throw error;
    }
  }

  // Créer une nouvelle réservation
  async createReservation(
    reservationData: ReservationData
  ): Promise<ApiResponse<Reservation>> {
    const formData = new FormData();
    formData.append("action", "create_reservation");
    formData.append("nom", reservationData.nom);
    formData.append("prenom", reservationData.prenom);
    formData.append("email", reservationData.email);
    formData.append("telephone", reservationData.telephone);
    formData.append("service_type", reservationData.service_type);
    formData.append("date_reservation", reservationData.date_reservation);
    formData.append("heure_reservation", reservationData.heure_reservation);
    formData.append("montant", reservationData.montant.toString());
    if (reservationData.notes) {
      formData.append("notes", reservationData.notes);
    }

    return this.request<Reservation>("", {
      method: "POST",
      body: formData,
    });
  }

  // Vérifier la disponibilité d'un créneau
  async checkAvailability(
    date: string,
    heure: string,
    serviceType: "seance_online" | "seance_presentiel"
  ): Promise<ApiResponse<{ available: boolean }>> {
    const formData = new FormData();
    formData.append("action", "check_availability");
    formData.append("date", date);
    formData.append("heure", heure);
    formData.append("service_type", serviceType);

    return this.request<{ available: boolean }>("", {
      method: "POST",
      body: formData,
    });
  }

  // Récupérer toutes les réservations
  async getReservations(): Promise<ApiResponse<Reservation[]>> {
    return this.request<Reservation[]>("?action=get_reservations");
  }

  // Vérifier la santé de l'API
  async healthCheck(): Promise<
    ApiResponse<{ timestamp: string; environment: string }>
  > {
    return this.request<{ timestamp: string; environment: string }>(
      "?action=health"
    );
  }
}

export const apiService = new ApiService();
