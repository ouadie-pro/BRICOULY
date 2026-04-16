import { useState } from 'react';
import { api } from '../services/api';
import { FiX, FiSend } from 'react-icons/fi';

export default function ApplyModal({ isOpen, onClose, post, onApplicationSubmitted }) {
  const [message, setMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await api.applyToPost({
        postId: post.id || post._id,
        message: message.trim(),
        proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onApplicationSubmitted) onApplicationSubmitted(result.application);
          onClose();
          setMessage('');
          setProposedPrice('');
          setSuccess(false);
        }, 1500);
      } else {
        setError(result.error || 'Erreur lors de la candidature');
      }
    } catch (err) {
      console.error('Error applying:', err);
      setError('Erreur lors de la candidature');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Postuler à cette mission
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <FiX style={{ fontSize: '24px' }} className="text-slate-500" />
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Description</p>
          <p className="text-slate-900 dark:text-white">{post.content}</p>
          {post.serviceType && (
            <div className="mt-2">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                {post.serviceType}
              </span>
            </div>
          )}
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSend className="text-3xl text-green-600" />
            </div>
            <p className="text-lg font-bold text-green-600">Candidature envoyée !</p>
            <p className="text-sm text-slate-500 mt-2">Le client vous contactera bientôt.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Prix proposé (MAD) - Optionnel
              </label>
              <input
                type="number"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                placeholder="Ex: 500"
                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent"
                min="0"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Message au client - Optionnel
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Présentez-vous et expliquez pourquoi vous êtes qualifié pour ce travail..."
                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{message.length}/500</p>
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
                disabled={isSubmitting}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Envoi...' : 'Envoyer ma candidature'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
