// 설문조사 데이터 저장
const surveyData = {
    productType: null,
    vehicle: null,
    period: null,
    deposit: null,
    personalInfo: {}
};

let currentStep = 1;
const totalSteps = 5;

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
        
        // 무보증 선택 시 바로 다음 단계로 진행 가능
        if (card.dataset.deposit === 'none') {
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
    } else if (depositType === 'advance' && advanceAmountInput) {
        hasValue = advanceAmountInput.value.trim().length > 0;
    }
    
    step4NextBtn.disabled = !hasValue;
    
    if (hasValue) {
        if (depositType === 'deposit') {
            surveyData.depositAmount = depositAmountInput.value;
        } else if (depositType === 'advance') {
            surveyData.advanceAmount = advanceAmountInput.value;
        }
    }
}

depositAmountInput?.addEventListener('input', checkDepositInput);
advanceAmountInput?.addEventListener('input', checkDepositInput);

step4NextBtn?.addEventListener('click', () => {
    // STEP 4에서 다음단계를 누르면 완료 화면으로 이동
    // 여기서 실제로 서버로 데이터를 전송할 수 있습니다
    console.log('설문조사 데이터:', surveyData);
    goToNextStep();
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
    if (depositAmountInput) {
        depositAmountInput.value = '';
    }
    if (advanceAmountInput) {
        advanceAmountInput.value = '';
    }
    
    // 다음 버튼 비활성화
    const nextButtons = document.querySelectorAll('.next-btn, .next-step-btn');
    nextButtons.forEach(btn => {
        btn.disabled = true;
    });
    
    updateStepDisplay();
}

// 개인정보 처리방침 링크
const privacyCheckbox = document.querySelector('input[name="privacy"]');
const thirdPartyCheckbox = document.querySelector('input[name="third-party"]');
const marketingCheckbox = document.querySelector('input[name="marketing"]');

if (privacyCheckbox) {
    privacyCheckbox.addEventListener('click', (e) => {
        if (!privacyCheckbox.checked) {
            e.preventDefault();
            openModal('privacyModal');
            const modal = document.getElementById('privacyModal');
            const modalClose = modal.querySelector('.modal-close');
            const closeHandler = () => {
                privacyCheckbox.checked = true;
            };
            modalClose.addEventListener('click', closeHandler, { once: true });
        }
    });
}

if (thirdPartyCheckbox) {
    thirdPartyCheckbox.addEventListener('click', (e) => {
        if (!thirdPartyCheckbox.checked) {
            e.preventDefault();
            openModal('thirdPartyModal');
            const modal = document.getElementById('thirdPartyModal');
            const modalClose = modal.querySelector('.modal-close');
            const closeHandler = () => {
                thirdPartyCheckbox.checked = true;
            };
            modalClose.addEventListener('click', closeHandler, { once: true });
        }
    });
}

if (marketingCheckbox) {
    marketingCheckbox.addEventListener('click', (e) => {
        if (!marketingCheckbox.checked) {
            e.preventDefault();
            openModal('marketingModal');
            const modal = document.getElementById('marketingModal');
            const modalClose = modal.querySelector('.modal-close');
            const closeHandler = () => {
                marketingCheckbox.checked = true;
            };
            modalClose.addEventListener('click', closeHandler, { once: true });
        }
    });
}

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

const modalCloses = document.querySelectorAll('.modal-close');
modalCloses.forEach(close => {
    close.addEventListener('click', () => {
        const modal = close.closest('.modal');
        if (modal) closeModal(modal);
    });
});

const modals = document.querySelectorAll('.modal');
modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
});

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
        
        // 목표 시간 설정 (30일 후)
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 30);
        targetDate.setHours(1, 15, 39, 0);
        
        const now = new Date();
        const diff = targetDate - now;
        
        if (diff <= 0) {
            dayEl.textContent = '0일';
            hourEl.textContent = '0';
            minEl.textContent = '0';
            secEl.textContent = '0';
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
    
    // 목표 시간 설정 (30일 후)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    targetDate.setHours(1, 15, 39, 0);
    
    const now = new Date();
    const diff = targetDate - now;
    
    if (diff <= 0) {
        promoDaysEl.textContent = '0';
        promoHoursEl.textContent = '0';
        promoMinutesEl.textContent = '0';
        promoSecondsEl.textContent = '0';
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

