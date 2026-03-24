import { useEffect, useState } from 'react';
import Alert from '../components/common/Alert';
import PageHeader from '../components/common/PageHeader';
import { getMyBookings, rescheduleBooking } from '../api/bookingApi';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, toDateInputValue } from '../utils/date';

const BookingsPage = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});

  const loadBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getMyBookings(token);
      setBookings(data.bookings || []);
      setDrafts(
        (data.bookings || []).reduce((acc, booking) => {
          acc[booking.id] = {
            date: booking.date || toDateInputValue(),
            startTime: booking.startTime || '06:00'
          };
          return acc;
        }, {})
      );
    } catch (apiError) {
      setError(apiError.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [token]);

  const updateDraft = (bookingId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [bookingId]: {
        ...current[bookingId],
        [field]: value
      }
    }));
  };

  const submitReschedule = async (bookingId) => {
    const draft = drafts[bookingId];
    if (!draft) return;

    setError('');
    setMessage('');

    try {
      const data = await rescheduleBooking({
        bookingId,
        date: draft.date,
        startTime: draft.startTime,
        token
      });

      setMessage(`Booking #${bookingId} rescheduled. ${data.priceAdjustment.type}: ${formatCurrency(data.priceAdjustment.amount)}`);
      await loadBookings();
    } catch (apiError) {
      setError(apiError.message || 'Failed to reschedule booking');
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader
        title="My Bookings"
        subtitle="Review all confirmed bookings. Rescheduling is only allowed when start time is more than 12 hours away."
      />

      <Alert type="success" message={message} />
      <Alert type="error" message={error} />

      {loading ? (
        <p className="text-slate-600">Loading bookings...</p>
      ) : !bookings.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-700">
          No bookings yet.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink-900">Booking #{booking.id}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Venue {booking.venueId} • {booking.date} • Court {booking.court}
                  </p>
                  <p className="text-sm text-slate-600">
                    {booking.startTime} - {booking.endTime} • {formatCurrency(booking.price)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.canReschedule ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {booking.canReschedule ? 'Eligible to reschedule' : booking.rescheduleReason || 'Not eligible'}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <input
                  type="date"
                  value={drafts[booking.id]?.date || toDateInputValue()}
                  onChange={(event) => updateDraft(booking.id, 'date', event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-brand-500 transition focus:ring-2"
                  disabled={!booking.canReschedule}
                />
                <input
                  type="time"
                  step={3600}
                  value={drafts[booking.id]?.startTime || '06:00'}
                  onChange={(event) => updateDraft(booking.id, 'startTime', event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-brand-500 transition focus:ring-2"
                  disabled={!booking.canReschedule}
                />
                <button
                  type="button"
                  onClick={() => submitReschedule(booking.id)}
                  disabled={!booking.canReschedule}
                  className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reschedule
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default BookingsPage;
