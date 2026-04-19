import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  FiArrowLeft, FiCheck, FiCalendar, FiClock, FiMessageSquare, FiMapPin, FiPhone,
  FiStar, FiCheckCircle, FiAlertCircle, FiLoader
} from 'react-icons/fi';

const timeSlots = [
  '08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00'
];

export default function BookingScreen({ isDesktop }) {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      try {
        const [providerData, servicesData] = await Promise.all([
          api.getProvider(providerId),
          api.getProviderServices(providerId)
        ]);
        
        if (providerData?.name) {
          setProvider(providerData);
          setServices(servicesData || []);
          if (servicesData?.length > 0) {
            setSelectedService(servicesData[0]);
          }
        } else {
          setError('Prestataire non trouvé');
        }
      } catch (err) {
        console.error('Error fetching provider:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProvider();
  }, [providerId]);

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      return;
    }
    
    setSubmitting(true);
    try {
      const result = await api.createBooking({
        provider: providerId,
        service: selectedService.name,
        serviceId: selectedService.id || selectedService._id,
        date: selectedDate,
        time: selectedTime,
        address,
        notes,
        price: selectedService.price,
      });
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Erreur lors de la création de la réservation');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Erreur lors de la création de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return selectedService !== null;
    if (step === 2) return selectedDate && selectedTime;
    if (step === 3) return true;
    return false;
  };

  const formatCurrency = (amount) => `${amount || 0} MAD`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <FiLoader className="animate-spin text-4xl text-primary" />
      </div>
    );
  }

  if (error && !provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <FiAlertCircle style={{ fontSize: '60px' }} className="text-red-400 mb-4" />
        <p className="text-slate-600 text-lg mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-primary text-white rounded-lg">
          Retour
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <FiCheckCircle style={{ fontSize: '40px' }} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Réservation créée!</h2>
        <p className="text-slate-500 text-center mb-8">
          Votre réservation a été créée avec succès.<br />
          Le prestataire vous contactera bientôt.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/requests')}
            className="px-6 py-3 bg-primary text-white font-medium rounded-xl"
          >
            Voir mes demandes
          </button>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl"
          >
            Accueil
          </button>
        </div>
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center p-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
              <FiArrowLeft style={{ fontSize: '24px' }} />
            </button>
            <h1 className="flex-1 text-lg font-bold text-slate-900 ml-2">Réservation</h1>
          </div>
        </header>

        <div className="p-4">
          {provider && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden">
                {provider.avatar ? (
                  <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xl font-bold text-slate-500">{provider.name?.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{provider.name}</h3>
                <p className="text-sm text-slate-500">{provider.profession}</p>
                <div className="flex items-center gap-1 mt-1">
                  <FiStar style={{ fontSize: '14px' }} className="text-amber-400" />
                  <span className="text-sm font-medium">{provider.rating || 0}</span>
                  <span className="text-xs text-slate-400">({provider.reviewCount || 0} avis)</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4">
            {['Service', 'Date & Heure', 'Détails', 'Confirmer'].map((label, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx + 1)}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b border-slate-100 last:border-b-0 ${
                  step === idx + 1
                    ? 'text-primary bg-blue-50'
                    : 'text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 mb-3">Sélectionnez un service</p>
              {services.length > 0 ? services.map((svc) => (
                <button
                  key={svc.id || svc._id}
                  onClick={() => setSelectedService(svc)}
                  className={`w-full p-4 rounded-xl text-left border-2 transition-all ${
                    selectedService?.id === svc.id || selectedService?._id === svc._id
                      ? 'border-primary bg-blue-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-900">{svc.name}</span>
                    <span className="font-bold text-primary">{formatCurrency(svc.price)}</span>
                  </div>
                  {svc.description && (
                    <p className="text-sm text-slate-500 mt-1">{svc.description}</p>
                  )}
                </button>
              )) : (
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500">Aucun service disponible</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Date</p>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-4 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Créneau horaire</p>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-3 px-2 rounded-xl text-sm font-medium border-2 transition-all ${
                        selectedTime === slot
                          ? 'border-primary bg-blue-50 text-primary'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Adresse (optionnel)</p>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Votre adresse..."
                  className="w-full p-4 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Notes (optionnel)</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Détails supplémentaires..."
                  rows={4}
                  className="w-full p-4 rounded-xl border border-slate-200 bg-white resize-none"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Récapitulatif</h3>
              <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Service</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Heure</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                {address && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Adresse</span>
                    <span className="font-medium">{address}</span>
                  </div>
                )}
                {notes && (
                  <div className="border-t border-slate-200 pt-3">
                    <span className="text-slate-500 block mb-1">Notes</span>
                    <span className="font-medium">{notes}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary">{formatCurrency(selectedService?.price)}</span>
                </div>
              </div>
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>
              )}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-safe">
          <div className="flex gap-3 max-w-md mx-auto">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl"
              >
                Retour
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className={`flex-1 py-3 font-medium rounded-xl ${
                  canProceed()
                    ? 'bg-primary text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-primary text-white font-medium rounded-xl disabled:opacity-50"
              >
                {submitting ? 'Envoi...' : 'Confirmer'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-2xl mx-auto w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 mb-4">
          <FiArrowLeft /> Retour
        </button>

        {provider && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden">
              {provider.avatar ? (
                <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-500">{provider.name?.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{provider.name}</h2>
              <p className="text-slate-500">{provider.profession}</p>
              <div className="flex items-center gap-1 mt-1">
                <FiStar style={{ fontSize: '16px' }} className="text-amber-400" />
                <span className="font-medium">{provider.rating || 0}</span>
                <span className="text-slate-400">({provider.reviewCount || 0} avis)</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="flex">
            {['Service', 'Date & Heure', 'Détails', 'Confirmer'].map((label, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx + 1)}
                className={`flex-1 py-4 px-4 font-medium border-b-2 -mb-px ${
                  step === idx + 1
                    ? 'text-primary border-primary'
                    : 'text-slate-400 border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {step === 1 && (
              <div className="space-y-3">
                <h3 className="font-medium text-slate-700 mb-4">Sélectionnez un service</h3>
                {services.length > 0 ? services.map((svc) => (
                  <button
                    key={svc.id || svc._id}
                    onClick={() => setSelectedService(svc)}
                    className={`w-full p-4 rounded-xl text-left border-2 transition-all ${
                      selectedService?.id === svc.id || selectedService?._id === svc._id
                        ? 'border-primary bg-blue-50'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{svc.name}</span>
                      <span className="font-bold text-primary">{formatCurrency(svc.price)}</span>
                    </div>
                    {svc.description && (
                      <p className="text-sm text-slate-500 mt-1">{svc.description}</p>
                    )}
                  </button>
                )) : (
                  <p className="text-slate-500 text-center py-8">Aucun service disponible</p>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-slate-700 mb-3">Date</h3>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-slate-700 mb-3">Créneau horaire</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-3 rounded-xl font-medium border-2 transition-all ${
                          selectedTime === slot
                            ? 'border-primary bg-blue-50 text-primary'
                            : 'border-slate-200'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-slate-700 mb-3">Adresse (optionnel)</h3>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Votre adresse..."
                    className="w-full p-3 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-slate-700 mb-3">Notes (optionnel)</h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Détails supplémentaires..."
                    rows={4}
                    className="w-full p-3 rounded-xl border border-slate-200 resize-none"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h3 className="font-bold text-lg">Récapitulatif</h3>
                <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service</span>
                    <span className="font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date</span>
                    <span className="font-medium">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Heure</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  {address && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Adresse</span>
                      <span className="font-medium">{address}</span>
                    </div>
                  )}
                  {notes && (
                    <div>
                      <span className="text-slate-500 block">Notes</span>
                      <span className="font-medium">{notes}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-4 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-xl text-primary">{formatCurrency(selectedService?.price)}</span>
                  </div>
                </div>
                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl"
            >
              Retour
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`flex-1 py-4 font-bold rounded-xl ${
                canProceed()
                  ? 'bg-primary text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-4 bg-primary text-white font-bold rounded-xl disabled:opacity-50"
            >
              {submitting ? 'Envoi en cours...' : 'Confirmer la réservation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}