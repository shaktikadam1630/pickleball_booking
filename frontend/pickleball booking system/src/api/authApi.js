import { apiRequest } from './client';

export const registerUser = (payload) => apiRequest('/auth/register', {
  method: 'POST',
  body: payload
});

export const loginUser = (payload) => apiRequest('/auth/login', {
  method: 'POST',
  body: payload
});

export const logoutUser = (token) => apiRequest('/auth/logout', {
  method: 'POST',
  token
});

export const getMyProfile = (token) => apiRequest('/auth/me', {
  method: 'GET',
  token
});

export const updateMyProfile = ({ payload, token }) => apiRequest('/auth/me', {
  method: 'PUT',
  token,
  body: payload
});

export const changePassword = ({ payload, token }) => apiRequest('/auth/change-password', {
  method: 'PUT',
  token,
  body: payload
});
