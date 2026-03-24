import { useEffect, useState } from 'react';
import Alert from '../components/common/Alert';
import PageHeader from '../components/common/PageHeader';
import { getOwnerBookings } from '../api/bookingApi';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, toDateInputValue } from '../utils/date';

const OwnerBookingsPage = () => {
  const { token } = useAuth();
  const [date, setDate] = useState('');
  const [bookings, setBookings] = useState([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBookings = async (nextDate = date) => {
    setLoading(true);
    setError('');

    try {
      const data = await getOwnerBookings({ token, date: nextDate });
      setBookings(data.bookings || []);
      setCount(data.count || 0);
    } catch (apiError) {
      setError(apiError.message || 'Failed to fetch owner bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings('');
  }, [token]);

  return (
    <section className="space-y-5">
      <PageHeader title="Owner Bookings" subtitle="Track all bookings made on your venue inventory." />

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Filter by date</span>
          <input
            type="date"
            value={date}
            max={toDateInputValue(new Date('2100-12-31'))}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-brand-500 transition focus:ring-2"
          />
        </label>
        <button
          type="button"
          onClick={() => loadBookings(date)}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Apply Filter
        </button>
        <button
          type="button"
          onClick={() => {
            setDate('');
            loadBookings('');
          }}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
        >
          Reset
        </button>
      </div>

      <Alert type="error" message={error} />

      {loading ? (
        <p className="text-slate-600">Loading owner bookings...</p>
      ) : (
        <>
          <p className="text-sm text-slate-600">Total bookings: {count}</p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">Venue</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Court</th>
                  <th className="px-4 py-3 text-left">Booker</th>
                  <th className="px-4 py-3 text-left">Mobile</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{booking.venueName}</td>
                    <td className="px-4 py-3">{booking.date}</td>
                    <td className="px-4 py-3">{booking.startTime} - {booking.endTime}</td>
                    <td className="px-4 py-3">{booking.court}</td>
                    <td className="px-4 py-3">{booking.booker.name}</td>
                    <td className="px-4 py-3">{booking.booker.mobile}</td>
                    <td className="px-4 py-3">{formatCurrency(booking.amount)}</td>
                  </tr>
                ))}
                {!bookings.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-600">
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};

export default OwnerBookingsPage;
