import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="grid min-h-[60vh] place-items-center">
    <div className="text-center">
      <h1 className="font-display text-4xl font-bold text-ink-900">404</h1>
      <p className="mt-2 text-slate-600">The page you requested does not exist.</p>
      <Link to="/venues" className="mt-5 inline-flex rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
        Back to Venues
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
