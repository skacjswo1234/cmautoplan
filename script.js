// 설문조사 데이터 저장
const surveyData = {
    productType: null,
    vehicle: null,
    period: null,
    deposit: null,
    name: null,
    privacyConsent: false,
    thirdPartyConsent: false,
    marketingConsent: false,
    personalInfo: {},
    trafficSource: null,
    sourceUrl: null
};

let currentStep = 1;
const totalSteps = 6;

// URL 파라미터에서 유입 경로 추출
// 예시: ?mlvch-dgn&kmckid=5ee9e94f-e7b9-4e93-b026-f852f6a43940&af_force_deeplink=true
function getTrafficSource() {
    try {
        const searchParams = window.location.search;
        
        // 쿼리 스트링이 없으면 직접 유입
        if (!searchParams || searchParams.length === 0) {
            return 'direct';
        }
        
        // 방법 1: URLSearchParams 사용 (표준 방법, 가장 정확)
        // ?mlvch-dgn 형태 (값 없음) 또는 ?mlvch-dgn=value 형태 모두 처리
        try {
            const urlParams = new URLSearchParams(searchParams);
            
            // has() 메서드는 값이 있든 없든 키가 존재하면 true 반환
            // ?mlvch-dgn → true
            // ?mlvch-dgn&kmckid=... → true
            // ?kmckid=...&mlvch-dgn → true
            if (urlParams.has('mlvch-dgn')) {
                console.log('✅ 당근마켓 유입 감지 (mlvch-dgn 파라미터 발견)');
                return 'danggeun';
            }
        } catch (e) {
            console.warn('URLSearchParams 파싱 오류, 문자열 검색으로 대체:', e);
        }
        
        // 방법 2: 문자열 검색 (추가 안전장치)
        // URLSearchParams가 작동하지 않는 경우를 대비
        // 정확한 파라미터 매칭을 위해 패턴 검색
        const mlvchPattern = /[?&]mlvch-dgn(?=[&=]|$)/;
        if (mlvchPattern.test(searchParams)) {
            console.log('✅ 당근마켓 유입 감지 (문자열 패턴 매칭)');
            return 'danggeun';
        }
        
        // 추후 다른 광고 업체 추가 가능
        // if (urlParams.has('other-source') || searchParams.includes('other-source')) {
        //     return 'other';
        // }
        
        // 기본값: 직접 유입
        return 'direct';
    } catch (error) {
        console.error('유입 경로 추출 오류:', error);
        return 'direct';
    }
}

// 페이지 로드 시 유입 경로 및 URL 저장
surveyData.trafficSource = getTrafficSource();
// 전체 URL 저장 (쿼리 스트링 포함)
surveyData.sourceUrl = window.location.href;
console.log('📊 최종 유입 경로:', surveyData.trafficSource === 'danggeun' ? '당근마켓' : '직접유입');
console.log('🔗 유입 URL:', surveyData.sourceUrl);

// STEP 1: 상품 유형 선택
const optionCards = document.querySelectorAll('.option-card');
optionCards.forEach(card => {
    const selectBtn = card.querySelector('.select-btn');
    selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        optionCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        surveyData.productType = card.dataset.option;
        setTimeout(() => {
            goToNextStep();
        }, 300);
    });
});

// STEP 2: 차량 입력
const vehicleInput = document.getElementById('vehicleInput');
const step2NextBtn = document.getElementById('step2NextBtn');

vehicleInput?.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (value.length > 0) {
        surveyData.vehicle = value;
        step2NextBtn.disabled = false;
    } else {
        step2NextBtn.disabled = true;
    }
});

step2NextBtn?.addEventListener('click', goToNextStep);

// STEP 3: 핸드폰 번호 입력
const phoneInput = document.getElementById('phoneInput');
const step3NextBtn = document.getElementById('step3NextBtn');

// 핸드폰 번호 유효성 검사 (숫자만, 10-11자리)
phoneInput?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 허용
    e.target.value = value;
    
    if (value.length >= 10 && value.length <= 11) {
        surveyData.phone = value;
        step3NextBtn.disabled = false;
    } else {
        step3NextBtn.disabled = true;
    }
});

step3NextBtn?.addEventListener('click', goToNextStep);

// STEP 4: 보증금 유형 선택
const depositCards = document.querySelectorAll('.deposit-card');
const step4NextBtn = document.getElementById('step4NextBtn');
const depositAmountInput = document.getElementById('depositAmountInput');
const advanceAmountInput = document.getElementById('advanceAmountInput');

depositCards.forEach(card => {
    card.addEventListener('click', () => {
        depositCards.forEach(c => {
            c.classList.remove('selected');
            const inputWrapper = c.querySelector('.deposit-input-wrapper');
            if (inputWrapper) {
                inputWrapper.style.display = 'none';
            }
        });
        
        card.classList.add('selected');
        surveyData.deposit = card.dataset.deposit;
        
        // 보증금 또는 선수금 선택 시 입력 필드 표시
        const inputWrapper = card.querySelector('.deposit-input-wrapper');
        if (inputWrapper) {
            inputWrapper.style.display = 'block';
            const input = inputWrapper.querySelector('input');
            if (input) {
                input.focus();
            }
        }
        
        // 보증금 선택 후 완료 조건 확인
        if (card.dataset.deposit === 'none') {
            // 무보증 선택 시 바로 다음 단계로 진행 가능
            step4NextBtn.disabled = false;
        } else {
            // 보증금 또는 선수금 선택 시 입력값 확인
            checkDepositInput();
        }
    });
});

// 보증금/선수금 입력값 확인
function checkDepositInput() {
    const selectedCard = document.querySelector('.deposit-card.selected');
    if (!selectedCard) return;
    
    const depositType = selectedCard.dataset.deposit;
    let hasValue = false;
    
    if (depositType === 'deposit' && depositAmountInput) {
        hasValue = depositAmountInput.value.trim().length > 0;
        if (hasValue) {
            surveyData.depositAmount = depositAmountInput.value;
        }
    } else if (depositType === 'advance' && advanceAmountInput) {
        hasValue = advanceAmountInput.value.trim().length > 0;
        if (hasValue) {
            surveyData.advanceAmount = advanceAmountInput.value;
        }
    }
    
    // 보증금/선수금 입력 후 다음 단계 버튼 활성화
    step4NextBtn.disabled = !hasValue;
}

depositAmountInput?.addEventListener('input', checkDepositInput);
advanceAmountInput?.addEventListener('input', checkDepositInput);

// STEP 4 다음 단계 버튼 (보증금 선택 후 다음 단계로 이동)
step4NextBtn?.addEventListener('click', goToNextStep);

// STEP 5: 성함 입력
const nameInput = document.getElementById('nameInput');
const step5NextBtn = document.getElementById('step5NextBtn');

nameInput?.addEventListener('input', (e) => {
    surveyData.name = e.target.value.trim();
    checkStep5Complete();
});

// STEP 5: 개인정보 동의 체크박스
const privacyConsent = document.getElementById('privacyConsent');
const thirdPartyConsent = document.getElementById('thirdPartyConsent');
const marketingConsent = document.getElementById('marketingConsent');

privacyConsent?.addEventListener('change', (e) => {
    surveyData.privacyConsent = e.target.checked;
    checkStep5Complete();
});

thirdPartyConsent?.addEventListener('change', (e) => {
    surveyData.thirdPartyConsent = e.target.checked;
    checkStep5Complete();
});

marketingConsent?.addEventListener('change', (e) => {
    surveyData.marketingConsent = e.target.checked;
    checkStep5Complete();
});

// 개인정보 동의 링크 클릭 시 모달 열기
document.querySelectorAll('.consent-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = link.dataset.modal;
        if (modalId) {
            openModal(modalId);
        }
    });
});

// STEP 5 완료 조건 확인
function checkStep5Complete() {
    const hasName = surveyData.name && surveyData.name.length > 0;
    const allConsentsChecked = surveyData.privacyConsent && 
                               surveyData.thirdPartyConsent && 
                               surveyData.marketingConsent;
    
    if (step5NextBtn) {
        step5NextBtn.disabled = !(hasName && allConsentsChecked);
    }
}

// STEP 5 다음 단계 버튼 (최종 제출)
step5NextBtn?.addEventListener('click', async () => {
    // STEP 4에서 다음단계를 누르면 서버로 데이터 전송
    console.log('설문조사 데이터:', surveyData);
    
    try {
        // API 호출
        const response = await fetch('/api/estimates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productType: surveyData.productType,
                vehicle: surveyData.vehicle,
                phone: surveyData.phone,
                name: surveyData.name,
                deposit: surveyData.deposit,
                depositAmount: surveyData.depositAmount || null,
                advanceAmount: surveyData.advanceAmount || null,
                privacyConsent: surveyData.privacyConsent,
                thirdPartyConsent: surveyData.thirdPartyConsent,
                marketingConsent: surveyData.marketingConsent,
                trafficSource: surveyData.trafficSource || null,
                sourceUrl: surveyData.sourceUrl || null,
            }),
        });

        const result = await response.json();
        
        // 전환 이벤트는 사용자가 제출 버튼을 눌렀을 때 실행 (API 성공 여부와 무관)
        try {
            if (window.karrotPixel && typeof window.karrotPixel.track === 'function') {
                window.karrotPixel.track('SubmitApplication');
                console.log('당근마켓 픽셀 전환 이벤트 전송 완료');
            } else {
                console.warn('당근마켓 픽셀이 로드되지 않았습니다.');
            }
        } catch (pixelError) {
            console.error('당근마켓 픽셀 전환 이벤트 오류:', pixelError);
        }
        
        if (result.success) {
            console.log('견적 신청 완료:', result);
            
            // 완료 모달 표시
            setTimeout(() => {
                openCompletionModal();
            }, 300);
        } else {
            console.error('견적 신청 실패:', result.error);
            alert('견적 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
            // 실패해도 완료 모달은 표시 (사용자 경험을 위해)
            setTimeout(() => {
                openCompletionModal();
            }, 300);
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        
        // 전환 이벤트는 사용자가 제출 버튼을 눌렀을 때 실행 (네트워크 오류와 무관)
        try {
            if (window.karrotPixel && typeof window.karrotPixel.track === 'function') {
                window.karrotPixel.track('SubmitApplication');
                console.log('당근마켓 픽셀 전환 이벤트 전송 완료 (오류 발생 후)');
            } else {
                console.warn('당근마켓 픽셀이 로드되지 않았습니다.');
            }
        } catch (pixelError) {
            console.error('당근마켓 픽셀 전환 이벤트 오류:', pixelError);
        }
        
        // 오류가 발생해도 완료 모달은 표시 (사용자 경험을 위해)
        setTimeout(() => {
            openCompletionModal();
        }, 300);
    }
});

// 단계 이동 함수
function goToNextStep() {
    if (currentStep < totalSteps) {
        currentStep++;
        updateStepDisplay();
    }
}

function updateStepDisplay() {
    // 진행 바 업데이트
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        if (index + 1 <= currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // 설문 단계 표시/숨김
    const surveySteps = document.querySelectorAll('.survey-step');
    surveySteps.forEach((step, index) => {
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// 설문조사 초기화
function resetSurvey() {
    currentStep = 1;
    surveyData.productType = null;
    surveyData.vehicle = null;
    surveyData.period = null;
    surveyData.deposit = null;
    surveyData.name = null;
    surveyData.privacyConsent = false;
    surveyData.thirdPartyConsent = false;
    surveyData.marketingConsent = false;
    surveyData.personalInfo = {};
    
    // 모든 선택 해제
    optionCards.forEach(c => c.classList.remove('selected'));
    depositCards.forEach(c => {
        c.classList.remove('selected');
        const inputWrapper = c.querySelector('.deposit-input-wrapper');
        if (inputWrapper) {
            inputWrapper.style.display = 'none';
        }
    });
    
    // 입력 필드 초기화
    if (vehicleInput) {
        vehicleInput.value = '';
    }
    if (phoneInput) {
        phoneInput.value = '';
    }
    if (nameInput) {
        nameInput.value = '';
    }
    if (depositAmountInput) {
        depositAmountInput.value = '';
    }
    if (advanceAmountInput) {
        advanceAmountInput.value = '';
    }
    
    // 체크박스 초기화
    if (privacyConsent) {
        privacyConsent.checked = false;
    }
    if (thirdPartyConsent) {
        thirdPartyConsent.checked = false;
    }
    if (marketingConsent) {
        marketingConsent.checked = false;
    }
    
    // 다음 버튼 비활성화
    const nextButtons = document.querySelectorAll('.next-btn, .next-step-btn');
    nextButtons.forEach(btn => {
        btn.disabled = true;
    });
    
    updateStepDisplay();
}

// 개인정보 동의 링크는 이미 위에서 처리됨

// 모달 열기/닫기
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// 완료 모달 열기
function openCompletionModal() {
    const completionModal = document.getElementById('completionModal');
    if (completionModal) {
        completionModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// 완료 모달 닫기 및 첫 화면으로 복귀
function closeCompletionModal() {
    const completionModal = document.getElementById('completionModal');
    if (completionModal) {
        completionModal.classList.remove('active');
        document.body.style.overflow = '';
        
        // 첫 번째 화면으로 복귀
        resetSurvey();
        
        // 페이지 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

const modalCloses = document.querySelectorAll('.modal-close');
modalCloses.forEach(close => {
    close.addEventListener('click', () => {
        const modal = close.closest('.modal');
        if (modal) {
            // 완료 모달은 첫 화면으로 복귀
            if (modal.id === 'completionModal') {
                closeCompletionModal();
            } else {
                closeModal(modal);
            }
        }
    });
});

const modals = document.querySelectorAll('.modal');
modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            // 완료 모달은 배경 클릭 시 첫 화면으로 복귀
            if (modal.id === 'completionModal') {
                closeCompletionModal();
            } else {
                closeModal(modal);
            }
        }
    });
});

// 완료 모달 확인 버튼
const completionCloseBtn = document.getElementById('completionCloseBtn');
if (completionCloseBtn) {
    completionCloseBtn.addEventListener('click', closeCompletionModal);
}

// 초기화
updateStepDisplay();

// 타임딜 차량 탭 전환
const carTabs = document.querySelectorAll('.car-tab');
const carTabContents = document.querySelectorAll('.car-tab-content');

carTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // 모든 탭 비활성화
        carTabs.forEach(t => t.classList.remove('active'));
        carTabContents.forEach(c => c.classList.remove('active'));
        
        // 선택된 탭 활성화
        tab.classList.add('active');
        document.querySelector(`.car-tab-content[data-tab="${targetTab}"]`)?.classList.add('active');
    });
});

// 카운트다운 타이머
function updateCountdown() {
    const countdowns = document.querySelectorAll('.dateCount');
    
    countdowns.forEach(countdown => {
        const dayEl = countdown.querySelector('.count-day');
        const hourEl = countdown.querySelector('.count-hour');
        const minEl = countdown.querySelector('.count-min');
        const secEl = countdown.querySelector('.count-sec');
        
        if (!dayEl || !hourEl || !minEl || !secEl) return;
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        // 현재 월의 마지막 날 계산 (다음 달의 0일 = 현재 달의 마지막 날)
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        
        // 목표 시간 설정: 현재 월의 마지막 날 23:59:59
        const targetDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        
        const diff = targetDate - now;
        
        if (diff <= 0) {
            // 이미 마지막 날이 지났다면 다음 달 마지막 날로 설정
            const nextMonth = currentMonth + 1;
            const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
            const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;
            const nextLastDay = new Date(nextYear, adjustedMonth + 1, 0, 23, 59, 59, 999);
            const nextDiff = nextLastDay - now;
            
            if (nextDiff <= 0) {
                dayEl.textContent = '0일';
                hourEl.textContent = '0';
                minEl.textContent = '0';
                secEl.textContent = '0';
                return;
            }
            
            const days = Math.floor(nextDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((nextDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((nextDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((nextDiff % (1000 * 60)) / 1000);
            
            dayEl.innerHTML = `${days}<span>일</span>`;
            hourEl.textContent = hours;
            minEl.textContent = minutes;
            secEl.textContent = seconds;
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        dayEl.innerHTML = `${days}<span>일</span>`;
        hourEl.textContent = hours;
        minEl.textContent = minutes;
        secEl.textContent = seconds;
    });
}

// 1초마다 카운트다운 업데이트
setInterval(updateCountdown, 1000);
updateCountdown();

// 프로모션 배너 카운트다운 업데이트
function updatePromotionCountdown() {
    const promoDaysEl = document.getElementById('promo-days');
    const promoHoursEl = document.getElementById('promo-hours');
    const promoMinutesEl = document.getElementById('promo-minutes');
    const promoSecondsEl = document.getElementById('promo-seconds');
    
    if (!promoDaysEl || !promoHoursEl || !promoMinutesEl || !promoSecondsEl) return;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // 현재 월의 마지막 날 계산 (다음 달의 0일 = 현재 달의 마지막 날)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // 목표 시간 설정: 현재 월의 마지막 날 23:59:59
    const targetDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    const diff = targetDate - now;
    
    if (diff <= 0) {
        // 이미 마지막 날이 지났다면 다음 달 마지막 날로 설정
        const nextMonth = currentMonth + 1;
        const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
        const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;
        const nextLastDay = new Date(nextYear, adjustedMonth + 1, 0, 23, 59, 59, 999);
        const nextDiff = nextLastDay - now;
        
        if (nextDiff <= 0) {
            promoDaysEl.textContent = '0';
            promoHoursEl.textContent = '0';
            promoMinutesEl.textContent = '0';
            promoSecondsEl.textContent = '0';
            return;
        }
        
        const days = Math.floor(nextDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((nextDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((nextDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((nextDiff % (1000 * 60)) / 1000);
        
        promoDaysEl.textContent = days;
        promoHoursEl.textContent = hours;
        promoMinutesEl.textContent = minutes;
        promoSecondsEl.textContent = seconds;
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    promoDaysEl.textContent = days;
    promoHoursEl.textContent = hours;
    promoMinutesEl.textContent = minutes;
    promoSecondsEl.textContent = seconds;
}

// 1초마다 프로모션 배너 카운트다운 업데이트
setInterval(updatePromotionCountdown, 1000);
updatePromotionCountdown();

// 실시간 할인가 조회 버튼 클릭 이벤트
document.querySelectorAll('.counselBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const maker = btn.dataset.maker;
        const model = btn.dataset.model;
        alert(`${maker} ${model} 실시간 할인가 조회를 위해 설문조사를 진행해주세요.`);
        // 설문조사로 이동하거나 모달 열기
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

