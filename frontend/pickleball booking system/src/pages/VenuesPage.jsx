import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/common/Alert';
import PageHeader from '../components/common/PageHeader';
import { getVenueAvailability } from '../api/availabilityApi';
import { deleteVenue, getVenues, updateVenue } from '../api/venueApi';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, toDateInputValue } from '../utils/date';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const SLOT_TIMES = Array.from({ length: 17 }, (_, idx) => `${String(6 + idx).padStart(2, '0')}:00`);

const FALLBACK_THUMBNAIL =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0" y1="0" x2="1" y2="1"%3E%3Cstop offset="0" stop-color="%230b8a72"/%3E%3Cstop offset="1" stop-color="%2322c55e"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1200" height="800" fill="url(%23g)"/%3E%3Ccircle cx="980" cy="190" r="170" fill="%23ffffff22"/%3E%3Ccircle cx="180" cy="650" r="230" fill="%23ffffff1f"/%3E%3Ctext x="90" y="420" fill="white" font-size="80" font-family="Arial, sans-serif" font-weight="700"%3EPickleball Venue%3C/text%3E%3C/svg%3E';

const getEditStateFromVenue = (venue) => ({
  name: venue.name || '',
  address: venue.address || '',
  courts: venue.courts || 1,
  phone: venue.phone || '',
  email: venue.email || '',
  description: venue.description || '',
  photos: Array.isArray(venue.photos) ? venue.photos : [],
  thumbnailIndex: 0,
});

const resolveThumbnail = (venue) => {
  const photos = Array.isArray(venue?.photos) ? venue.photos : [];
  const first = photos.find((item) => typeof item === 'string' && item.trim());

  if (!first) return FALLBACK_THUMBNAIL;
  if (first.startsWith('http://') || first.startsWith('https://') || first.startsWith('data:')) return first;
  if (first.startsWith('/')) return `${API_BASE_URL}${first}`;
  return `${API_BASE_URL}/${first}`;
};

const normalizeTime = (value) => {
  if (!value || typeof value !== 'string') return '';
  const [rawH = '', rawM = '00'] = value.split(':');
  const h = String(Number(rawH)).padStart(2, '0');
  const m = String(Number(rawM)).padStart(2, '0');
  return `${h}:${m}`;
};

const formatTime12Hour = (value) => {
  const normalized = normalizeTime(value);
  if (!normalized) return '';

  const [hh, mm] = normalized.split(':').map(Number);
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${String(mm).padStart(2, '0')} ${suffix}`;
};

const VenuesPage = () => {
  const { token, role } = useAuth();
  const navigate = useNavigate();

  const [allVenues, setAllVenues] = useState([]);
  const [venues, setVenues] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [selectedTime, setSelectedTime] = useState('');

  const [editingVenueId, setEditingVenueId] = useState(null);
  const [editState, setEditState] = useState(null);
  const [updatingVenueId, setUpdatingVenueId] = useState(null);
  const [deletingVenueId, setDeletingVenueId] = useState(null);

  const isOwner = role === 'OWNER' || role === 'owner';
  const isBooker = role === 'BOOKER' || role === 'booker';

  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getVenues(token);
        const fetched = data.venues || [];
        setAllVenues(fetched);
        setVenues(fetched);
      } catch (apiError) {
        setError(apiError.message || 'Failed to fetch venues');
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [token]);

  const startEditVenue = (venue) => {
    setError('');
    setEditingVenueId(venue.id);
    setEditState(getEditStateFromVenue(venue));
  };

  const cancelEditVenue = () => {
    setEditingVenueId(null);
    setEditState(null);
  };

  const onEditFieldChange = (field, value) => {
    setEditState((current) => ({
      ...current,
      [field]: value
    }));
  };

  const onSaveVenue = async (venueId) => {
    if (!editState) return;

    setError('');
    setUpdatingVenueId(venueId);

    try {
      const payload = {
        name: editState.name.trim(),
        address: editState.address.trim(),
        courts: Number(editState.courts),
        phone: editState.phone.trim(),
        email: editState.email.trim(),
        description: editState.description.trim(),
        thumbnailIndex: Number(editState.thumbnailIndex || 0),
      };

      const data = await updateVenue({ venueId, payload, token });
      const updatedVenue = data.venue;

      setAllVenues((current) =>
        current.map((venue) => (venue.id === venueId ? { ...venue, ...updatedVenue } : venue))
      );
      setVenues((current) =>
        current.map((venue) => (venue.id === venueId ? { ...venue, ...updatedVenue } : venue))
      );

      setEditingVenueId(null);
      setEditState(null);
    } catch (apiError) {
      setError(apiError.message || 'Failed to update venue');
    } finally {
      setUpdatingVenueId(null);
    }
  };

  const onDeleteVenue = async (venueId, venueName) => {
    const confirmed = window.confirm(`Delete venue "${venueName}"?`);
    if (!confirmed) return;

    setError('');
    setDeletingVenueId(venueId);

    try {
      await deleteVenue({ venueId, token });
      setAllVenues((current) => current.filter((venue) => venue.id !== venueId));
      setVenues((current) => current.filter((venue) => venue.id !== venueId));

      if (editingVenueId === venueId) {
        setEditingVenueId(null);
        setEditState(null);
      }
    } catch (apiError) {
      setError(apiError.message || 'Failed to delete venue');
    } finally {
      setDeletingVenueId(null);
    }
  };

  const onFilterVenues = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Select both date and time slot before applying filters.');
      return;
    }

    setError('');
    setIsFiltering(true);

    try {
      const normalizedSelectedTime = normalizeTime(selectedTime);

      const checks = await Promise.all(
        allVenues.map(async (venue) => {
          try {
            const availability = await getVenueAvailability({
              venueId: venue.id,
              date: selectedDate,
              token
            });

            const slot = availability?.slots?.find(
              (entry) => normalizeTime(entry.start) === normalizedSelectedTime
            );

            const hasUsableCourt = slot?.cells?.some((cell) => cell.state === 'AVAILABLE');

            return {
              venue,
              matches: Boolean(hasUsableCourt),
              failed: false,
            };
          } catch {
            return {
              venue,
              matches: false,
              failed: true,
            };
          }
        })
      );

      const filtered = checks.filter((item) => item.matches).map((item) => item.venue);
      const failedCount = checks.filter((item) => item.failed).length;

      setVenues(filtered);
      setIsFiltered(true);
      if (failedCount > 0 && failedCount === allVenues.length) {
        setError('Could not check slot availability right now. Please try again.');
      } else if (failedCount > 0) {
        setError(`Some venues could not be checked for ${formatTime12Hour(normalizedSelectedTime)}.`);
      }
    } catch {
      setError('Could not apply filters right now.');
    } finally {
      setIsFiltering(false);
    }
  };

  const onClearFilters = () => {
    setSelectedDate(toDateInputValue());
    setSelectedTime('');
    setVenues(allVenues);
    setIsFiltered(false);
    setError('');
  };

  const onOpenVenue = (venueId) => {
    const query = selectedDate ? `?date=${selectedDate}` : '';
    navigate(`/venues/${venueId}/availability${query}`);
  };

  const onSelectThumbnail = (index) => {
    setEditState((current) => ({
      ...current,
      thumbnailIndex: index,
    }));
  };

  return (
    <section className="relative space-y-6 overflow-hidden">
      <div className="pointer-events-none absolute -top-12 -left-16 h-44 w-44 rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-8 h-44 w-44 rounded-full bg-cyan-100/60 blur-3xl" />

      <PageHeader
        title="Venues"
        subtitle={
          isBooker
            ? 'Marketplace of all venues. Filter by date and slot to find at least one available court.'
            : 'Manage your own venue cards and keep details updated for bookers.'
        }
      />

      {isOwner && (
        <div>
          <Link
            to="/owner/venues/create"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-700/25 transition hover:-translate-y-0.5 hover:from-emerald-800 hover:to-teal-600"
          >
            Add New Venue
          </Link>
        </div>
      )}

      {isBooker && (
        <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Date</span>
              <input
                type="date"
                value={selectedDate}
                min={toDateInputValue()}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Time Slot</span>
              <select
                value={selectedTime}
                onChange={(event) => setSelectedTime(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
              >
                <option value="">Select Time</option>
                {SLOT_TIMES.map((time) => (
                  <option key={time} value={time}>
                    {formatTime12Hour(time)}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={onFilterVenues}
              disabled={isFiltering}
              className="rounded-xl bg-gradient-to-r from-emerald-700 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 transition hover:from-emerald-800 hover:to-teal-600 disabled:opacity-60"
            >
              {isFiltering ? 'Filtering...' : 'Apply Filters'}
            </button>

            <button
              type="button"
              onClick={onClearFilters}
              disabled={!isFiltered && !selectedTime}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:opacity-60"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <Alert
        type="error"
        message={
          isBooker && isFiltered && !loading && venues.length === 0
            ? 'No venue available for selected date and time slot.'
            : error
        }
      />

      {loading ? (
        <div className="rounded-2xl border border-white/70 bg-white/75 p-8 text-slate-600 shadow-sm backdrop-blur">
          <p className="text-base font-semibold text-slate-700">Loading venues...</p>
          <p className="mt-1 text-sm text-slate-500">Preparing the latest venue inventory for you.</p>
        </div>
      ) : !venues.length ? (
        <div className="rounded-2xl border border-white/70 bg-white/80 p-8 text-slate-600 shadow-sm backdrop-blur">
          {isOwner ? 'No venues found for this owner account.' : 'No venues available for the selected filter.'}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {venues.map((venue) => (
            <article
              key={venue.id}
              className={`group relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-5 shadow-md shadow-slate-200/70 transition-all duration-300 ${isBooker ? 'cursor-pointer hover:-translate-y-1.5 hover:shadow-xl' : 'hover:shadow-xl'}`}
              onClick={() => isBooker && onOpenVenue(venue.id)}
              onKeyDown={(event) => {
                if (isBooker && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  onOpenVenue(venue.id);
                }
              }}
              role={isBooker ? 'button' : undefined}
              tabIndex={isBooker ? 0 : undefined}
            >
              <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-emerald-100/80 blur-xl transition group-hover:bg-cyan-100/80" />

              {isOwner && editingVenueId === venue.id && editState ? (
                <div className="relative z-10 space-y-3" onClick={(event) => event.stopPropagation()}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Editing Venue</p>
                  <input
                    type="text"
                    value={editState.name}
                    onChange={(event) => onEditFieldChange('name', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
                    placeholder="Venue Name"
                  />
                  <textarea
                    value={editState.address}
                    onChange={(event) => onEditFieldChange('address', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
                    rows={2}
                    placeholder="Address"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={1}
                      max={3}
                      value={editState.courts}
                      onChange={(event) => onEditFieldChange('courts', event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
                      placeholder="Courts"
                    />
                    <input
                      type="tel"
                      value={editState.phone}
                      onChange={(event) => onEditFieldChange('phone', event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
                      placeholder="Phone"
                    />
                  </div>
                  <input
                    type="email"
                    value={editState.email}
                    onChange={(event) => onEditFieldChange('email', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
                    placeholder="Email"
                  />
                  <textarea
                    value={editState.description}
                    onChange={(event) => onEditFieldChange('description', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
                    rows={3}
                    placeholder="Description"
                  />

                  {editState.photos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-600">
                        Choose Thumbnail
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {editState.photos.map((photoUrl, index) => (
                          <button
                            key={`${photoUrl}_${index}`}
                            type="button"
                            onClick={() => onSelectThumbnail(index)}
                            className={`overflow-hidden rounded-lg border-2 transition ${
                              Number(editState.thumbnailIndex) === index
                                ? 'border-emerald-500'
                                : 'border-transparent hover:border-slate-300'
                            }`}
                            title={index === 0 ? 'Current thumbnail' : 'Set as thumbnail'}
                          >
                            <img
                              src={photoUrl.startsWith('http') || photoUrl.startsWith('data:') ? photoUrl : `${API_BASE_URL}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`}
                              alt={`Venue photo ${index + 1}`}
                              className="h-16 w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">
                        First image is used as marketplace thumbnail. Select another image to change it.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={updatingVenueId === venue.id}
                      onClick={() => onSaveVenue(venue.id)}
                      className="inline-flex rounded-xl bg-gradient-to-r from-emerald-700 to-teal-500 px-3 py-2 text-xs font-semibold text-white transition hover:from-emerald-800 hover:to-teal-600 disabled:opacity-60"
                    >
                      {updatingVenueId === venue.id ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditVenue}
                      className="inline-flex rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={resolveThumbnail(venue)}
                    alt={`${venue.name} thumbnail`}
                    className="mb-4 h-36 w-full rounded-2xl object-cover"
                  />

                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-semibold text-ink-900">{venue.name}</h3>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-emerald-700">
                      {venue.courts} Courts
                    </span>
                  </div>

                  <p className="mt-2 min-h-[40px] text-sm text-slate-600">{venue.address}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      Weekday: {formatCurrency(venue.weekdayRate)}
                    </span>
                    <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      Weekend: {formatCurrency(venue.weekendRate)}
                    </span>
                  </div>

                  {isBooker ? (
                    <Link
                      to={`/venues/${venue.id}/availability${selectedDate ? `?date=${selectedDate}` : ''}`}
                      className="relative z-20 mt-5 inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-emerald-700 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-700/30 transition hover:-translate-y-0.5 hover:from-emerald-800 hover:to-teal-600"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Check Availability
                    </Link>
                  ) : (
                    <div className="relative z-20 mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditVenue(venue)}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        disabled={deletingVenueId === venue.id}
                        onClick={() => onDeleteVenue(venue.id, venue.name)}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                      >
                        {deletingVenueId === venue.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default VenuesPage;
