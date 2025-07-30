// Service pour récupérer les avis Google My Business
// Pour utiliser ce service, vous devez :
// 1. Créer un projet Google Cloud Platform
// 2. Activer l'API Google My Business
// 3. Créer une clé API
// 4. Remplacer YOUR_API_KEY et PLACE_ID par vos vraies valeurs

const GOOGLE_API_KEY = import.meta.env?.VITE_GOOGLE_API_KEY;
const PLACE_ID = import.meta.env?.VITE_GOOGLE_PLACE_ID;

export interface GoogleReviewData {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface GooglePlaceDetails {
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReviewData[];
}

// Fonction pour récupérer les avis Google
export const fetchGoogleReviews =
  async (): Promise<GooglePlaceDetails | null> => {
    if (!GOOGLE_API_KEY || !PLACE_ID) {
      console.warn(
        "Google API Key ou Place ID manquant. Utilisation des données de démonstration."
      );
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,reviews,user_ratings_total&key=${GOOGLE_API_KEY}&language=fr`
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "OK") {
        return data.result;
      } else {
        console.error("Erreur Google API:", data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des avis Google:", error);
      return null;
    }
  };

// Fonction pour obtenir l'URL de révision Google My Business
export const getGoogleReviewUrl = (placeId?: string): string => {
  const id = placeId || PLACE_ID;
  if (id) {
    return `https://search.google.com/local/writereview?placeid=${id}`;
  }
  // URL de fallback - à remplacer par votre URL Google My Business
  return "https://g.page/r/YOUR_GOOGLE_BUSINESS_ID/review";
};

// Fonction pour obtenir l'URL de tous les avis
export const getGoogleAllReviewsUrl = (placeId?: string): string => {
  const id = placeId || PLACE_ID;
  if (id) {
    return `https://www.google.com/maps/place/?q=place_id:${id}`;
  }
  // URL de fallback - à remplacer par votre URL Google My Business
  return "https://g.page/YOUR_GOOGLE_BUSINESS_ID";
};

// Configuration pour les variables d'environnement
// Créez un fichier .env dans la racine de votre projet avec :
// VITE_GOOGLE_API_KEY=your_google_api_key
// VITE_GOOGLE_PLACE_ID=your_google_place_id

export const googleReviewsConfig = {
  apiKey: GOOGLE_API_KEY,
  placeId: PLACE_ID,
  hasValidConfig: !!(GOOGLE_API_KEY && PLACE_ID),
};
