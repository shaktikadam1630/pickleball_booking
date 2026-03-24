import { apiRequest } from './client';

export const getVenueAvailability = ({ venueId, date, token }) => apiRequest(
  `/availability/venues/${venueId}?date=${date}`,
  { token }
);
