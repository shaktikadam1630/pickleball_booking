import { apiRequest } from './client';

export const checkout = ({ cartItemIds, token }) => apiRequest('/booking/checkout', {
  method: 'POST',
  token,
  body: { cartItemIds }
});

export const getMyBookings = (token) => apiRequest('/booking/me', { token });

export const rescheduleBooking = ({ bookingId, date, startTime, token }) => apiRequest(
  `/booking/${bookingId}/reschedule`,
  {
    method: 'PATCH',
    token,
    body: { date, startTime }
  }
);

export const getOwnerBookings = ({ token, date }) => {
  const query = date ? `?date=${date}` : '';
  return apiRequest(`/booking/owner${query}`, { token });
};
