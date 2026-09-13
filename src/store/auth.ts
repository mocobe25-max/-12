import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: any | null;
  role: 'admin' | 'agent' | null;
  setUser: (user: any, role: 'admin' | 'agent') => void;
  updateUser: (partial: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      setUser: (user, role) => set({ user, role }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
      logout: () => set({ user: null, role: null }),
    }),
    {
      name: 'mobcash_auth_session',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

