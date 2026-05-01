// frontend/src/components/BookingScreen.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiMessageSquare,
  FiStar, FiCheckCircle, FiAlertCircle, FiLoader, FiUser,
  FiBriefcase, FiChevronRight, FiCheck, FiX
} from 'react-icons/fi';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function BookingScreen({ isDesktop }) {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isClient = currentUser.role === 'client';

  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  // Form state
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (!isClient) {
      showToast('Only clients can make bookings', 'error');
      navigate('/home');
    }
  }, [isClient, navigate, showToast]);

  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      try {
        const [providerData, servicesData] = await Promise.all([
          api.getProvider(providerId),
          api.getProviderServices(providerId)
        ]);
        
        if (providerData && providerData.name) {
          setProvider(providerData);
          const normalizedServices = (servicesData || []).map(s => ({
            id: s._id || s.id,
            name: s.name,
            description: s.description,
            price: s.price
          }));
          setServices(normalizedServices);
        } else {
          setError('Provider not found');
        }
      } catch (err) {
        console.error('Error fetching provider:', err);
        setError('Failed to load provider information');
      } finally {
        setLoading(false);
      }
    };
    
    if (providerId) fetchProvider();
  }, [providerId]);

  const validateStep = () => {
    const errors = {};
    if (step === 1 && !selectedService) errors.service = 'Please select a service';
    if (step === 2) {
      if (!selectedDate) errors.date = 'Please select a date';
      if (!selectedTime) errors.time = 'Please select a time';
    }
    if (step === 3 && !address.trim()) errors.address = 'Please enter your address';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep(prev => Math.min(prev + 1, 4));
    else showToast('Please complete all required fields', 'error');
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !address.trim()) {
      showToast('Please complete all fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.createBooking({
        provider: providerId,
        service: selectedService.name,
        serviceId: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        address: address.trim(),
        notes: notes.trim(),
        price: selectedService.price,
      });

      if (result.success) {
        setCreatedBooking(result.booking);
        setBookingComplete(true);
        showToast('Booking created successfully!', 'success');
      } else {
        showToast(result.error || 'Failed to create booking', 'error');
      }
    } catch (err) {
      console.error('Booking error:', err);
      showToast('Failed to create booking', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading provider details...</p>
        </div>
      </div>
    );
  }

  if (error && !provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <FiAlertCircle className="text-5xl text-red-400 mb-4" />
        <p className="text-gray-600 text-lg mb-4">{error}</p>
        <button onClick={() => navigate('/search')} className="px-6 py-2 bg-blue-500 text-white rounded-lg">
          Find Other Providers
        </button>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="text-4xl text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Request Sent!</h2>
          <p className="text-gray-500 mb-6">
            Your booking request has been sent to {provider.name}.<br />
            You'll receive a notification once they confirm.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-2"><strong>Booking ID:</strong> {createdBooking?._id?.slice(-8)}</p>
            <p className="text-sm text-gray-600"><strong>Status:</strong> <span className="text-yellow-600">Pending Confirmation</span></p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/bookings')} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium">
              My Bookings
            </button>
            <button onClick={() => navigate('/home')} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium">
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Layout
  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center p-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <FiArrowLeft className="text-2xl" />
            </button>
            <h1 className="flex-1 text-lg font-bold text-center">Book Service</h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Provider Info */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {provider?.avatar ? (
              <img src={provider.avatar} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{provider?.name?.charAt(0)}</span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-bold text-gray-900">{provider?.name}</h2>
              <p className="text-sm text-gray-500">{provider?.profession}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <FiStar className="text-yellow-400 text-sm" />
                <span className="text-sm">{provider?.rating || 0}</span>
                <span className="text-xs text-gray-400">({provider?.reviewCount || 0})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex-1 text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all ${
                step > s ? 'bg-green-500 text-white' : step === s ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {step > s ? <FiCheck className="text-sm" /> : s}
              </div>
              <p className={`text-xs mt-1 ${step === s ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                {s === 1 ? 'Service' : s === 2 ? 'Date' : s === 3 ? 'Address' : 'Confirm'}
              </p>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <main className="flex-1 p-4">
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Select a Service</h3>
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`w-full p-4 rounded-xl text-left border-2 transition-all ${
                    selectedService?.id === service.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{service.name}</span>
                    <span className="font-bold text-blue-600">{service.price} MAD</span>
                  </div>
                  {service.description && <p className="text-sm text-gray-500 mt-1">{service.description}</p>}
                </button>
              ))}
              {validationErrors.service && <p className="text-red-500 text-sm text-center">{validationErrors.service}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Select Date</h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                />
                {validationErrors.date && <p className="text-red-500 text-sm mt-1">{validationErrors.date}</p>}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Select Time</h3>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                        selectedTime === time ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                {validationErrors.time && <p className="text-red-500 text-sm mt-1">{validationErrors.time}</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Service Address</h3>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-gray-200 resize-none"
                />
                {validationErrors.address && <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>}
                <p className="text-xs text-gray-400 mt-2">This address will be shared with the provider</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Notes (Optional)</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  rows={2}
                  className="w-full p-3 rounded-xl border border-gray-200 resize-none"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-bold">Booking Summary</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between"><span className="text-gray-500">Service:</span><span className="font-medium">{selectedService?.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Date:</span><span className="font-medium">{selectedDate}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Time:</span><span className="font-medium">{selectedTime}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Provider:</span><span className="font-medium">{provider?.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Address:</span><span className="font-medium">{address}</span></div>
                  {notes && <div><span className="text-gray-500">Notes:</span><p className="text-sm text-gray-600 mt-1 italic">"{notes}"</p></div>}
                  <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between">
                    <span className="font-bold text-lg">Total:</span><span className="font-bold text-blue-600 text-xl">{selectedService?.price} MAD</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={handleBack} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">
                Back
              </button>
            )}
            {step < 4 ? (
              <button onClick={handleNext} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium">
                Continue
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50">
                {submitting ? <FiLoader className="animate-spin inline mr-2" /> : null}
                {submitting ? 'Processing...' : 'Confirm Booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="max-w-6xl mx-auto p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 mb-6">
        <FiArrowLeft /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step > s ? 'bg-green-500 text-white' : step === s ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step > s ? <FiCheck className="text-lg" /> : s}
                    </div>
                    <span className={`ml-2 text-sm ${step === s ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      {s === 1 ? 'Select Service' : s === 2 ? 'Date & Time' : s === 3 ? 'Address' : 'Confirm'}
                    </span>
                    {s < 4 && <div className="w-16 h-px bg-gray-200 mx-4" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6">
              {step === 1 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Choose a Service</h3>
                  <div className="grid gap-3">
                    {services.map(service => (
                      <button key={service.id} onClick={() => setSelectedService(service)} className={`w-full p-4 rounded-xl text-left border-2 transition-all ${
                        selectedService?.id === service.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                      }`}>
                        <div className="flex justify-between"><span className="font-medium">{service.name}</span><span className="font-bold text-blue-600">{service.price} MAD</span></div>
                        {service.description && <p className="text-sm text-gray-500 mt-1">{service.description}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-2 gap-6">
                  <div><h3 className="font-semibold mb-3">Select Date</h3><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={getMinDate()} className="w-full p-3 rounded-xl border border-gray-200" /></div>
                  <div><h3 className="font-semibold mb-3">Select Time</h3><div className="grid grid-cols-3 gap-2">{TIME_SLOTS.map(time => (<button key={time} onClick={() => setSelectedTime(time)} className={`py-2 rounded-lg text-sm border ${selectedTime === time ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200'}`}>{time}</button>))}</div></div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div><h3 className="font-semibold mb-3">Service Address</h3><textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your full address..." rows={3} className="w-full p-3 rounded-xl border border-gray-200 resize-none" /></div>
                  <div><h3 className="font-semibold mb-3">Notes (Optional)</h3><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." rows={2} className="w-full p-3 rounded-xl border border-gray-200 resize-none" /></div>
                </div>
              )}

              {step === 4 && (
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between"><span className="text-gray-500">Service:</span><span className="font-medium">{selectedService?.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Date & Time:</span><span className="font-medium">{selectedDate} at {selectedTime}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Provider:</span><span className="font-medium">{provider?.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Address:</span><span className="font-medium">{address}</span></div>
                  {notes && <div><span className="text-gray-500">Notes:</span><p className="text-sm text-gray-600 mt-1 italic">"{notes}"</p></div>}
                  <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between"><span className="font-bold text-lg">Total:</span><span className="font-bold text-blue-600 text-2xl">{selectedService?.price} MAD</span></div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex gap-4">
                {step > 1 && <button onClick={handleBack} className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium">Back</button>}
                {step < 4 ? <button onClick={handleNext} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium">Continue</button> : <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50">{submitting ? 'Processing...' : 'Confirm Booking'}</button>}
              </div>
            </div>
          </div>
        </div>

        {/* Right - Provider Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-20">
            <div className="text-center mb-4">
              {provider?.avatar ? <img src={provider.avatar} className="w-24 h-24 rounded-full mx-auto object-cover" /> : <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto"><span className="text-3xl font-bold text-white">{provider?.name?.charAt(0)}</span></div>}
              <h3 className="font-bold text-lg mt-3">{provider?.name}</h3>
              <p className="text-gray-500 text-sm">{provider?.profession}</p>
              <div className="flex items-center justify-center gap-1 mt-1"><FiStar className="text-yellow-400" /><span>{provider?.rating || 0}</span><span className="text-gray-400">({provider?.reviewCount || 0})</span></div>
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm"><FiBriefcase className="text-gray-400" /><span>{provider?.jobsDone || 0} jobs completed</span></div>
              <div className="flex items-center gap-2 text-sm"><FiClock className="text-gray-400" /><span>Response: {provider?.responseTime || '< 1 hour'}</span></div>
              {provider?.location && <div className="flex items-center gap-2 text-sm"><FiMapPin className="text-gray-400" /><span>{provider.location}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}