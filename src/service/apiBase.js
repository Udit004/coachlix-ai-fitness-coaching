const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const trimLeadingSlash = (value) => String(value || '').replace(/^\/+/, '');
const API_PREFIX = '/api/v1';

const normalizeApiBaseUrl = (rawValue) => {
  const value = trimTrailingSlash(rawValue);

  if (!value) {
    return `http://localhost:8080${API_PREFIX}`;
  }

  const normalized = value.replace(/\/api\/v1$/i, '');
  return `${normalized}${API_PREFIX}`;
};

export const API_BASE_URL = (() => {
  return normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      ''
  );
})();

export const buildApiUrl = (path = '') => {
  const normalizedPath = trimLeadingSlash(path);
  return normalizedPath ? `${API_BASE_URL}/${normalizedPath}` : API_BASE_URL;
};
