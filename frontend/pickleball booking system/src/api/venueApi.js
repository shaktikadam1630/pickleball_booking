import { apiRequest } from './client';

export const getVenues = (token) => apiRequest('/venues', { token });

export const getVenueById = (venueId, token) => apiRequest(`/venues/${venueId}`, { token });

export const createVenue = ({ formData, token }) =>
	apiRequest('/venues', {
		method: 'POST',
		token,
		body: formData,
		isFormData: true
	});

export const updateVenue = ({ venueId, payload, token }) =>
	apiRequest(`/venues/${venueId}`, {
		method: 'PUT',
		token,
		body: payload
	});

export const deleteVenue = ({ venueId, token }) =>
	apiRequest(`/venues/${venueId}`, {
		method: 'DELETE',
		token
	});
