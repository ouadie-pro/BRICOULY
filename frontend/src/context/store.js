import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  isAuthenticated: false,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setLoading: (loading) => set({ loading }),
  
  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),
  
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },
  
  initialize: () => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          set({ user: parsedUser, isAuthenticated: true });
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    set({ loading: false });
  }
}));

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  
  setNotifications: (notifications) => set({ notifications }),
  
  setUnreadCount: (count) => set({ unreadCount: count }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),
  
  clearUnread: () => set({ unreadCount: 0 })
}));

export default useAuthStore;