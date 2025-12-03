-- CMAUTOPLAN 견적 신청 테이블 스키마
-- Cloudflare D1 Database

CREATE TABLE IF NOT EXISTS estimates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_type TEXT NOT NULL,  -- 'rent' (장기렌트) 또는 'lease' (리스)
    vehicle TEXT NOT NULL,       -- 차량명
    phone TEXT NOT NULL,          -- 핸드폰 번호
    deposit_type TEXT NOT NULL,  -- 'none' (무보증), 'deposit' (보증금), 'advance' (선수금)
    deposit_amount TEXT,         -- 보증금/선수금 금액 (deposit_type이 none이면 NULL)
    status TEXT DEFAULT 'pending', -- 'pending', 'contacted', 'completed', 'cancelled'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON estimates(created_at);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_phone ON estimates(phone);

