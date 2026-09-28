import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  userId: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setUserId: (userId) => set({ userId }),
  logout: () => set({ user: null, userId: null, isAuthenticated: false }),
}));
