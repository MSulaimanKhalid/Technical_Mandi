import axios from 'axios';

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';


const ACCESS_TOKEN_KEY = 'technical_mandi_access_token';
const REFRESH_TOKEN_KEY = 'technical_mandi_refresh_token';

let accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
let refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);


export function setAccessToken(token) {
  accessToken = token || null;

  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function getAccessToken() {
  return accessToken;
}

export function setRefreshToken(token) {
  refreshToken = token || null;

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function getRefreshToken() {
  return refreshToken;
}

export function setAuthTokens({ access, refresh = null }) {
  setAccessToken(access);
  setRefreshToken(refresh);
}

export function clearAuthTokens() {
  setAccessToken(null);
  setRefreshToken(null);
}


export function readAccessToken(payload) {
  return (
    payload?.access ||
    payload?.access_token ||
    payload?.token ||
    null
  );
}

export function readRefreshToken(payload) {
  return (
    payload?.refresh ||
    payload?.refresh_token ||
    payload?.refreshToken ||
    null
  );
}



function collectMessages(value, fieldName = '') {
  if (typeof value === 'string') {
    const message = value.trim();

    if (!message) {
      return [];
    }

    return fieldName
      ? [`${fieldName}: ${message}`]
      : [message];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      collectMessages(item, fieldName),
    );
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, nestedValue]) => {
      const generalKeys = [
        'detail',
        'message',
        'error',
        'non_field_errors',
      ];

      const readableField = generalKeys.includes(key)
        ? ''
        : key
            .replaceAll('_', ' ')
            .replace(/^./, (character) => character.toUpperCase());

      return collectMessages(nestedValue, readableField);
    });
  }

  return [];
}

function looksLikeHtml(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim().toLowerCase();

  return (
    normalized.startsWith('<!doctype html') ||
    normalized.startsWith('<html') ||
    normalized.includes('<body')
  );
}

export function getApiErrorMessages(
  error,
  fallback = 'Something went wrong. Please try again.',
) {
  const response = error?.response;

  if (!response) {
    return [
      'Unable to connect to the server. Check your internet connection and try again.',
    ];
  }

  const { status, data } = response;

  if (looksLikeHtml(data)) {
    if (status === 404) {
      return [
        'This service is not available at the configured address. Please contact support.',
      ];
    }

    return [
      'The server returned an unexpected response. Please try again later.',
    ];
  }

  const messages = [
    ...new Set(collectMessages(data)),
  ].filter(Boolean);

  if (messages.length > 0) {
    return messages;
  }

  if (status === 400) {
    return ['Please review the submitted information and try again.'];
  }

  if (status === 401) {
    return ['Your session or credentials are no longer valid.'];
  }

  if (status === 403) {
    return ['You do not have permission to perform this action.'];
  }

  if (status === 404) {
    return ['The requested service or record could not be found.'];
  }

  if (status === 415) {
    return ['The server could not read the submitted data format.'];
  }

  if (status === 429) {
    return ['Too many attempts were made. Please wait and try again.'];
  }

  if (status >= 500) {
    return [
      'The server is having trouble completing this request. Please try again later.',
    ];
  }

  return [fallback];
}

export function getApiErrorMessage(error, fallback) {
  return getApiErrorMessages(error, fallback).join(' ');
}



export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});


const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

let pendingCount = 0;
const loadingListeners = new Set();

function notifyLoadingListeners() {
  loadingListeners.forEach((listener) => {
    listener(pendingCount);
  });
}

export function subscribeToLoading(listener) {
  loadingListeners.add(listener);

  return () => {
    loadingListeners.delete(listener);
  };
}

function getRefreshEndpointCandidates() {
  const configuredEndpoint =
    import.meta.env.VITE_REFRESH_ENDPOINT;

  const candidates = [
    configuredEndpoint,
    '/accounts/token/refresh/',
    '/accounts/refresh/',
    '/token/refresh/',
  ];

  return candidates.filter(
    (endpoint, index, array) =>
      Boolean(endpoint) &&
      array.indexOf(endpoint) === index,
  );
}


let refreshPromise = null;

async function requestNewAccessToken(expiredAccessToken) {
  const storedRefreshToken = getRefreshToken();


  const requestBody = storedRefreshToken
    ? { refresh: storedRefreshToken }
    : {};

  let lastNotFoundError = null;

  for (const endpoint of getRefreshEndpointCandidates()) {
    try {
      const response = await refreshClient.post(
        endpoint,
        requestBody,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      const replacementAccessToken =
        readAccessToken(response.data);

      if (!replacementAccessToken) {
        throw new Error(
          'The token refresh response did not contain a new access token.',
        );
      }


      const currentlyActiveToken = getAccessToken();

      if (
        currentlyActiveToken &&
        currentlyActiveToken !== expiredAccessToken
      ) {
        return currentlyActiveToken;
      }

      if (!currentlyActiveToken) {
        throw new Error(
          'The authentication session changed while the token was refreshing.',
        );
      }

      setAccessToken(replacementAccessToken);


      const rotatedRefreshToken =
        readRefreshToken(response.data);

      if (rotatedRefreshToken) {
        setRefreshToken(rotatedRefreshToken);
      }

      return replacementAccessToken;
    } catch (error) {

      if (error.response?.status === 404) {
        lastNotFoundError = error;
        continue;
      }

      throw error;
    }
  }

  throw (
    lastNotFoundError ||
    new Error('No JWT refresh endpoint is configured.')
  );
}

function refreshAccessToken(expiredAccessToken) {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken(
      expiredAccessToken,
    ).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function expireCurrentSession() {
  clearAuthTokens();

  window.dispatchEvent(
    new CustomEvent('technical-mandi:unauthorized'),
  );
}


api.interceptors.request.use(
  (config) => {
    pendingCount += 1;
    notifyLoadingListeners();

    const tokenUsedByRequest = getAccessToken();


    config.__technicalMandiAccessToken =
      tokenUsedByRequest;

    if (tokenUsedByRequest) {
      config.headers = config.headers || {};

      config.headers.Authorization =
        `Bearer ${tokenUsedByRequest}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);



api.interceptors.response.use(
  (response) => {
    pendingCount = Math.max(
      0,
      pendingCount - 1,
    );

    notifyLoadingListeners();

    return response;
  },

  async (error) => {
    pendingCount = Math.max(
      0,
      pendingCount - 1,
    );

    notifyLoadingListeners();

    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || '';


    const isLoginRequest =
      requestUrl.includes('/accounts/login/');

    const isSignupRequest =
      requestUrl.includes('/accounts/signup/');


    const isLogoutRequest =
      requestUrl.includes('/accounts/logout/');

    const isAuthenticationRequest =
      isLoginRequest ||
      isSignupRequest ||
      isLogoutRequest;

    if (
      status !== 401 ||
      !originalRequest ||
      isAuthenticationRequest
    ) {
      return Promise.reject(error);
    }

    const tokenUsedByRequest =
      originalRequest.__technicalMandiAccessToken ||
      null;

    const currentlyActiveToken =
      getAccessToken();


    if (
      tokenUsedByRequest &&
      currentlyActiveToken &&
      tokenUsedByRequest !== currentlyActiveToken
    ) {
      if (
        originalRequest
          .__technicalMandiRetriedWithCurrentToken
      ) {
        return Promise.reject(error);
      }

      originalRequest
        .__technicalMandiRetriedWithCurrentToken = true;

      originalRequest
        .__technicalMandiAccessToken =
        currentlyActiveToken;

      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${currentlyActiveToken}`;

      return api(originalRequest);
    }


    if (
      !tokenUsedByRequest ||
      !currentlyActiveToken
    ) {
      return Promise.reject(error);
    }


    if (
      originalRequest
        .__technicalMandiRetriedAfterRefresh
    ) {
      expireCurrentSession();

      return Promise.reject(error);
    }

    try {
      const replacementAccessToken =
        await refreshAccessToken(
          tokenUsedByRequest,
        );

      originalRequest
        .__technicalMandiRetriedAfterRefresh = true;

      originalRequest
        .__technicalMandiAccessToken =
        replacementAccessToken;

      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${replacementAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      const refreshStatus =
        refreshError.response?.status;

      const terminalRefreshFailure =
        !refreshError.response ||
        refreshStatus === 400 ||
        refreshStatus === 401 ||
        refreshStatus === 403 ||
        refreshStatus === 404 ||
        refreshStatus === 415;

      if (terminalRefreshFailure) {
        expireCurrentSession();
      }

      return Promise.reject(refreshError);
    }
  },
);

export default api;


export const ENDPOINTS = {
  // --- accounts app ---
  signup: '/accounts/signup/',
  login: '/accounts/login/',
  logout: '/accounts/logout/',
  profile: '/accounts/profile/',


  refresh:
    import.meta.env.VITE_REFRESH_ENDPOINT ||
    '/accounts/token/refresh/',

  // --- store app ---
  categories: '/store/categories/',
  products: '/store/products/',
  productDetail: (id) =>
    `/store/products/${id}/`,

  cart: '/store/cart/',
  cartAdd: '/store/cart/add/',
  cartUpdate: (productId) =>
    `/store/cart/update/${productId}/`,
  cartRemove: (productId) =>
    `/store/cart/remove/${productId}/`,
  cartClear: '/store/cart/clear/',

  checkout: '/store/checkout/',

  orders: '/store/orders/',
  orderDetail: (id) =>
    `/store/orders/${id}/`,
};