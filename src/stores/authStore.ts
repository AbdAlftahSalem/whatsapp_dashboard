import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  adminName: string | null;
  login: (token: string, name: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      adminName: null,
      login: (token: string, name: string) => 
        set({ isAuthenticated: true, accessToken: token, adminName: name }),
      logout: () => 
        set({ isAuthenticated: false, accessToken: null, adminName: null }),
    }),
    {
      name: 'wa-dashboard-auth',
    }
  )
);
