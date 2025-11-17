import axios from "axios";

const rawBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:8000";

const baseURL = rawBaseUrl.replace(/\/+$/, "");

export type ApiUser = {
  userid: number;
  login: string;
  tipo: string;
};

export const api = axios.create({
  baseURL,
});

export function getApiErrorMessage(error: unknown, fallback = "Erro inesperado") {
  if (axios.isAxiosError(error)) {
    const detail =
      error.response?.data?.detail ?? error.response?.data?.message ?? error.message;
    return typeof detail === "string" ? detail : fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
