import { getMissingEnvKeys } from "../utils/env";

export const EnvErrorScreen = () => {
  const missing = getMissingEnvKeys();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 px-6">
      <div className="max-w-lg text-center bg-white/90 rounded-2xl shadow-xl p-8 border border-rose-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Missing environment variables
        </h1>
        <p className="text-gray-600 mb-4">
          The app cannot start because required Vite variables are missing.
        </p>
        <div className="bg-rose-50 text-rose-700 rounded-lg px-4 py-3 text-left text-sm">
          {missing.length ? (
            <ul>
              {missing.map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          ) : (
            <div>VITE_API_URL</div>
          )}
        </div>
      </div>
    </div>
  );
};
