import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/common/Alert';
import PageHeader from '../components/common/PageHeader';
import { checkout } from '../api/bookingApi';
import { getMyCart, removeCartItem } from '../api/cartApi';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils/date';

const CartPage = () => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const loadCart = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getMyCart(token);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (apiError) {
      setError(apiError.message || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [token]);

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  const removeItem = async (id) => {
    setError('');
    setMessage('');

    try {
      await removeCartItem({ id, token });
      await loadCart();
    } catch (apiError) {
      setError(apiError.message || 'Failed to remove item');
    }
  };

  const submitCheckout = async () => {
    if (!itemIds.length) return;

    setCheckoutLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await checkout({ cartItemIds: itemIds, token });
      setMessage(`${data.bookings.length} booking(s) created successfully.`);
      await loadCart();
    } catch (apiError) {
      setError(apiError.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Cart" subtitle="These slots are held temporarily. Complete checkout before expiration." />

      <Alert type="success" message={message} />
      <Alert type="error" message={error} />

      {loading ? (
        <p className="text-slate-600">Loading cart...</p>
      ) : !items.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-700">Cart is empty.</p>
          <Link to="/venues" className="mt-3 inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            Browse Venues
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Court</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{item.date}</td>
                    <td className="px-4 py-3">{item.startTime} - {item.endTime}</td>
                    <td className="px-4 py-3">{item.court}</td>
                    <td className="px-4 py-3">{formatCurrency(item.price)}</td>
                    <td className="px-4 py-3">{new Date(item.expiresAt).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-lg font-semibold text-ink-900">Total: {formatCurrency(total)}</p>
            <button
              type="button"
              onClick={submitCheckout}
              disabled={checkoutLoading}
              className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkoutLoading ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default CartPage;
