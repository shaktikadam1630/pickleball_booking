import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getMyProfile, loginUser, logoutUser, registerUser } from '../api/authApi';

const TOKEN_KEY = 'pbs_token';

export const AuthContext = createContext(null);

const decodeTokenPayload = (token) => {
  if (!token || typeof token !== 'string') return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const isExpiredPayload = (payload) => {
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 <= Date.now();
};

const parseJwt = (token) => {
  const payload = decodeTokenPayload(token);
  if (!payload || isExpiredPayload(payload)) {
    return null;
  }

  return payload;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem(TOKEN_KEY) || '';
    return parseJwt(saved) ? saved : '';
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(TOKEN_KEY) || '';
    return parseJwt(saved);
  });

  const refreshProfile = useCallback(async (providedToken) => {
    const activeToken = providedToken || token;
    if (!activeToken) return null;

    const data = await getMyProfile(activeToken);
    if (data?.user) {
      setUser(data.user);
      return data.user;
    }

    return null;
  }, [token]);

  const updateSession = useCallback(({ token: nextToken, user: nextUser }) => {
    if (nextToken) {
      setToken(nextToken);
    }

    if (nextUser) {
      setUser(nextUser);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      return;
    }

    const parsedUser = parseJwt(token);

    if (!parsedUser) {
      localStorage.removeItem(TOKEN_KEY);
      setToken('');
      setUser(null);
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
    setUser((current) => current || parsedUser);
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const syncUserProfile = async () => {
      try {
        const latestUser = await refreshProfile(token);
        if (!isMounted && latestUser) {
          return;
        }
      } 
      catch { }
    };

    syncUserProfile();

    return () => {
      isMounted = false;
    };
  }, [token, refreshProfile]);

  useEffect(() => {
    const payload = decodeTokenPayload(token);
    if (!payload || typeof payload.exp !== 'number') return undefined;

    const expiresInMs = payload.exp * 1000 - Date.now();
    if (expiresInMs <= 0) {
      setToken('');
      setUser(null);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToken('');
      setUser(null);
    }, expiresInMs);

    return () => window.clearTimeout(timeoutId);
  }, [token]);

  useEffect(() => {
    const onUnauthorized = () => {
      setToken('');
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    setToken(data.token);
    if (data?.user) {
      setUser(data.user);
    }
    return data;
  };

  const register = (payload) => registerUser(payload);

  const logout = async () => {
    try {
      if (token) {
        await logoutUser(token);
      }
    } catch {
  
    } finally {
      setToken('');
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      role: user?.role || null,
      login,
      register,
      logout,
      refreshProfile,
      updateSession,
    }),
    [token, user, refreshProfile, updateSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
