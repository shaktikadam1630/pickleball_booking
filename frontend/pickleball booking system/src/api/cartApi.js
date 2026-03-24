import { apiRequest } from './client';

export const addToCart = ({ venueId, items, token }) => apiRequest('/cart/items', {
  method: 'POST',
  token,
  body: { venueId, items }
});

export const getMyCart = (token) => apiRequest('/cart/me', { token });

export const removeCartItem = ({ id, token }) => apiRequest(`/cart/items/${id}`, {
  method: 'DELETE',
  token
});
