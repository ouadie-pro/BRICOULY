// frontend/src/components/RatingModal.jsx
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FiX, FiStar, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';

const ratingLabels = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent!'
};

const categoryLabels = {
  punctuality: 'Punctuality',
  professionalism: 'Professionalism',
  quality: 'Quality'
};

const StarSelector = ({ value, onChange, size = 'lg', interactive = true }) => {
  const [hover, setHover] = useState(0);
  const displayValue = interactive ? (hover || value) : value;
  const starSizes = { sm: 'text-2xl', md: 'text-3xl', lg: 'text-4xl' };
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`transition-all ${interactive ? 'hover:scale-110 focus:outline-none' : 'cursor-default'}`}
        >
          <FiStar
            className={`${starSizes[size]} ${
              star <= displayValue 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-slate-300 dark:text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const CategoryRating = ({ label, value, onChange, icon }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-2">
      {icon && <span className="text-slate-400">{icon}</span>}
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </div>
    <StarSelector value={value} onChange={onChange} size="sm" />
  </div>
);

export default function RatingModal({ 
  isOpen, 
  onClose, 
  provider, 
  booking, 
  serviceRequest,
  onReviewSubmitted,
  existingReview = null
}) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [punctuality, setPunctuality] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [quality, setQuality] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [canReview, setCanReview] = useState(null);
  const [checkingReview, setCheckingReview] = useState(true);

  useEffect(() => {
    if (isOpen && provider) {
      if (existingReview) {
        setSelectedRating(existingReview.rating || 0);
        setComment(existingReview.comment || '');
        setPunctuality(existingReview.punctuality || 5);
        setProfessionalism(existingReview.professionalism || 5);
        setQuality(existingReview.quality || 5);
        setCheckingReview(false);
      } else {
        // Reset form
        setSelectedRating(0);
        setHoverRating(0);
        setComment('');
        setPunctuality(5);
        setProfessionalism(5);
        setQuality(5);
        setError('');
        setSuccess(false);
        
        // Check if user can review
        const checkReviewEligibility = async () => {
          setCheckingReview(true);
          try {
            const result = await api.checkCanReview(provider.id || provider._id);
            if (result.canReview) {
              setCanReview(result);
              // Pre-fill service name if available
              if (result.serviceName) {
                // Could set a note or something
              }
            } else {
              setError(result.reason || 'You cannot review this provider at this time.');
            }
          } catch (err) {
            console.error('Error checking review eligibility:', err);
            setError('Unable to verify review eligibility. Please try again.');
          } finally {
            setCheckingReview(false);
          }
        };
        checkReviewEligibility();
      }
    }
  }, [isOpen, provider, existingReview]);

  if (!isOpen || !provider) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRating) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const reviewData = {
        providerId: provider.id || provider._id,
        rating: selectedRating,
        comment: comment.trim(),
        punctuality,
        professionalism,
        quality,
      };
      
      if (booking) {
        reviewData.bookingId = booking._id || booking.id;
        reviewData.serviceName = booking.service;
      } else if (serviceRequest) {
        reviewData.serviceRequestId = serviceRequest._id || serviceRequest.id;
        reviewData.serviceName = serviceRequest.title;
      } else if (canReview?.bookingId) {
        reviewData.bookingId = canReview.bookingId;
        reviewData.serviceName = canReview.serviceName;
      } else if (canReview?.serviceRequestId) {
        reviewData.serviceRequestId = canReview.serviceRequestId;
        reviewData.serviceName = canReview.serviceName;
      }
      
      if (existingReview) {
        reviewData.reviewId = existingReview.id || existingReview._id;
      }

      const result = await api.submitReview(reviewData);

      if (result.success || result.review) {
        setSuccess(true);
        if (onReviewSubmitted) {
          onReviewSubmitted({
            rating: selectedRating,
            comment,
            punctuality,
            professionalism,
            quality,
            newRating: result.providerStats?.rating || result.newRating,
            reviewCount: result.providerStats?.reviewCount || result.reviewCount
          });
        }
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Error submitting review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Error submitting review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || selectedRating;

  // Loading state
  if (checkingReview) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-8 text-center">
          <FiLoader className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Checking review eligibility...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="text-3xl text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Review Submitted!</h3>
          <p className="text-slate-500 dark:text-slate-400">
            Thank you for your feedback. It helps {provider.name} improve their service.
          </p>
        </div>
      </div>
    );
  }

  // Error state (cannot review)
  if (error && !canReview && !existingReview) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-3xl text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cannot Submit Review</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            {provider.avatar ? (
              <img 
                src={provider.avatar.startsWith('http') ? provider.avatar : window.location.origin + provider.avatar} 
                alt={provider.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{provider.name?.charAt(0) || '?'}</span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {existingReview ? 'Edit Your Review' : `Rate ${provider.name}`}
              </h3>
              {canReview?.serviceName && !existingReview && (
                <p className="text-xs text-slate-500 dark:text-slate-400">Service: {canReview.serviceName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <FiX className="text-xl text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Main Rating */}
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-3 font-medium">
              How was your experience?
            </p>
            <div className="flex justify-center mb-3">
              <StarSelector 
                value={selectedRating} 
                onChange={setSelectedRating}
                onHover={setHoverRating}
                hoverVal={hoverRating}
              />
            </div>
            <p className="text-sm font-medium" style={{ color: selectedRating ? '#f59e0b' : '#6b7280' }}>
              {displayRating ? ratingLabels[displayRating] : 'Tap a star to rate'}
            </p>
          </div>

          {/* Detailed Ratings */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rate details</p>
            <div className="space-y-2">
              <CategoryRating 
                label="Punctuality" 
                value={punctuality} 
                onChange={setPunctuality}
                icon="⏰"
              />
              <CategoryRating 
                label="Professionalism" 
                value={professionalism} 
                onChange={setProfessionalism}
                icon="🎩"
              />
              <CategoryRating 
                label="Work Quality" 
                value={quality} 
                onChange={setQuality}
                icon="✨"
              />
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Write a review (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 p-4 text-base text-slate-900 dark:text-white placeholder:text-slate-400 min-h-[120px]"
              placeholder="Share your experience with this provider..."
              maxLength={1000}
            />
            <div className="flex justify-between mt-1 px-1">
              <p className="text-xs text-slate-400">Your feedback helps others make better decisions.</p>
              <p className="text-xs text-slate-400">{comment.length}/1000</p>
            </div>
          </div>

          {/* Error message */}
          {error && canReview === false && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedRating || isSubmitting}
              className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="animate-spin" />
                  Submitting...
                </>
              ) : (
                existingReview ? 'Update Review' : 'Submit Review'
              )}
            </button>
          </div>

          {/* Trust message */}
          <p className="text-xs text-center text-slate-400 pt-2">
            Your review is anonymous to other users. Providers cannot see who left the review.
          </p>
        </form>
      </div>
    </div>
  );
}