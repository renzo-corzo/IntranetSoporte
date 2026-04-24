const rawBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const API_BASE_URL = (rawBaseUrl && rawBaseUrl.length > 0 ? rawBaseUrl : "/api").replace(/\/+$/, "");

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const API_ORIGIN = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL;
