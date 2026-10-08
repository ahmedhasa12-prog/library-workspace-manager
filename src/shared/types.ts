// Shared types between main and renderer

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface CustomerNote {
  id: number;
  customer_id: number;
  note: string;
  is_debt: number;
  debt_amount: number;
  created_at: string;
}

export interface Subscription {
  id: number;
  customer_id: number;
  customer_name?: string;
  type: 'weekly' | 'biweekly' | 'monthly';
  start_date: string;
  end_date: string;
  price: number;
  is_active: number;
  created_at: string;
}

export interface RoomType {
  id: number;
  key: string;
  name: string;
  hourly_rate: number;
  is_active: number;
}

export interface SessionRow {
  id: number;
  customer_id: number;
  customer_name?: string;
  room_type_id: number;
  room_name?: string;
  check_in_time: string;
  check_out_time: string | null;
  duration_minutes: number | null;
  hourly_rate: number;
  is_subscriber: number;
  time_charge: number | null;
  products_charge: number | null;
  total_amount: number | null;
  status: 'active' | 'completed';
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  is_active: number;
}

export interface CheckoutItem {
  productId: number;
  quantity: number;
}

export interface CheckoutResult {
  sessionId: number;
  durationMinutes: number;
  timeCharge: number;
  productsCharge: number;
  total: number;
  isSubscriber: boolean;
}

export interface CustomerDetails {
  customer: Customer;
  activeSubscription: Subscription | null;
  notes: CustomerNote[];
  totalDebt: number;
}

export interface ReportSummary {
  totalRevenue: number;
  timeRevenue: number;
  productsRevenue: number;
  sessionCount: number;
  avgSession: number;
  daily: { day: string; revenue: number; sessions: number }[];
}

export type SettingsMap = Record<string, string>;

// API surface exposed on window.api by the preload script
export interface Api {
  customers: {
    list(): Promise<Customer[]>;
    create(data: { name: string; phone?: string; email?: string }): Promise<Customer>;
    update(data: { id: number; name: string; phone?: string; email?: string }): Promise<void>;
    remove(id: number): Promise<void>;
    details(id: number): Promise<CustomerDetails>;
    addNote(data: { customerId: number; note: string; isDebt: boolean; debtAmount: number }): Promise<void>;
    deleteNote(id: number): Promise<void>;
    clearDebt(noteId: number): Promise<void>;
  };
  sessions: {
    active(): Promise<SessionRow[]>;
    history(limit?: number): Promise<SessionRow[]>;
    checkIn(data: { customerId: number; roomTypeId: number }): Promise<{ id: number; isSubscriber: boolean }>;
    checkout(data: { sessionId: number; items: CheckoutItem[] }): Promise<CheckoutResult>;
  };
  subscriptions: {
    list(): Promise<Subscription[]>;
    create(data: { customerId: number; type: Subscription['type']; price: number }): Promise<Subscription>;
    deactivate(id: number): Promise<void>;
  };
  products: {
    list(): Promise<Product[]>;
    create(data: { name: string; category: string; price: number; stock: number }): Promise<Product>;
    update(data: { id: number; name: string; category: string; price: number }): Promise<void>;
    restock(id: number, qty: number): Promise<void>;
    remove(id: number): Promise<void>;
  };
  rooms: {
    list(): Promise<RoomType[]>;
    updateRate(id: number, rate: number): Promise<void>;
  };
  settings: {
    get(): Promise<SettingsMap>;
    set(key: string, value: string): Promise<void>;
  };
  reports: {
    summary(from: string, to: string): Promise<ReportSummary>;
  };
  backup(): Promise<string | null>;
}
