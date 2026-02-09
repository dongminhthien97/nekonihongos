type EnvKey = "VITE_API_URL";

const DEV_FALLBACK_API_URL = "http://localhost:8080/api";

const missingKeys: EnvKey[] = [];

const resolveApiUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (configuredUrl && configuredUrl.trim().length > 0) {
    return configuredUrl;
  }

  if (import.meta.env.DEV) {
    return DEV_FALLBACK_API_URL;
  }

  missingKeys.push("VITE_API_URL");
  return "";
};

export const env = {
  apiUrl: resolveApiUrl(),
};

export const isEnvValid = (): boolean => missingKeys.length === 0;

export const getMissingEnvKeys = (): EnvKey[] => [...new Set(missingKeys)];
