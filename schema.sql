-- CMAUTOPLAN 견적 신청 테이블 스키마
-- Cloudflare D1 Database

CREATE TABLE IF NOT EXISTS estimates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_type TEXT NOT NULL,  
    vehicle TEXT NOT NULL,       
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    deposit_type TEXT NOT NULL,  
    deposit_amount TEXT,         
    privacy_consent INTEGER DEFAULT 0,
    third_party_consent INTEGER DEFAULT 0,
    marketing_consent INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON estimates(created_at);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_phone ON estimates(phone);

-- ============================================
-- 기존 테이블 마이그레이션 (기존 테이블에 필드 추가)
-- ============================================
-- 아래 SQL 문들을 순서대로 실행하여 기존 테이블에 필드를 추가하세요
-- 이미 컬럼이 존재하는 경우 에러가 발생할 수 있으니, 각각 실행 후 확인하세요

-- 1. 성함 필드 추가 (기존 데이터가 있을 수 있으므로 NULL 허용)
ALTER TABLE estimates ADD COLUMN name TEXT;

-- 2. 개인정보 수집·이용 동의 필드 추가
ALTER TABLE estimates ADD COLUMN privacy_consent INTEGER DEFAULT 0;

-- 3. 개인정보 제3자 제공 동의 필드 추가
ALTER TABLE estimates ADD COLUMN third_party_consent INTEGER DEFAULT 0;

-- 4. 마케팅 활용 및 광고성 정보 수신 동의 필드 추가
ALTER TABLE estimates ADD COLUMN marketing_consent INTEGER DEFAULT 0;

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

