-- CMAUTOPLAN 견적 신청 테이블 스키마
-- Cloudflare D1 Database

CREATE TABLE IF NOT EXISTS estimates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_type TEXT NOT NULL,  
    vehicle TEXT NOT NULL,       
    phone TEXT NOT NULL,          
    deposit_type TEXT NOT NULL,  
    deposit_amount TEXT,         
    status TEXT DEFAULT 'pending', 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON estimates(created_at);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_phone ON estimates(phone);

-- 관리자 테이블
CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 초기 관리자 비밀번호 설정 (비밀번호: admin123)
-- 실제 사용 시 해시된 비밀번호로 변경 필요
-- INSERT INTO admin (password) VALUES ('admin123');

