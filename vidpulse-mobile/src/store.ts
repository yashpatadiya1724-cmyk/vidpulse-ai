import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User { id: string; email: string; name: string; plan: string; }

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, token: null,
  setAuth: (user, token) => {
    AsyncStorage.setItem("token", token).catch(() => {});
    AsyncStorage.setItem("user", JSON.stringify(user)).catch(() => {});
    set({ user, token });
  },
  logout: () => {
    AsyncStorage.multiRemove(["token", "user"]).catch(() => {});
    set({ user: null, token: null });
  },
  hydrate: async () => {
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem("token"),
        AsyncStorage.getItem("user"),
      ]);
      if (token && userStr) set({ token, user: JSON.parse(userStr) });
    } catch {}
  },
}));
