const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const getAppConfig = () => {
  if (typeof window === 'undefined') {
    return {
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
      appName: 'Forandringsteori Studio'
    };
  }

  return {
    apiBaseUrl:
      window.__APP_CONFIG__?.apiBaseUrl?.trim() || import.meta.env.VITE_API_BASE_URL?.trim() || '',
    appName: window.__APP_CONFIG__?.appName || 'Forandringsteori Studio'
  };
};

export const getApiBaseUrl = () => trimTrailingSlash(getAppConfig().apiBaseUrl || '');

export const resolveApiUrl = (pathname) => {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return pathname;
  }

  return `${baseUrl}${pathname}`;
};
