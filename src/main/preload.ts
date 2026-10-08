import { contextBridge, ipcRenderer } from 'electron';
import type { Api } from '../shared/types';

// The full, nested API surface the renderer expects (see src/shared/types.ts).
// Every method is a thin, context-isolated bridge to an ipcMain handler.
const api: Api = {
  customers: {
    list: () => ipcRenderer.invoke('customers:list'),
    create: (data) => ipcRenderer.invoke('customers:create', data),
    update: (data) => ipcRenderer.invoke('customers:update', data),
    remove: (id) => ipcRenderer.invoke('customers:remove', id),
    details: (id) => ipcRenderer.invoke('customers:details', id),
    addNote: (data) => ipcRenderer.invoke('customers:addNote', data),
    deleteNote: (id) => ipcRenderer.invoke('customers:deleteNote', id),
    clearDebt: (noteId) => ipcRenderer.invoke('customers:clearDebt', noteId),
  },
  sessions: {
    active: () => ipcRenderer.invoke('sessions:active'),
    history: (limit?: number) => ipcRenderer.invoke('sessions:history', limit),
    checkIn: (data) => ipcRenderer.invoke('sessions:checkIn', data),
    checkout: (data) => ipcRenderer.invoke('sessions:checkout', data),
  },
  subscriptions: {
    list: () => ipcRenderer.invoke('subs:list'),
    create: (data) => ipcRenderer.invoke('subs:create', data),
    deactivate: (id) => ipcRenderer.invoke('subs:deactivate', id),
  },
  products: {
    list: () => ipcRenderer.invoke('products:list'),
    create: (data) => ipcRenderer.invoke('products:create', data),
    update: (data) => ipcRenderer.invoke('products:update', data),
    restock: (id, qty) => ipcRenderer.invoke('products:restock', id, qty),
    remove: (id) => ipcRenderer.invoke('products:remove', id),
  },
  rooms: {
    list: () => ipcRenderer.invoke('rooms:list'),
    updateRate: (id, rate) => ipcRenderer.invoke('rooms:updateRate', id, rate),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  },
  reports: {
    summary: (from, to) => ipcRenderer.invoke('reports:summary', from, to),
  },
  backup: () => ipcRenderer.invoke('db:backup'),
};

// Exposed to the renderer as window.api
contextBridge.exposeInMainWorld('api', api);
