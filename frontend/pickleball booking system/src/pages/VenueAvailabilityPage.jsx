import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Alert from '../components/common/Alert';
import PageHeader from '../components/common/PageHeader';
import { getVenueAvailability } from '../api/availabilityApi';
import { addToCart } from '../api/cartApi';
import { getVenueById } from '../api/venueApi';
import { useAuth } from '../hooks/useAuth';
import { toDateInputValue } from '../utils/date';

const formatTime12Hour = (value) => {
  if (!value || typeof value !== 'string') return value;
  const [hhText = '0', mmText = '00'] = value.split(':');
  const hh = Number(hhText);
  const mm = Number(mmText);
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${String(mm).padStart(2, '0')} ${suffix}`;
};

const VenueAvailabilityPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const queryDate = searchParams.get('date');
  const [date, setDate] = useState(queryDate || toDateInputValue());
  const [venue, setVenue] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const [venueRes, availabilityRes] = await Promise.all([
          getVenueById(id, token),
          getVenueAvailability({ venueId: id, date, token })
        ]);

        setVenue(venueRes.venue);
        setAvailability(availabilityRes);
        setSelected([]);
      } catch (apiError) {
        setError(apiError.message || 'Failed to fetch availability');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, date, token]);

  const selectedCount = selected.length;

  const selectedItems = useMemo(
    () =>
      selected.map((item) => ({
        date,
        court: item.court,
        startTime: item.start
      })),
    [date, selected]
  );

  const toggleSelection = (slot) => {
    const key = `${slot.court}_${slot.start}`;
    setSelected((current) => {
      if (current.find((item) => `${item.court}_${item.start}` === key)) {
        return current.filter((item) => `${item.court}_${item.start}` !== key);
      }

      return [...current, slot];
    });
  };

  const submitToCart = async () => {
    if (!selectedItems.length) return;

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const data = await addToCart({
        venueId: Number(id),
        items: selectedItems,
        token
      });

      setMessage(`${data.items.length} slot(s) added to cart. Hold expires at ${new Date(data.expiresAt).toLocaleTimeString()}.`);
      setSelected([]);
    } catch (apiError) {
      setError(apiError.message || 'Failed to add to cart');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader
        title={venue ? `${venue.name} Availability` : 'Venue Availability'}
        subtitle="Choose a date, select available court slots, and push them to your cart."
      />

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-md shadow-slate-200/60">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none ring-brand-500 transition focus:border-brand-400 focus:bg-white focus:ring-2"
          />
        </label>

        <button
          type="button"
          onClick={submitToCart}
          disabled={!selectedCount || submitting}
          className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:-translate-y-0.5 hover:from-brand-700 hover:to-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Adding...' : `Add ${selectedCount || ''} to Cart`}
        </button>

        <Link to="/cart" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm">
          Go to Cart
        </Link>
      </div>

      <Alert type="success" message={message} />
      <Alert type="error" message={error} />

      {loading ? (
        <div className="rounded-2xl border border-white/70 bg-white/85 p-6 text-slate-600 shadow-sm">Loading slots...</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-md shadow-slate-200/60">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Time</th>
                  {(availability?.courts || []).map((court) => (
                    <th key={court} className="px-4 py-3 text-center font-semibold">
                      Court {court}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(availability?.slots || []).map((slotRow) => (
                  <tr key={slotRow.start} className="border-t border-slate-100">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-900">
                      {formatTime12Hour(slotRow.start)} - {formatTime12Hour(slotRow.end)}
                    </td>
                    {slotRow.cells.map((cell) => {
                      const state = cell.state;
                      const selectable = state === 'AVAILABLE';
                      const selectedItem = selected.find(
                        (item) => item.court === cell.court && item.start === slotRow.start
                      );

                      return (
                        <td key={`${slotRow.start}_${cell.court}`} className="px-3 py-2 text-center">
                          <button
                            type="button"
                            disabled={!selectable}
                            onClick={() =>
                              toggleSelection({
                                court: cell.court,
                                start: slotRow.start
                              })
                            }
                            className={`w-full rounded-lg px-2 py-2 text-xs font-semibold transition ${
                              selectedItem
                                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow shadow-brand-500/25'
                                : state === 'AVAILABLE'
                                  ? 'border border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : state === 'IN_CART_MINE'
                                    ? 'border border-amber-200 bg-amber-100 text-amber-800'
                                    : 'border border-slate-200 bg-slate-100 text-slate-500'
                            }`}
                          >
                            {state}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default VenueAvailabilityPage;
