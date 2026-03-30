import { useState, useMemo } from 'react';

type Step = 'calendar' | 'time' | 'form' | 'confirmed';

interface BookingData {
  date: Date | null;
  time: string;
  name: string;
  email: string;
  phone: string;
  service: string;
}

const SERVICES = [
  { label: '1 Hour Session', price: 15 },
  { label: '2 Hour Session', price: 25 },
  { label: 'Half Day', price: 45 },
];

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function generateRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = '';
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

function generateAccessCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const newH = h + hours;
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function BookingDemo() {
  const [step, setStep] = useState<Step>('calendar');
  const [booking, setBooking] = useState<BookingData>({
    date: null,
    time: '',
    name: '',
    email: '',
    phone: '',
    service: `1 Hour Session - \u00A315`,
  });
  const [bookingRef] = useState(generateRef);
  const [accessCode] = useState(generateAccessCode);

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days: { date: Date; available: boolean; isToday: boolean; isPast: boolean }[] = [];

    // Empty cells for alignment
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: new Date(0), available: false, isToday: false, isPast: true });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(viewYear, viewMonth, d);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Seeded availability: weekdays mostly available, weekends busier
      const seed = viewYear * 10000 + viewMonth * 100 + d;
      const rand = seededRandom(seed);
      let available = !isPast;
      if (available && isWeekend) {
        available = rand > 0.5;
      } else if (available) {
        available = rand > 0.15;
      }

      days.push({ date, available, isToday, isPast });
    }

    return days;
  }, [viewMonth, viewYear]);

  // Generate booked time slots for selected date
  const bookedSlots = useMemo(() => {
    if (!booking.date) return new Set<string>();
    const seed = booking.date.getFullYear() * 10000 + booking.date.getMonth() * 100 + booking.date.getDate();
    const booked = new Set<string>();
    TIME_SLOTS.forEach((slot, i) => {
      if (seededRandom(seed * 100 + i) < 0.25) {
        booked.add(slot);
      }
    });
    return booked;
  }, [booking.date]);

  const selectDate = (date: Date) => {
    setBooking({ ...booking, date, time: '' });
    setStep('time');
  };

  const selectTime = (time: string) => {
    setBooking({ ...booking, time });
    setStep('form');
  };

  const confirmBooking = () => {
    setStep('confirmed');
  };

  const startOver = () => {
    setStep('calendar');
    setBooking({ date: null, time: '', name: '', email: '', phone: '', service: `1 Hour Session - \u00A315` });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const selectedServiceHours = booking.service.includes('Half Day') ? 4 : booking.service.includes('2 Hour') ? 2 : 1;

  const isFormValid = booking.name.trim() && booking.email.trim() && booking.phone.trim();

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6" aria-label="Booking steps">
        {['Date', 'Time', 'Details', 'Confirmed'].map((label, i) => {
          const stepIndex = ['calendar', 'time', 'form', 'confirmed'].indexOf(step);
          const isActive = i === stepIndex;
          const isComplete = i < stepIndex;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : isComplete
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isComplete ? '\u2713' : i + 1}
              </div>
              <span className={`text-sm hidden sm:inline ${isActive ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                {label}
              </span>
              {i < 3 && <div className="flex-1 h-px bg-slate-200" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Calendar */}
      {step === 'calendar' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              type="button"
              className="border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Previous month"
            >
              &larr;
            </button>
            <h3 className="text-lg font-semibold text-slate-900">{monthName}</h3>
            <button
              onClick={nextMonth}
              type="button"
              className="border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Next month"
            >
              &rarr;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-slate-500 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day.date.getTime() === 0) {
                return <div key={`empty-${i}`} />;
              }
              const d = day.date.getDate();
              return (
                <button
                  key={`day-${d}`}
                  type="button"
                  disabled={!day.available || day.isPast}
                  onClick={() => day.available && !day.isPast && selectDate(day.date)}
                  className={`aspect-square rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center ${
                    day.isToday
                      ? day.available
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-500 hover:bg-purple-200'
                        : 'bg-slate-100 text-slate-400 border-2 border-purple-300'
                      : day.isPast
                      ? 'text-slate-300 cursor-default'
                      : day.available
                      ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                      : 'bg-red-50 text-red-300 cursor-not-allowed'
                  }`}
                  aria-label={`${formatDate(day.date)}${day.available ? ', available' : ', unavailable'}`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 mt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-50 border border-green-200 inline-block" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-50 inline-block" /> Fully booked
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-purple-100 border-2 border-purple-500 inline-block" /> Today
            </span>
          </div>
        </div>
      )}

      {/* Step 2: Time slots */}
      {step === 'time' && (
        <div>
          <button
            onClick={() => setStep('calendar')}
            type="button"
            className="text-sm text-purple-600 hover:text-purple-800 mb-4 min-h-[44px] inline-flex items-center"
          >
            &larr; Back to calendar
          </button>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {formatDate(booking.date)}
          </h3>
          <p className="text-sm text-slate-500 mb-4">Choose an available time slot</p>
          <div className="grid grid-cols-3 gap-2">
            {TIME_SLOTS.map((slot) => {
              const isBooked = bookedSlots.has(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={isBooked}
                  onClick={() => !isBooked && selectTime(slot)}
                  className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    isBooked
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                  }`}
                  aria-label={`${slot}${isBooked ? ', booked' : ', available'}`}
                >
                  {slot}
                  {isBooked && <span className="block text-xs text-slate-400">Booked</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Confirmation form */}
      {step === 'form' && (
        <div>
          <button
            onClick={() => setStep('time')}
            type="button"
            className="text-sm text-purple-600 hover:text-purple-800 mb-4 min-h-[44px] inline-flex items-center"
          >
            &larr; Back to time slots
          </button>

          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-800 font-medium">
              {formatDate(booking.date)} at {booking.time}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="bd-name" className="block text-sm font-medium text-slate-700 mb-1">
                Your name
              </label>
              <input
                id="bd-name"
                type="text"
                value={booking.name}
                onChange={(e) => setBooking({ ...booking, name: e.target.value })}
                placeholder="e.g. Jane Smith"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="bd-email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="bd-email"
                type="email"
                value={booking.email}
                onChange={(e) => setBooking({ ...booking, email: e.target.value })}
                placeholder="jane@example.com"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="bd-phone" className="block text-sm font-medium text-slate-700 mb-1">
                Phone number
              </label>
              <input
                id="bd-phone"
                type="tel"
                value={booking.phone}
                onChange={(e) => setBooking({ ...booking, phone: e.target.value })}
                placeholder="07700 900000"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="bd-service" className="block text-sm font-medium text-slate-700 mb-1">
                Session type
              </label>
              <select
                id="bd-service"
                value={booking.service}
                onChange={(e) => setBooking({ ...booking, service: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white min-h-[44px]"
              >
                {SERVICES.map((s) => (
                  <option key={s.label} value={`${s.label} - \u00A3${s.price}`}>
                    {s.label} - \u00A3{s.price}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={confirmBooking}
              type="button"
              disabled={!isFormValid}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmed */}
      {step === 'confirmed' && (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h3>

          <div className="bg-slate-50 rounded-lg p-6 max-w-sm mx-auto text-left space-y-3 mt-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Reference</span>
              <span className="font-mono font-semibold text-slate-900">{bookingRef}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date</span>
              <span className="text-slate-900">{formatDate(booking.date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Time</span>
              <span className="text-slate-900">{booking.time} - {addHours(booking.time, selectedServiceHours)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Session</span>
              <span className="text-slate-900">{booking.service}</span>
            </div>
            <hr className="border-slate-200" />
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Access Code</span>
              <span className="font-mono font-bold text-xl text-green-600">{accessCode}</span>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-600 space-y-1">
            <p>An email confirmation has been sent to <strong>{booking.email}</strong></p>
            <p>Your access code is valid from <strong>{booking.time}</strong> to <strong>{addHours(booking.time, selectedServiceHours)}</strong></p>
          </div>

          <button
            onClick={startOver}
            type="button"
            className="mt-6 border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]"
          >
            Start Over
          </button>
        </div>
      )}

      {/* Note */}
      <div className="mt-6 flex items-start gap-2">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 2a6 6 0 00-6 6c0 2.21 1.2 4.16 3 5.2V15a1 1 0 001 1h4a1 1 0 001-1v-1.8c1.8-1.04 3-2.99 3-5.2a6 6 0 00-6-6zm-1 14h2v1a1 1 0 01-2 0v-1z" />
        </svg>
        <p className="text-sm text-slate-500 italic">
          This is how Fakenham Dog Field works. Customers book and pay online, and get an access code automatically. No phone calls, no manual emails.
        </p>
      </div>
    </div>
  );
}