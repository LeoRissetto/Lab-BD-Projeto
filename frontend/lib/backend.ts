export function getBackendBaseUrl() {
  const url = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!url) {
    throw new Error(
      "BACKEND_URL ou NEXT_PUBLIC_BACKEND_URL deve estar definido.",
    );
  }

  return url.replace(/\/+$/, "");
}
