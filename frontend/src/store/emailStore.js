import { create } from 'zustand';

export const useEmailStore = create((set) => ({
  emails: [],
  selectedEmail: null,
  loading: false,
  filter: 'all',

  setEmails: (emails) => set({ emails }),
  setSelectedEmail: (email) => set({ selectedEmail: email }),
  setLoading: (loading) => set({ loading }),
  setFilter: (filter) => set({ filter }),
  addEmail: (email) => set((state) => ({ 
    emails: [email, ...state.emails] 
  })),
  clearEmails: () => set({ emails: [], selectedEmail: null }),
}));