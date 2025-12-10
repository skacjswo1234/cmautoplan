# 씨엠오토플랜 API 연동 가이드

## 📌 간단 요약

지오앤플랜에서 광고를 통해 받은 고객 정보를 씨엠오토플랜 관리자 시스템으로 자동 전송하는 API입니다.

**API 주소**: `https://cmautoplan.com/api/estimates`

---

## 🚀 빠른 시작 (가장 중요한 부분)

### 1단계: 고객 정보를 API로 전송하기

지오앤플랜에서 고객이 견적을 신청하면, 아래와 같이 API를 호출하시면 됩니다.

#### 전송할 데이터 예시 (최소 필수 필드)
```json
{
  "vehicle": "현대 그랜저",
  "phone": "01012345678",
  "name": "홍길동",
  "privacyConsent": true,
  "thirdPartyConsent": true
}
```

#### 전송할 데이터 예시 (전체 필드)
```json
{
  "productType": "rent",
  "vehicle": "현대 그랜저",
  "phone": "01012345678",
  "name": "홍길동",
  "deposit": "none",
  "privacyConsent": true,
  "thirdPartyConsent": true,
  "marketingConsent": false
}
```

**참고**: `productType`과 `deposit`은 선택사항입니다. `null`을 보내거나 생략하면 자동으로 기본값이 설정됩니다:
- `productType`: 생략 시 `"rent"`로 설정
- `deposit`: 생략 시 `"none"`으로 설정

#### 실제 코드 예시 (JavaScript)
```javascript
// 고객이 견적 신청을 완료했을 때 실행
async function sendToCMAUTOPLAN(customerData) {
  const response = await fetch('https://cmautoplan.com/api/estimates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // productType과 deposit은 선택사항 (null 또는 생략 가능, 기본값 자동 설정)
      productType: customerData.productType || null,    // 'rent' 또는 'lease' (null이면 'rent'로 자동 설정)
      vehicle: customerData.vehicle,                    // 차량명 (필수)
      phone: customerData.phone.replace(/[^0-9]/g, ''), // 핸드폰번호 (숫자만, 필수)
      name: customerData.name,                          // 고객 이름 (필수)
      deposit: customerData.deposit || null,            // 'none', 'deposit', 'advance' (null이면 'none'으로 자동 설정)
      depositAmount: customerData.depositAmount || null, // 보증금 금액 (있으면)
      advanceAmount: customerData.advanceAmount || null, // 선수금 금액 (있으면)
      privacyConsent: true,                             // 필수: 개인정보 동의
      thirdPartyConsent: true,                          // 필수: 제3자 제공 동의
      marketingConsent: customerData.marketingConsent || false // 선택: 마케팅 동의
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('전송 성공! ID:', result.id);
    return result;
  } else {
    console.error('전송 실패:', result.error);
    return null;
  }
}
```

#### 실제 코드 예시 (PHP)
```php
<?php
function sendToCMAUTOPLAN($customerData) {
    $url = 'https://cmautoplan.com/api/estimates';
    
    $data = array(
        // productType과 deposit은 선택사항 (null 또는 생략 가능, 기본값 자동 설정)
        'productType' => $customerData['productType'] ?? null,  // null이면 'rent'로 자동 설정
        'vehicle' => $customerData['vehicle'],                    // 필수
        'phone' => preg_replace('/[^0-9]/', '', $customerData['phone']), // 필수
        'name' => $customerData['name'],                          // 필수
        'deposit' => $customerData['deposit'] ?? null,            // null이면 'none'으로 자동 설정
        'depositAmount' => $customerData['depositAmount'] ?? null,
        'advanceAmount' => $customerData['advanceAmount'] ?? null,
        'privacyConsent' => true,                                 // 필수
        'thirdPartyConsent' => true,                              // 필수
        'marketingConsent' => $customerData['marketingConsent'] ?? false
    );
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}
?>
```

---

## 📋 필수 항목 체크리스트

### 반드시 보내야 하는 데이터

| 항목 | 설명 | 예시 | 필수 여부 |
|------|------|------|----------|
| **vehicle** | 차량명 | `"현대 그랜저"`, `"기아 EV3"` | ✅ 필수 |
| **phone** | 핸드폰 번호 | `"01012345678"` (하이픈 없이 숫자만) | ✅ 필수 |
| **name** | 고객 이름 | `"홍길동"` | ✅ 필수 |
| **privacyConsent** | 개인정보 동의 | `true` (반드시 true) | ✅ 필수 |
| **thirdPartyConsent** | 제3자 제공 동의 | `true` (반드시 true) | ✅ 필수 |

### 선택적으로 보낼 수 있는 데이터 (기본값 자동 설정)

| 항목 | 설명 | 예시 | 필수 여부 | 기본값 |
|------|------|------|----------|--------|
| **productType** | 상품 유형 | `"rent"` (장기렌트) 또는 `"lease"` (리스) | ❌ 선택 | `"rent"` |
| **deposit** | 보증금 유형 | `"none"` (무보증), `"deposit"` (보증금), `"advance"` (선수금) | ❌ 선택 | `"none"` |
| **depositAmount** | 보증금 금액 | `"1000000"` (deposit이 "deposit"일 때만) | ❌ 선택 | `null` |
| **advanceAmount** | 선수금 금액 | `"2000000"` (deposit이 "advance"일 때만) | ❌ 선택 | `null` |
| **marketingConsent** | 마케팅 동의 | `true` 또는 `false` | ❌ 선택 | `false` |

**참고**: `productType`과 `deposit`은 `null`을 보내거나 생략할 수 있으며, 서버에서 자동으로 기본값이 설정됩니다.

---

## ✅ 성공 응답 예시

API 호출이 성공하면 다음과 같은 응답을 받습니다:

```json
{
  "success": true,
  "id": 123,
  "message": "견적 신청이 완료되었습니다."
}
```

**성공 시**: `id` 값이 반환되며, 이 ID는 씨엠오토플랜 관리자 페이지에서 확인할 수 있습니다.

---

## ❌ 에러 응답 예시

### 1. 필수 항목이 빠진 경우
```json
{
  "success": false,
  "error": "필수 필드가 누락되었습니다."
}
```
**해결**: 다음 필수 항목을 확인하세요: `vehicle`, `phone`, `name`, `privacyConsent`, `thirdPartyConsent`

### 2. 개인정보 동의가 없는 경우
```json
{
  "success": false,
  "error": "개인정보 수집·이용 및 제3자 제공 동의는 필수입니다."
}
```
**해결**: `privacyConsent`와 `thirdPartyConsent`를 `true`로 설정하세요.

### 3. 핸드폰 번호 형식이 잘못된 경우
```json
{
  "success": false,
  "error": "올바른 핸드폰 번호를 입력해주세요."
}
```
**해결**: 핸드폰 번호에서 하이픈을 제거하고 숫자만 보내세요. (예: `01012345678`)

---

## 📝 실제 사용 시나리오

### 시나리오 1: 최소 필수 필드만 전송 (가장 간단한 방법)
```json
{
  "vehicle": "현대 그랜저",
  "phone": "01012345678",
  "name": "홍길동",
  "privacyConsent": true,
  "thirdPartyConsent": true
}
```
**참고**: `productType`과 `deposit`이 없어도 자동으로 `"rent"`와 `"none"`으로 설정됩니다.

### 시나리오 2: 기본 견적 신청 (무보증)
```json
{
  "productType": "rent",
  "vehicle": "현대 그랜저",
  "phone": "01012345678",
  "name": "홍길동",
  "deposit": "none",
  "privacyConsent": true,
  "thirdPartyConsent": true,
  "marketingConsent": false
}
```

### 시나리오 3: 보증금 있는 견적 신청
```json
{
  "productType": "rent",
  "vehicle": "기아 EV3",
  "phone": "01098765432",
  "name": "김철수",
  "deposit": "deposit",
  "depositAmount": "1000000",
  "privacyConsent": true,
  "thirdPartyConsent": true,
  "marketingConsent": true
}
```

### 시나리오 4: 선수금 있는 견적 신청
```json
{
  "productType": "lease",
  "vehicle": "BMW 5 Series",
  "phone": "01055556666",
  "name": "이영희",
  "deposit": "advance",
  "advanceAmount": "2000000",
  "privacyConsent": true,
  "thirdPartyConsent": true,
  "marketingConsent": false
}
```

---

## 🔍 데이터 확인 방법

전송한 데이터는 씨엠오토플랜 관리자 페이지에서 확인할 수 있습니다:
- 관리자 페이지: `https://cmautoplan.com/admin.html`
- 전송된 데이터는 "문의 관리" 메뉴에서 확인 가능합니다.

---

## 🛠️ 테스트 방법

### 방법 1: 브라우저 개발자 도구 사용
1. 브라우저에서 F12 키를 눌러 개발자 도구 열기
2. Console 탭에서 아래 코드 실행:

```javascript
// 최소 필수 필드만 전송 (권장)
fetch('https://cmautoplan.com/api/estimates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vehicle: '테스트 차량',
    phone: '01012345678',
    name: '테스트',
    privacyConsent: true,
    thirdPartyConsent: true
  })
})
.then(res => res.json())
.then(data => console.log('결과:', data));
```

### 방법 2: Postman 사용
1. Postman에서 새 요청 생성
2. Method: `POST`
3. URL: `https://cmautoplan.com/api/estimates`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON)에 위의 예시 데이터 입력
6. Send 버튼 클릭

