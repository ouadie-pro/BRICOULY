// frontend/src/components/BookingScreen.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiPhone, FiMail,
  FiStar, FiCheckCircle, FiAlertCircle, FiLoader, FiDollarSign,
  FiUser, FiBriefcase, FiMessageSquare, FiCreditCard, FiShield,
  FiChevronRight, FiChevronLeft, FiInfo, FiCheck, FiX
} from 'react-icons/fi';

// Available time slots
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

// Booking steps
const STEPS = [
  { id: 1, name: 'Select Service', icon: FiBriefcase },
  { id: 2, name: 'Choose Date & Time', icon: FiCalendar },
  { id: 3, name: 'Location Details', icon: FiMapPin },
  { id: 4, name: 'Review & Confirm', icon: FiCheckCircle }
];

// Service card component
const ServiceCard = ({ service, isSelected, onSelect }) => (
  <div
    onClick={() => onSelect(service)}
    className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
      isSelected 
        ? 'border-primary bg-primary/5 shadow-md' 
        : 'border-slate-200 hover:border-primary/50 hover:shadow-sm'
    }`}
  >
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h4 className="font-semibold text-slate-900">{service.name}</h4>
        {service.description && (
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{service.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg font-bold text-primary">{service.price} MAD</span>
          <span className="text-xs text-slate-400">/ service</span>
        </div>
      </div>
      {isSelected && (
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <FiCheck className="text-white text-sm" />
        </div>
      )}
    </div>
  </div>
);

// Time slot component
const TimeSlot = ({ time, isSelected, onSelect, isBooked = false }) => (
  <button
    onClick={() => !isBooked && onSelect(time)}
    disabled={isBooked}
    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isSelected
        ? 'bg-primary text-white shadow-md'
        : isBooked
        ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
        : 'bg-slate-100 text-slate-700 hover:bg-primary/20 hover:text-primary'
    }`}
  >
    {time}
  </button>
);

// Date picker component
const DatePicker = ({ selectedDate, onSelect, minDate, bookedDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const isPast = date < minDate;
      const isBooked = bookedDates.some(booked => 
        booked.toDateString() === date.toDateString()
      );
      days.push({ date, isPast, isBooked });
    }
    setCalendarDays(days);
  };

  const changeMonth = (increment) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + increment, 1));
  };

  const isSelected = (date) => {
    return selectedDate && date && date.toDateString() === selectedDate.toDateString();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <FiChevronLeft />
        </button>
        <h4 className="font-semibold text-slate-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>
        <button
          onClick={() => changeMonth(1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <FiChevronRight />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div key={index} className="aspect-square">
            {day ? (
              <button
                onClick={() => !day.isPast && !day.isBooked && onSelect(day.date)}
                disabled={day.isPast || day.isBooked}
                className={`w-full h-full rounded-lg text-sm font-medium transition-all ${
                  isSelected(day.date)
                    ? 'bg-primary text-white'
                    : day.isPast || day.isBooked
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                    : 'hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {day.date.getDate()}
              </button>
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-3 h-3 rounded-full bg-slate-300" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal
const ConfirmationModal = ({ isOpen, onClose, onConfirm, booking }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <FiCheckCircle className="text-green-500 text-2xl" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Confirm Booking?</h3>
          <p className="text-slate-500 text-sm mt-1">
            Review your booking details before confirming
          </p>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Service:</span>
            <span className="font-medium text-slate-900">{booking?.service}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Date:</span>
            <span className="font-medium text-slate-900">{booking?.date?.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Time:</span>
            <span className="font-medium text-slate-900">{booking?.time}</span>
          </div>
          {booking?.address && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Address:</span>
              <span className="font-medium text-slate-900 truncate max-w-[200px]">{booking.address}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between">
            <span className="font-semibold text-slate-900">Total:</span>
            <span className="font-bold text-primary text-lg">{booking?.price} MAD</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-lg font-medium">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-primary text-white rounded-lg font-medium">
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

// Success Modal
const SuccessModal = ({ isOpen, onClose, booking }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <FiCheckCircle className="text-green-500 text-3xl" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h3>
        <p className="text-slate-500 mb-4">
          Your booking has been successfully created. The provider will be notified.
        </p>
        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm text-slate-600 mb-2">
            <strong>Booking ID:</strong> {booking?.bookingId?.slice(-8)}
          </p>
          <p className="text-sm text-slate-600">
            <strong>Status:</strong> <span className="text-yellow-600">Pending Confirmation</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.location.href = '/bookings'} className="flex-1 py-3 bg-primary text-white rounded-lg font-medium">
            View My Bookings
          </button>
          <button onClick={() => window.location.href = '/home'} className="flex-1 py-3 border border-slate-200 rounded-lg font-medium">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default function BookingScreen({ isDesktop }) {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isClient = currentUser.role === 'client';

  // State
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  
  // UI state
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Redirect non-clients
  useEffect(() => {
    if (!isClient) {
      showToast('Only clients can book services', 'error');
      navigate('/home');
    }
  }, [isClient, navigate, showToast]);

  // Fetch provider data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [providerData, servicesData] = await Promise.all([
          api.getProvider(providerId),
          api.getProviderServices(providerId)
        ]);
        
        if (providerData?.name) {
          setProvider(providerData);
          const normalizedServices = (servicesData || []).map(s => ({
            id: s._id || s.id,
            name: s.name,
            description: s.description,
            price: s.price
          }));
          setServices(normalizedServices);
          if (normalizedServices.length === 1) {
            setSelectedService(normalizedServices[0]);
          }
        } else {
          setError('Provider not found');
        }
      } catch (err) {
        console.error('Error fetching provider:', err);
        setError('Failed to load provider information');
        showToast('Failed to load provider information', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    if (providerId) {
      fetchData();
    }
  }, [providerId, showToast]);

  // Validate current step
  const validateStep = () => {
    const errors = {};
    
    if (currentStep === 1 && !selectedService) {
      errors.service = 'Please select a service';
    }
    
    if (currentStep === 2) {
      if (!selectedDate) {
        errors.date = 'Please select a date';
      }
      if (!selectedTime) {
        errors.time = 'Please select a time';
      }
    }
    
    if (currentStep === 3 && !address.trim()) {
      errors.address = 'Please provide your address';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      showToast('Please complete all required fields', 'error');
    }
  };

  // Handle previous step
  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle booking submission
  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      showToast('Please complete all booking details', 'error');
      return;
    }
    
    if (!address.trim()) {
      showToast('Please provide your address', 'error');
      setCurrentStep(3);
      return;
    }
    
    setShowConfirmModal(true);
  };

  const confirmBooking = async () => {
    setSubmitting(true);
    setShowConfirmModal(false);
    setBookingInProgress(true);
    
    try {
      const bookingData = {
        provider: providerId,
        service: selectedService.name,
        serviceId: selectedService.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        address: address.trim(),
        notes: notes.trim(),
        price: selectedService.price,
      };
      
      const result = await api.createBooking(bookingData);
      
      if (result.success) {
        setCreatedBooking({
          bookingId: result.booking._id,
          service: selectedService.name,
          date: selectedDate,
          time: selectedTime,
          price: selectedService.price
        });
        setShowSuccessModal(true);
        
        // Send notification via Socket.IO if available
        if (window.socket) {
          window.socket.emit('booking_created', {
            providerId,
            bookingId: result.booking._id,
            service: selectedService.name
          });
        }
      } else {
        showToast(result.error || 'Failed to create booking', 'error');
        setError(result.error || 'Booking failed');
      }
    } catch (err) {
      console.error('Booking error:', err);
      showToast('Failed to create booking. Please try again.', 'error');
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
      setBookingInProgress(false);
    }
  };

  // Get current step status
  const getStepStatus = (step) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-primary mx-auto mb-4" />
          <p className="text-slate-500">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <FiAlertCircle className="text-5xl text-red-400 mb-4" />
        <p className="text-slate-600 text-lg mb-4">{error || 'Provider not found'}</p>
        <button onClick={() => navigate('/search')} className="px-6 py-2 bg-primary text-white rounded-lg">
          Find Other Providers
        </button>
      </div>
    );
  }

  // Mobile Layout
  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="flex items-center p-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
              <FiArrowLeft className="text-2xl" />
            </button>
            <h1 className="flex-1 text-lg font-bold text-slate-900 text-center">Book Service</h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Progress Steps */}
        <div className="bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex-1 text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all ${
                    status === 'completed' ? 'bg-green-500 text-white' :
                    status === 'current' ? 'bg-primary text-white' :
                    'bg-slate-200 text-slate-400'
                  }`}>
                    {status === 'completed' ? <FiCheck className="text-sm" /> : step.id}
                  </div>
                  <p className={`text-[10px] mt-1 ${
                    status === 'current' ? 'text-primary font-medium' : 'text-slate-400'
                  }`}>
                    {step.name.split(' ')[0]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Provider Info */}
        <div className="bg-white p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {provider.avatar ? (
              <img 
                src={provider.avatar.startsWith('http') ? provider.avatar : window.location.origin + provider.avatar} 
                alt={provider.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {provider.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-bold text-slate-900">{provider.name}</h2>
              <p className="text-sm text-slate-500">{provider.profession}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <FiStar className="text-amber-400 text-sm" />
                <span className="text-sm font-medium">{provider.rating || 0}</span>
                <span className="text-xs text-slate-400">({provider.reviewCount || 0})</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Response Time</p>
              <p className="text-sm font-medium text-green-600">{provider.responseTime || '< 1 hour'}</p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <main className="flex-1 p-4">
          {currentStep === 1 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 mb-3">Select a Service</h3>
              {services.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
                  <FiBriefcase className="text-4xl text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No services available</p>
                </div>
              ) : (
                services.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedService?.id === service.id}
                    onSelect={setSelectedService}
                  />
                ))
              )}
              {validationErrors.service && (
                <p className="text-red-500 text-sm text-center">{validationErrors.service}</p>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Select Date</h3>
                <DatePicker
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  minDate={new Date()}
                  bookedDates={[]}
                />
                {validationErrors.date && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.date}</p>
                )}
              </div>
              
              {selectedDate && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Select Time</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map(time => (
                      <TimeSlot
                        key={time}
                        time={time}
                        isSelected={selectedTime === time}
                        onSelect={setSelectedTime}
                      />
                    ))}
                  </div>
                  {validationErrors.time && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.time}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Service Address</h3>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address including city and postal code..."
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                {validationErrors.address && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  <FiInfo className="inline mr-1 text-xs" />
                  This address will be shared with the provider for service delivery
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Additional Notes (Optional)</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or details for the provider..."
                  rows={2}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-primary/5 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900">Booking Summary</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service</span>
                    <span className="font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date</span>
                    <span className="font-medium">{selectedDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provider</span>
                    <span className="font-medium">{provider.name}</span>
                  </div>
                  {address && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Address</span>
                      <span className="font-medium text-right max-w-[200px]">{address}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-3 mt-2 flex justify-between">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-bold text-primary text-xl">{selectedService?.price} MAD</span>
                  </div>
                </div>
              </div>
              
              {notes && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 font-medium mb-1">Notes for provider:</p>
                  <p className="text-sm text-slate-600 italic">"{notes}"</p>
                </div>
              )}
              
              <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
                <FiShield className="text-blue-500 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium">Booking Protection</p>
                  <p>Your booking is protected. The provider will confirm within 24 hours.</p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Navigation Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
          <div className="flex gap-3 max-w-md mx-auto">
            {currentStep > 1 && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium"
              >
                Back
              </button>
            )}
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-medium"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
              >
                {submitting ? <FiLoader className="animate-spin inline mr-2" /> : null}
                {submitting ? 'Processing...' : 'Confirm Booking'}
              </button>
            )}
          </div>
        </div>

        {/* Modals */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmBooking}
          booking={{
            service: selectedService?.name,
            date: selectedDate,
            time: selectedTime,
            address,
            price: selectedService?.price
          }}
        />

        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/bookings');
          }}
          booking={createdBooking}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="max-w-6xl mx-auto p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 mb-6 hover:text-primary transition-colors">
        <FiArrowLeft /> Back to Provider
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Steps Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center justify-between">
                {STEPS.map((step, idx) => {
                  const status = getStepStatus(step.id);
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          status === 'completed' ? 'bg-green-500 text-white' :
                          status === 'current' ? 'bg-primary text-white shadow-md' :
                          'bg-slate-200 text-slate-400'
                        }`}>
                          {status === 'completed' ? <FiCheck className="text-lg" /> : step.id}
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${
                            status === 'current' ? 'text-primary' : 'text-slate-500'
                          }`}>
                            {step.name}
                          </p>
                        </div>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={`w-16 h-px mx-4 ${
                          status === 'completed' ? 'bg-green-500' : 'bg-slate-300'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6">
              {currentStep === 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Select a Service</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {services.length === 0 ? (
                      <div className="text-center py-12">
                        <FiBriefcase className="text-5xl text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No services available from this provider</p>
                      </div>
                    ) : (
                      services.map(service => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          isSelected={selectedService?.id === service.id}
                          onSelect={setSelectedService}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Date</h3>
                    <DatePicker
                      selectedDate={selectedDate}
                      onSelect={setSelectedDate}
                      minDate={new Date()}
                      bookedDates={[]}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Time</h3>
                    {selectedDate ? (
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map(time => (
                          <TimeSlot
                            key={time}
                            time={time}
                            isSelected={selectedTime === time}
                            onSelect={setSelectedTime}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-xl">
                        <FiCalendar className="text-3xl text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">Please select a date first</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Service Address</h3>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your full address including street, city, and postal code..."
                      rows={4}
                      className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      <FiInfo className="inline mr-1" />
                      This address will be shared with the provider for service delivery
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Additional Notes (Optional)</h3>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special instructions, access codes, or details for the provider..."
                      rows={3}
                      className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Review Your Booking</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-5 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Service</span>
                        <span className="font-medium">{selectedService?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date & Time</span>
                        <span className="font-medium">
                          {selectedDate?.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })} at {selectedTime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Provider</span>
                        <span className="font-medium">{provider.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Location</span>
                        <span className="font-medium text-right max-w-[300px]">{address}</span>
                      </div>
                      {notes && (
                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-slate-500 text-sm mb-1">Notes:</p>
                          <p className="text-sm text-slate-600 italic">"{notes}"</p>
                        </div>
                      )}
                      <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between">
                        <span className="font-bold text-lg">Total</span>
                        <span className="font-bold text-primary text-2xl">{selectedService?.price} MAD</span>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                      <FiShield className="text-blue-500 text-lg mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">What happens next?</p>
                        <p>The provider will confirm your booking within 24 hours. You'll receive a notification once confirmed.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="border-t border-slate-200 p-6 bg-slate-50">
              <div className="flex gap-4">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrev}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  >
                    Previous Step
                  </button>
                )}
                {currentStep < 4 ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                  >
                    Continue to {STEPS[currentStep].name}
                    <FiChevronRight className="inline ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? <FiLoader className="animate-spin inline mr-2" /> : null}
                    {submitting ? 'Processing...' : 'Confirm & Pay'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Provider Info & Summary */}
        <div className="lg:col-span-1">
          {/* Provider Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-20">
            <div className="text-center mb-4">
              {provider.avatar ? (
                <img 
                  src={provider.avatar.startsWith('http') ? provider.avatar : window.location.origin + provider.avatar} 
                  alt={provider.name}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-slate-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mx-auto">
                  <span className="text-3xl font-bold text-white">
                    {provider.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <h3 className="font-bold text-slate-900 text-lg mt-3">{provider.name}</h3>
              <p className="text-slate-500 text-sm">{provider.profession}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <FiStar className="text-amber-400" />
                <span className="text-sm font-medium">{provider.rating || 0}</span>
                <span className="text-xs text-slate-400">({provider.reviewCount || 0} reviews)</span>
              </div>
            </div>
            
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <FiBriefcase className="text-slate-400" />
                <span>{provider.jobsDone || 0} jobs completed</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FiClock className="text-slate-400" />
                <span>Response: {provider.responseTime || '< 1 hour'}</span>
              </div>
              {provider.location && (
                <div className="flex items-center gap-3 text-sm">
                  <FiMapPin className="text-slate-400" />
                  <span>{provider.location}</span>
                </div>
              )}
            </div>
            
            {selectedService && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Selected Service</p>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="font-medium text-slate-900">{selectedService.name}</p>
                  <p className="text-primary font-bold mt-1">{selectedService.price} MAD</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmBooking}
        booking={{
          service: selectedService?.name,
          date: selectedDate,
          time: selectedTime,
          address,
          price: selectedService?.price
        }}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/bookings');
        }}
        booking={createdBooking}
      />
    </div>
  );
}