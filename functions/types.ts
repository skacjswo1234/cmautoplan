// Cloudflare Pages Functions 타입 정의

// D1Database 타입 선언 (Cloudflare Workers 타입)
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
  }
  
  interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    first<T = any>(): Promise<T | null>;
    run(): Promise<D1Result>;
    all<T = any>(): Promise<D1Result<T>>;
  }
  
  interface D1Result<T = any> {
    results: T[];
    success: boolean;
    meta: {
      last_row_id: number;
      changes: number;
    };
  }
}

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

