# 유입 경로 표시 기능 구현 계획

## 📋 요구사항

- URL 파라미터에 `mlvch-dgn`이 있으면 "당근"으로 표시
- 관리자 화면에서 각 문의의 유입 경로를 확인할 수 있어야 함
- 예시 URL: `http://localhost:3000/?mlvch-dgn&kmckid=5ee9e94f-e7b9-4e93-b026-f852f6a43940&af_force_deeplink=true`

---

## 🔍 현재 상황 분석

### 1. 데이터베이스 스키마
- `estimates` 테이블에 유입 경로(`traffic_source`) 컬럼이 없음
- 기존 데이터는 유입 경로 정보가 없음 (NULL 처리 필요)

### 2. 프론트엔드 (script.js)
- URL 파라미터를 추출하지 않음
- API 호출 시 유입 경로 정보를 전송하지 않음

### 3. API (functions/api/estimates.ts)
- POST 요청에서 유입 경로를 받지 않음
- 데이터베이스에 유입 경로를 저장하지 않음

### 4. 관리자 화면
- 테이블에 유입 경로 컬럼이 없음
- 모바일 카드에도 유입 경로 표시 없음

---

## 📝 구현 계획

### Phase 1: 데이터베이스 스키마 수정

#### 1.1 테이블에 컬럼 추가
```sql
ALTER TABLE estimates ADD COLUMN traffic_source TEXT;
```

**고려사항:**
- 기존 데이터는 `NULL`로 처리 (기본값)
- 인덱스는 필요 시 추가 (현재는 필터링이 주 목적이므로 선택사항)

#### 1.2 유입 경로 값 정의
- `danggeun` (당근마켓)
- `direct` (직접 유입)
- `search` (검색 엔진)
- `other` (기타)
- `null` (알 수 없음 - 기존 데이터)

---

### Phase 2: 프론트엔드 수정 (script.js)

#### 2.1 URL 파라미터 추출 함수 추가
```javascript
// 페이지 로드 시 URL 파라미터에서 유입 경로 추출
function getTrafficSource() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 당근마켓 확인 (mlvch-dgn 파라미터 존재 여부)
    if (urlParams.has('mlvch-dgn')) {
        return 'danggeun';
    }
    
    // 추후 다른 광고 업체 추가 가능
    // if (urlParams.has('other-source')) {
    //     return 'other';
    // }
    
    // 기본값: 직접 유입
    return 'direct';
}
```

#### 2.2 API 호출 시 유입 경로 전송
- `script.js`의 `step5NextBtn` 이벤트 리스너에서
- `surveyData`에 `trafficSource` 추가
- API 요청 body에 `trafficSource` 포함

**수정 위치:**
- `script.js` 약 190-212줄 (API 호출 부분)

---

### Phase 3: API 수정 (functions/api/estimates.ts)

#### 3.1 POST 요청에서 유입 경로 받기
```typescript
const { 
    productType, 
    vehicle, 
    phone, 
    name, 
    deposit, 
    depositAmount, 
    advanceAmount, 
    privacyConsent, 
    thirdPartyConsent, 
    marketingConsent,
    trafficSource  // 추가
} = body;
```

#### 3.2 데이터베이스에 저장
```typescript
const result = await db.prepare(
    `INSERT INTO estimates (
        product_type, 
        vehicle, 
        phone, 
        name, 
        deposit_type, 
        deposit_amount, 
        privacy_consent, 
        third_party_consent, 
        marketing_consent, 
        traffic_source,  // 추가
        status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
).bind(
    finalProductType,
    vehicle,
    phone.replace(/[^0-9]/g, ''),
    name,
    finalDeposit,
    finalDepositAmount,
    privacyConsent ? 1 : 0,
    thirdPartyConsent ? 1 : 0,
    marketingConsent ? 1 : 0,
    trafficSource || null,  // 추가
).run();
```

**고려사항:**
- `trafficSource`가 없거나 빈 값이면 `null` 저장
- 기존 API 호출과의 호환성 유지 (선택적 필드)

---

### Phase 4: 관리자 화면 수정

#### 4.1 테이블 헤더에 컬럼 추가 (admin.html)
```html
<th>유입경로</th>
```

**위치:**
- `admin.html` 약 100줄 (신청일시 다음, 관리 앞)

#### 4.2 테이블 본문에 데이터 표시 (admin.js)
```javascript
const trafficSourceText = (source) => {
    const sources = {
        'danggeun': '당근',
        'direct': '직접유입',
        'search': '검색엔진',
        'other': '기타',
        null: '-',
        undefined: '-'
    };
    return sources[source] || '-';
};
```

**수정 위치:**
- `admin.js` 약 243-262줄 (데스크톱 테이블)
- `admin.js` 약 264-310줄 (모바일 카드)

#### 4.3 모바일 카드에도 표시
- 모바일 카드 리스트에 유입 경로 필드 추가

---

## 🎯 구현 순서

### Step 1: 데이터베이스 마이그레이션
1. `schema.sql`에 ALTER TABLE 문 추가
2. Cloudflare D1 데이터베이스에서 실행
3. 기존 데이터 확인 (NULL 값 정상)

### Step 2: 프론트엔드 수정
1. `script.js`에 URL 파라미터 추출 함수 추가
2. 페이지 로드 시 유입 경로 저장
3. API 호출 시 `trafficSource` 전송

### Step 3: API 수정
1. `functions/api/estimates.ts`에서 `trafficSource` 받기
2. 데이터베이스 INSERT 문에 `traffic_source` 추가
3. 테스트 (기존 API 호출과의 호환성 확인)

### Step 4: 관리자 화면 수정
1. `admin.html` 테이블 헤더에 컬럼 추가
2. `admin.js`에 유입 경로 표시 함수 추가
3. 데스크톱 테이블에 데이터 표시
4. 모바일 카드에 데이터 표시
5. `colspan` 값 조정 (10 → 11)

---

## 🔧 기술적 고려사항

### 1. URL 파라미터 추출
- `URLSearchParams` 사용 (모던 브라우저 지원)
- `mlvch-dgn` 파라미터는 값이 없어도 존재 여부만 확인

### 2. 기존 데이터 호환성
- 기존 데이터는 `traffic_source = NULL`
- 관리자 화면에서 `-` 또는 `알 수 없음`으로 표시

### 3. 확장성
- 추후 다른 광고 업체 추가 시 `getTrafficSource()` 함수만 수정
- 데이터베이스 스키마 변경 불필요

### 4. 성능
- URL 파라미터 추출은 페이지 로드 시 1회만 실행
- 데이터베이스 쿼리 성능 영향 최소 (단순 TEXT 컬럼 추가)

---

## 📊 예상 결과

### 관리자 화면 테이블
| ID | 성함 | 상품유형 | 차량명 | 연락처 | 보증금유형 | 보증금금액 | 상태 | 신청일시 | **유입경로** | 관리 |
|----|------|----------|--------|--------|------------|------------|------|----------|--------------|------|
| 1  | 홍길동 | 장기렌트 | 그랜저 | 010... | 무보증 | - | 대기중 | 2025.01.15 14:30 | **당근** | ... |

### 모바일 카드
```
#1 [대기중]
성함: 홍길동
상품유형: 장기렌트
차량명: 그랜저
연락처: 010-1234-5678
보증금유형: 무보증
신청일시: 2025.01.15 14:30
유입경로: 당근
[상태변경] [삭제]
```

---

## ✅ 체크리스트

### 데이터베이스
- [ ] `traffic_source` 컬럼 추가
- [ ] 기존 데이터 확인 (NULL 값 정상)

### 프론트엔드
- [ ] URL 파라미터 추출 함수 추가
- [ ] API 호출 시 `trafficSource` 전송
- [ ] 테스트 (당근 URL로 접속 시 유입 경로 전송 확인)

### API
- [ ] POST 요청에서 `trafficSource` 받기
- [ ] 데이터베이스에 저장
- [ ] 기존 API 호출과의 호환성 확인

### 관리자 화면
- [ ] 테이블 헤더에 "유입경로" 컬럼 추가
- [ ] 데스크톱 테이블에 데이터 표시
- [ ] 모바일 카드에 데이터 표시
- [ ] `colspan` 값 조정

---

## 🚨 주의사항

1. **데이터베이스 마이그레이션**
   - 프로덕션 환경에서 실행 전 백업 권장
   - 기존 데이터에 영향 없음 (NULL 값)

2. **기존 API 호출**
   - `trafficSource`는 선택적 필드로 처리
   - 기존 외부 API 호출과의 호환성 유지

3. **URL 파라미터**
   - `mlvch-dgn` 파라미터는 값이 없어도 존재 여부만 확인
   - 다른 파라미터와 함께 사용 가능

4. **테스트**
   - 당근 URL로 접속하여 유입 경로가 "당근"으로 저장되는지 확인
   - 직접 유입 시 "직접유입"으로 저장되는지 확인
   - 관리자 화면에서 정상 표시되는지 확인

---

## 📝 추가 개선 사항 (선택)

### 1. 유입 경로 필터링
- 관리자 화면에서 유입 경로별 필터링 기능 추가

### 2. 통계 대시보드
- 유입 경로별 문의 건수 통계 표시

### 3. 다른 광고 업체 추가
- URL 파라미터 패턴에 따라 다른 광고 업체 인식
- 예: `?fb_source` → Facebook, `?naver_ad` → 네이버 등

