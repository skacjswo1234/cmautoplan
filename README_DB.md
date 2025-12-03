# Cloudflare D1 Database 설정 가이드

## 데이터베이스 정보
- **DB ID**: `35d6c716-5a1c-4c80-85d8-957d47c60ddd`
- **Variable Name**: `cmautoplan-db`
- **Bind Name**: `cmautoplan-db`

## 테이블 스키마

### estimates 테이블
견적 신청 정보를 저장하는 메인 테이블입니다.

| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| id | INTEGER | 고유 ID | PRIMARY KEY, AUTOINCREMENT |
| product_type | TEXT | 상품 유형 | NOT NULL ('rent' 또는 'lease') |
| vehicle | TEXT | 차량명 | NOT NULL |
| phone | TEXT | 핸드폰 번호 | NOT NULL |
| deposit_type | TEXT | 보증금 유형 | NOT NULL ('none', 'deposit', 'advance') |
| deposit_amount | TEXT | 보증금/선수금 금액 | NULL 가능 |
| status | TEXT | 상태 | DEFAULT 'pending' |
| created_at | DATETIME | 생성일시 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 수정일시 | DEFAULT CURRENT_TIMESTAMP |

### 인덱스
- `idx_estimates_created_at`: 생성일시 인덱스
- `idx_estimates_status`: 상태 인덱스
- `idx_estimates_phone`: 핸드폰 번호 인덱스

## 스키마 생성 방법

### 1. 로컬 개발 환경
```bash
# Wrangler CLI 설치 (이미 설치되어 있다면 생략)
npm install -g wrangler

# 로컬 D1 데이터베이스에 스키마 적용
wrangler d1 execute cmautoplan-db --local --file=schema.sql

# 프로덕션 D1 데이터베이스에 스키마 적용
wrangler d1 execute cmautoplan-db --file=schema.sql
```

### 2. Cloudflare Dashboard에서
1. Cloudflare Dashboard → Workers & Pages → D1
2. `cmautoplan-db` 데이터베이스 선택
3. "Console" 탭에서 SQL 쿼리 실행
4. `schema.sql` 파일의 내용 복사하여 실행

## API 엔드포인트

### POST /api/estimates
견적 신청을 생성합니다.

**Request Body:**
```json
{
  "productType": "rent",
  "vehicle": "현대 그랜저",
  "phone": "01012345678",
  "deposit": "none",
  "depositAmount": null,
  "advanceAmount": null
}
```

**Response:**
```json
{
  "success": true,
  "id": 1,
  "message": "견적 신청이 완료되었습니다."
}
```

### GET /api/estimates
견적 신청 목록을 조회합니다. (관리자용)

**Query Parameters:**
- `limit`: 조회할 개수 (기본값: 100)
- `offset`: 시작 위치 (기본값: 0)
- `status`: 상태 필터 (선택사항)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product_type": "rent",
      "vehicle": "현대 그랜저",
      "phone": "01012345678",
      "deposit_type": "none",
      "deposit_amount": null,
      "status": "pending",
      "created_at": "2024-01-01 12:00:00",
      "updated_at": "2024-01-01 12:00:00"
    }
  ],
  "count": 1
}
```

### GET /api/estimates/[id]
특정 견적 신청을 조회합니다.

### PATCH /api/estimates/[id]
견적 신청 상태를 업데이트합니다. (관리자용)

**Request Body:**
```json
{
  "status": "contacted"
}
```

## 파일 구조

```
.
├── schema.sql                          # 데이터베이스 스키마
├── functions/
│   ├── api/
│   │   ├── estimates.ts                # 견적 신청 API (POST, GET)
│   │   └── estimates/
│   │       └── [id].ts                 # 특정 견적 신청 API (GET, PATCH)
│   └── types.ts                        # TypeScript 타입 정의
└── script.js                           # 프론트엔드 API 호출 코드
```

## 주의사항

1. **CORS 설정**: 현재 모든 origin에서 접근 가능하도록 설정되어 있습니다. 프로덕션 환경에서는 특정 도메인만 허용하도록 수정하는 것을 권장합니다.

2. **인증**: 현재 API는 인증 없이 접근 가능합니다. 관리자 기능(GET, PATCH)은 인증을 추가하는 것을 권장합니다.

3. **에러 처리**: 모든 API는 에러 발생 시 적절한 HTTP 상태 코드와 에러 메시지를 반환합니다.

4. **데이터 검증**: 
   - 핸드폰 번호는 10-11자리 숫자만 허용
   - 필수 필드 검증 수행
   - deposit_type에 따라 deposit_amount 또는 advanceAmount 검증

