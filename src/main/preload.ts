import { contextBridge, ipcRenderer } from 'electron';

// Define the electronAPI object with the methods expected by the renderer
export const electronAPI = {
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSetting: (payload: { key: string; value: string }) =>
    ipcRenderer.invoke('settings:set', payload.key, payload.value),
  // Sessions
  getSessions: () => ipcRenderer.invoke('sessions:history'),
  // Customers
  getCustomers: () => ipcRenderer.invoke('customers:list'),
};

// Utility functions safe to use in the renderer
export const utils = {
  formatDate: (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Format as MM/DD/YYYY
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      // Fallback to original string if parsing fails
      return dateString;
    }
  }
};

// Expose the electronAPI to the renderer via window.api for compatibility
// with any code that might use window.api directly.
contextBridge.exposeInMainWorld('api', electronAPI);