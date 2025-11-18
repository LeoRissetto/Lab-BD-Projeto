import { ApiUser } from "@/lib/api";

export function readUserFromStorage(): ApiUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("lt_user");
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch {
    return null;
  }
}

export function writeUserToStorage(user: ApiUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem("lt_user");
    return;
  }
  window.localStorage.setItem("lt_user", JSON.stringify(user));
}
