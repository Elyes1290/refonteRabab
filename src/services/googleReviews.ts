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

// Fonction pour récupérer les avis Google via notre API backend
export const fetchGoogleReviews =
  async (): Promise<GooglePlaceDetails | null> => {
    try {
      // Toujours utiliser l'API de production (rababali.com)
      const apiBase = "https://rababali.com/rabab/api";

      const response = await fetch(`${apiBase}/google_reviews_simple.php`);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        console.error("Erreur API Google:", data.message, data.error);
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
  // URL de fallback - votre vraie URL Google My Business
  return "https://g.page/r/CZq788eH7GZ7EBM/review";
};

// Fonction pour obtenir l'URL de tous les avis
export const getGoogleAllReviewsUrl = (placeId?: string): string => {
  const id = placeId || PLACE_ID;
  if (id) {
    return `https://www.google.com/maps/place/?q=place_id:${id}`;
  }
  // URL de fallback - votre vraie URL Google My Business
  return "https://g.page/r/CZq788eH7GZ7EBM";
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
