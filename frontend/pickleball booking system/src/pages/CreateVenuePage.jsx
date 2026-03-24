import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/common/Alert';
import PageHeader from '../components/common/PageHeader';
import { createVenue } from '../api/venueApi';
import { useAuth } from '../hooks/useAuth';

const initialState = {
  name: '',
  address: '',
  courts: 1,
  phone: '',
  email: '',
  description: ''
};

const CreateVenuePage = () => {
  const { token } = useAuth();

  const [formState, setFormState] = useState(initialState);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [createdPhotoUrls, setCreatedPhotoUrls] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const previews = photos.map((file) => ({
      key: `${file.name}_${file.size}_${file.lastModified}`,
      name: file.name,
      url: URL.createObjectURL(file)
    }));

    setPhotoPreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [photos]);

  const onChangeField = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const onChangePhotos = (event) => {
    const selected = Array.from(event.target.files || []);
    setPhotos(selected.slice(0, 5));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setCreatedPhotoUrls([]);

    try {
      const payload = new FormData();
      payload.append('name', formState.name.trim());
      payload.append('address', formState.address.trim());
      payload.append('courts', String(formState.courts));
      payload.append('phone', formState.phone.trim());
      payload.append('email', formState.email.trim());
      payload.append('description', formState.description.trim());

      photos.forEach((photo) => {
        payload.append('photos', photo);
      });

      const data = await createVenue({ formData: payload, token });
      setMessage('Venue created successfully.');
      setCreatedPhotoUrls(data.photos || []);
      setFormState(initialState);
      setPhotos([]);
    } catch (apiError) {
      setError(apiError.message || 'Failed to create venue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader
        title="Create Venue"
        subtitle="Add your venue inventory with contact details and upload up to 5 photos."
      />

      <Alert type="success" message={message} />
      <Alert type="error" message={error} />

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Venue Name</span>
          <input
            type="text"
            required
            value={formState.name}
            onChange={(event) => onChangeField('name', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Address</span>
          <textarea
            required
            value={formState.address}
            onChange={(event) => onChangeField('address', event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Courts (1-3)</span>
          <input
            type="number"
            min={1}
            max={3}
            required
            value={formState.courts}
            onChange={(event) => onChangeField('courts', Number(event.target.value))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Phone</span>
          <input
            type="tel"
            required
            value={formState.phone}
            onChange={(event) => onChangeField('phone', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            required
            value={formState.email}
            onChange={(event) => onChangeField('email', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
          <textarea
            required
            value={formState.description}
            onChange={(event) => onChangeField('description', event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Venue Photos (max 5)</span>
          <p className="mb-2 text-xs text-slate-500">The first uploaded photo will be used as the venue thumbnail.</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onChangePhotos}
            className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-600"
          />
        </label>

        {!!photoPreviews.length && (
          <div className="grid grid-cols-2 gap-3 sm:col-span-2 md:grid-cols-5">
            {photoPreviews.map((preview) => (
              <img
                key={preview.key}
                src={preview.url}
                alt={preview.name}
                className="h-24 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        {!!createdPhotoUrls.length && (
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold text-slate-700">Uploaded paths:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              {createdPhotoUrls.map((path) => (
                <li key={path}>{path}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create Venue'}
        </button>

        <Link
          to="/venues"
          className="sm:col-span-2 inline-flex justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
        >
          Back to Venues
        </Link>
      </form>
    </section>
  );
};

export default CreateVenuePage;
