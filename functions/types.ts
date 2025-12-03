// Cloudflare Pages Functions 타입 정의

export interface Env {
  'cmautoplan-db': D1Database;
}

export interface Estimate {
  id: number;
  product_type: 'rent' | 'lease';
  vehicle: string;
  phone: string;
  deposit_type: 'none' | 'deposit' | 'advance';
  deposit_amount: string | null;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

