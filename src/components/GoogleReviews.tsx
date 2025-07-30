import React, { useState, useEffect } from "react";
import "../styles/GoogleReviews.css";

interface GoogleReview {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url?: string;
}

interface GoogleReviewsProps {
  placeId?: string;
  maxReviews?: number;
  showHeader?: boolean;
}

export const GoogleReviews: React.FC<GoogleReviewsProps> = ({
  maxReviews = 6,
  showHeader = true,
}) => {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // Données Google Reviews (vides en attendant les vrais avis)
  const mockReviews: GoogleReview[] = [];

  useEffect(() => {
    // TODO: Remplacer par l'appel API Google My Business
    // Pour l'instant, aucun avis affiché
    setTimeout(() => {
      setReviews(mockReviews.slice(0, maxReviews));
      setAverageRating(0);
      setTotalReviews(0);
      setLoading(false);
    }, 500);
  }, [maxReviews]);

  const renderStars = (
    rating: number,
    size: "small" | "medium" | "large" = "small"
  ) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`google-reviews-star ${
            i <= rating ? "filled" : "empty"
          } ${size}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSeeAllReviews = () => {
    // TODO: Remplacer par l'URL Google My Business réelle
    window.open("https://g.page/r/YOUR_GOOGLE_BUSINESS_ID/review", "_blank");
  };

  if (loading) {
    return (
      <div className="google-reviews-loading">
        <div className="creative-loading"></div>
        <p className="google-reviews-loading-text">
          Chargement des avis Google...
        </p>
      </div>
    );
  }

  return (
    <div className="google-reviews-container">
      {showHeader && (
        <div className="google-reviews-header">
          <h2 className="google-reviews-title">📍 Avis Google</h2>

          {totalReviews > 0 && (
            <div className="google-reviews-rating-summary">
              <div className="google-reviews-stars-container">
                {renderStars(Math.round(averageRating), "large")}
                <span className="google-reviews-average-rating">
                  {averageRating}/5
                </span>
              </div>
              <span className="google-reviews-total-count">
                ({totalReviews} avis)
              </span>
            </div>
          )}

          <button
            onClick={handleSeeAllReviews}
            className="btn-magical zoom-hover google-reviews-see-all-btn"
          >
            🔍 Voir tous les avis sur Google
          </button>
        </div>
      )}

      <div className="google-reviews-grid">
        {reviews.length === 0 ? (
          <div className="google-reviews-no-reviews">
            <p className="google-reviews-empty-message">
              ⭐ Les avis Google apparaîtront bientôt ici !
            </p>
            <p className="google-reviews-empty-subtitle">
              En attendant, n'hésitez pas à laisser votre avis sur Google.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="google-review-card zoom-hover">
              {/* Badge Google */}
              <div className="google-review-badge">Google</div>

              {/* En-tête avec photo et infos */}
              <div className="google-review-header">
                <div
                  className={`google-review-avatar ${
                    !review.profile_photo_url ? "no-photo" : ""
                  }`}
                  style={
                    review.profile_photo_url
                      ? {
                          backgroundImage: `url(${review.profile_photo_url})`,
                        }
                      : undefined
                  }
                >
                  {!review.profile_photo_url && "👤"}
                </div>
                <div className="google-review-author-info">
                  <h3 className="google-review-author-name">
                    {review.author_name}
                  </h3>
                  <div className="google-review-meta">
                    {renderStars(review.rating, "medium")}
                    <span className="google-review-date">
                      {formatDate(review.time)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Texte de l'avis */}
              <p className="google-review-text">"{review.text}"</p>
            </div>
          ))
        )}
      </div>

      {/* Bouton pour voir plus d'avis */}
      <div className="google-reviews-bottom">
        <button
          onClick={handleSeeAllReviews}
          className="google-reviews-leave-review-btn zoom-hover"
        >
          📱 Laisser un avis sur Google
        </button>
      </div>
    </div>
  );
};
