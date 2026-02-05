// User types
export interface User {
  id: number;
  username: string;
  role: 'admin' | 'cashier';
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Shift types
export interface Shift {
  id: number;
  type: 'morning' | 'evening';
  opened_by: number;
  opened_at: string;
  opening_balance: number;
  closed_by?: number;
  closed_at?: string;
  expected_balance?: number;
  actual_balance?: number;
  difference?: number;
  difference_reason?: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface ShiftSummary extends Shift {
  total_orders: number;
  total_sales: number;
  total_expenses: number;
}

// Category types
export interface Category {
  id: number;
  name: string;
  name_ar: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// Item types
export interface Item {
  id: number;
  category_id: number;
  name: string;
  name_ar: string;
  price: number;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Order types
export interface Order {
  id: number;
  shift_id: number;
  cashier_id: number;
  total_amount: number;
  payment_method: 'cash' | 'card';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { item: Item })[];
}

// Expense types
export interface Expense {
  id: number;
  shift_id?: number;
  category: string;
  amount: number;
  description: string;
  receipt_number?: string;
  recorded_by: number;
  created_at: string;
}

// Audit Log types
export interface AuditLogEntry {
  id: number;
  user_id: number;
  action: string;
  table_name: string;
  record_id?: number;
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  created_at: string;
}

// Request/Response types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface OpenShiftRequest {
  type: 'morning' | 'evening';
  opening_balance?: number;
}

export interface CloseShiftRequest {
  shift_id: number;
  actual_balance: number;
  difference_reason?: string;
}

export interface CreateOrderRequest {
  items: {
    item_id: number;
    quantity: number;
  }[];
  payment_method?: 'cash' | 'card';
  notes?: string;
}

export interface CreateExpenseRequest {
  shift_id?: number;
  category: string;
  amount: number;
  description: string;
  receipt_number?: string;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
