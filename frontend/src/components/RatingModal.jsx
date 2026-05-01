import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FiX, FiStar } from 'react-icons/fi';

const ratingLabels = {
  1: 'Très mauvais',
  2: 'Mauvais',
  3: 'Correct',
  4: 'Bien',
  5: 'Excellent!'
};

const StarSelector = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="transition-transform hover:scale-110 focus:outline-none"
      >
        <span
          style={{
            fontSize: '32px',
            cursor: 'pointer',
            color: star <= value ? '#f59e0b' : '#d1d5db',
          }}
        >
          ★
        </span>
      </button>
    ))}
  </div>
);

export default function RatingModal({ 
  isOpen, 
  onClose, 
  provider, 
  booking, 
  onReviewSubmitted,
  existingReview = null
}) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [punctuality, setPunctuality] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingReview) {
        setSelectedRating(existingReview.rating || 0);
        setComment(existingReview.comment || '');
        setPunctuality(existingReview.punctuality || 5);
        setProfessionalism(existingReview.professionalism || 5);
      } else {
        setSelectedRating(0);
        setHoverRating(0);
        setComment('');
        setPunctuality(5);
        setProfessionalism(5);
      }
      setError('');
    }
  }, [isOpen, existingReview]);

  if (!isOpen || !provider) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRating) {
      setError('Veuillez sélectionner une note');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const reviewData = {
        providerId: provider.id || provider._id,
        rating: selectedRating,
        comment,
        punctuality,
        professionalism,
      };
      
      if (booking) {
        reviewData.serviceRequestId = booking.id || booking._id;
      }
      
      if (existingReview) {
        reviewData.reviewId = existingReview.id || existingReview._id;
      }

      const result = await api.submitReview(reviewData);

      if (result.success || result.review) {
        if (onReviewSubmitted) {
          onReviewSubmitted({
            rating: selectedRating,
            comment,
            newRating: result.providerStats?.rating || result.newRating,
            reviewCount: result.providerStats?.reviewCount || result.reviewCount
          });
        }
        onClose();
        if (window.showToast) {
          window.showToast('Avis publié avec succès !', 'success');
        }
      } else {
        setError(result.error || 'Erreur lors de la soumission');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Erreur lors de la soumission de l\'avis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || selectedRating;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {existingReview ? 'Modifier mon avis' : `Évaluer ${provider.name}`}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <FiX style={{ fontSize: '24px' }} className="text-slate-500" />
          </button>
        </div>

        {booking && (
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Service: <span className="font-medium text-slate-700 dark:text-slate-300">{booking.serviceName || booking.service}</span>
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="text-center mb-6">
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              Comment s'est déroulé le service ?
            </p>
            <div className="flex justify-center mb-2">
              <StarSelector value={displayRating} onChange={setSelectedRating} />
            </div>
            <p className="text-lg font-medium" style={{ color: selectedRating ? '#f59e0b' : '#6b7280' }}>
              {displayRating ? ratingLabels[displayRating] : 'Sélectionnez une note'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ponctualité</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPunctuality(star)}
                    className="focus:outline-none"
                  >
                    <span
                      style={{
                        fontSize: '18px',
                        cursor: 'pointer',
                        color: star <= punctuality ? '#f59e0b' : '#d1d5db',
                      }}
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Professionnalisme</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setProfessionalism(star)}
                    className="focus:outline-none"
                  >
                    <span
                      style={{
                        fontSize: '18px',
                        cursor: 'pointer',
                        color: star <= professionalism ? '#f59e0b' : '#d1d5db',
                      }}
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/50 p-4 text-base text-slate-900 dark:text-white placeholder:text-slate-400 min-h-[120px]"
              placeholder="Partagez votre expérience..."
              maxLength={500}
            />
            <div className="flex justify-between px-1">
              <p className="text-xs text-slate-400">Votre avis aide les autres clients.</p>
              <p className="text-xs text-slate-400">{comment.length}/500</p>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!selectedRating || isSubmitting}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Publication...' : 'Publier l\'avis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
