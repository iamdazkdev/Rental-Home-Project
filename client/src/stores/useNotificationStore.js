import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
  // Toast state
  toast: {
    isOpen: false,
    message: '',
    severity: 'info', // 'success' | 'error' | 'warning' | 'info'
  },

  // Confirm dialog state
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  },

  // Actions
  showToast: (message, severity = 'info') => set({
    toast: { isOpen: true, message, severity }
  }),
  
  hideToast: () => set((state) => ({
    toast: { ...state.toast, isOpen: false }
  })),

  showConfirm: ({ title, message, onConfirm, onCancel }) => set({
    confirmDialog: { isOpen: true, title, message, onConfirm, onCancel }
  }),

  hideConfirm: () => set((state) => ({
    confirmDialog: { ...state.confirmDialog, isOpen: false }
  }))
}));

// Helper functions that can be used anywhere (even outside React components)
export const toast = {
  success: (msg) => useNotificationStore.getState().showToast(msg, 'success'),
  error: (msg) => useNotificationStore.getState().showToast(msg, 'error'),
  warning: (msg) => useNotificationStore.getState().showToast(msg, 'warning'),
  info: (msg) => useNotificationStore.getState().showToast(msg, 'info'),
};

export const confirmDialog = ({ title = "Confirm Action", message }) => {
  return new Promise((resolve) => {
    useNotificationStore.getState().showConfirm({
      title,
      message,
      onConfirm: () => {
        useNotificationStore.getState().hideConfirm();
        resolve(true);
      },
      onCancel: () => {
        useNotificationStore.getState().hideConfirm();
        resolve(false);
      }
    });
  });
};

export default useNotificationStore;
