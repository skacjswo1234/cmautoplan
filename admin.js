// 관리자 페이지 JavaScript

let currentPage = 1;
let currentTab = 'all';
let currentStatusFilter = '';

// 로그인 상태 확인
const isLoggedIn = () => {
    return sessionStorage.getItem('adminLoggedIn') === 'true';
};

// 로그인 화면 표시
const showLoginScreen = () => {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    sessionStorage.removeItem('adminLoggedIn');
};

// 관리자 대시보드 표시
const showAdminDashboard = () => {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
    loadInquiries();
};

// 초기화
if (isLoggedIn()) {
    showAdminDashboard();
} else {
    showLoginScreen();
}

// 로그인 폼 제출
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password }),
        });

        const result = await response.json();

        if (result.success) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            showAdminDashboard();
        } else {
            errorDiv.textContent = result.error || '로그인에 실패했습니다.';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = '로그인 중 오류가 발생했습니다.';
        errorDiv.classList.add('show');
    }
});

// 로그아웃
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('로그아웃 하시겠습니까?')) {
        showLoginScreen();
        document.getElementById('password').value = '';
    }
});

// 모바일 메뉴 토글
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const adminSidebar = document.getElementById('adminSidebar');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

const openMobileMenu = () => {
    if (adminSidebar && sidebarOverlay && mobileMenuBtn) {
        adminSidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        mobileMenuBtn.style.display = 'none';
        document.body.style.overflow = 'hidden';
    }
};

const closeMobileMenu = () => {
    if (adminSidebar && sidebarOverlay && mobileMenuBtn) {
        adminSidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        if (window.innerWidth <= 768) {
            mobileMenuBtn.style.display = 'flex';
        }
        document.body.style.overflow = '';
    }
};

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openMobileMenu();
    });
}

if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMobileMenu();
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileMenu);
}

// 네비게이션
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        
        // 네비게이션 활성화
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // 페이지 전환
        document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}Page`).classList.add('active');

        // 모바일에서 메뉴 닫기
        if (window.innerWidth <= 768) {
            closeMobileMenu();
        }
    });
});

// 탭 전환
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        currentPage = 1;
        loadInquiries();
    });
});

// 상태 필터
document.getElementById('statusFilter').addEventListener('change', (e) => {
    currentStatusFilter = e.target.value;
    currentPage = 1;
    loadInquiries();
});

// 새로고침
document.getElementById('refreshBtn').addEventListener('click', () => {
    loadInquiries();
});

// 문의 목록 로드
async function loadInquiries() {
    const tbody = document.getElementById('inquiriesTableBody');
    tbody.innerHTML = '<tr><td colspan="10" class="loading">로딩 중...</td></tr>';

    try {
        let url = `/api/estimates?limit=20&offset=${(currentPage - 1) * 20}`;
        
        // 탭과 필터 적용
        const status = currentTab !== 'all' ? currentTab : currentStatusFilter;
        if (status) {
            url += `&status=${status}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            displayInquiries(result.data);
        } else {
            tbody.innerHTML = '<tr><td colspan="12" class="loading">데이터를 불러오는데 실패했습니다.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading inquiries:', error);
        tbody.innerHTML = '<tr><td colspan="12" class="loading">오류가 발생했습니다.</td></tr>';
    }
}

// 문의 목록 표시
function displayInquiries(data) {
    const tbody = document.getElementById('inquiriesTableBody');
    const mobileCardList = document.getElementById('mobileCardList');
    const isMobile = window.innerWidth <= 768;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="loading">데이터가 없습니다.</td></tr>';
        if (mobileCardList) {
            mobileCardList.innerHTML = '<div class="loading">데이터가 없습니다.</div>';
        }
        return;
    }
    
    // URL 표시 함수 (긴 URL은 잘라서 표시)
    const formatUrl = (url) => {
        if (!url || url.trim() === '') return '-';
        // URL이 50자 이상이면 잘라서 표시
        if (url.length > 50) {
            return url.substring(0, 50) + '...';
        }
        return url;
    };

    const productType = (type) => type === 'rent' ? '장기렌트' : '리스';
    const depositType = (type) => {
        const types = {
            'none': '무보증',
            'deposit': '보증금',
            'advance': '선수금'
        };
        return types[type] || type;
    };
    
    const statusText = (status) => {
        const statuses = {
            'pending': '대기중',
            'contacted': '연락완료',
            'completed': '완료',
            'cancelled': '취소'
        };
        return statuses[status] || status;
    };
    
    const trafficSourceText = (source) => {
        const sources = {
            'danggeun': '당근',
            'direct': '직접유입',
            'search': '검색엔진',
            'other': '기타',
            null: '-',
            undefined: '-',
            '': '-'
        };
        return sources[source] || '-';
    };

    const formattedDate = (dateString) => {
        if (!dateString) return '-';
        
        try {
            // 서버에서 이미 한국 시간으로 변환된 날짜를 포맷팅
            // 형식: "2025-12-04 16:52:00"
            const date = new Date(dateString);
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}. ${month}. ${day}. ${hours}:${minutes}`;
        } catch (error) {
            console.error('날짜 포맷팅 오류:', error, dateString);
            return dateString;
        }
    };

    // 데스크톱 테이블
    tbody.innerHTML = data.map(item => {
        return `
            <tr>
                <td>${item.id}</td>
                <td>${item.name || '-'}</td>
                <td>${productType(item.product_type)}</td>
                <td>${item.vehicle}</td>
                <td>${item.phone}</td>
                <td>${depositType(item.deposit_type)}</td>
                <td>${item.deposit_amount || '-'}</td>
                <td><span class="status-badge ${item.status}">${statusText(item.status)}</span></td>
                <td>${formattedDate(item.created_at)}</td>
                <td>${trafficSourceText(item.traffic_source)}</td>
                <td title="${item.source_url || '-'}">
                    <span style="cursor: help; text-decoration: underline; color: #0066cc;">
                        ${formatUrl(item.source_url)}
                    </span>
                </td>
                <td>
                    <button class="btn-action" onclick="openStatusModal(${item.id}, '${item.status}')">상태변경</button>
                    <button class="btn-action btn-delete" onclick="deleteInquiry(${item.id})">삭제</button>
                </td>
            </tr>
        `;
    }).join('');

    // 모바일 카드 리스트
    if (mobileCardList) {
        mobileCardList.innerHTML = data.map(item => {
            return `
                <div class="inquiry-card">
                    <div class="inquiry-card-header">
                        <span class="inquiry-card-id">#${item.id}</span>
                        <span class="status-badge ${item.status}">${statusText(item.status)}</span>
                    </div>
                    <div class="inquiry-card-field">
                        <span class="inquiry-card-label">성함</span>
                        <span class="inquiry-card-value">${item.name || '-'}</span>
                    </div>
                    <div class="inquiry-card-field">
                        <span class="inquiry-card-label">상품유형</span>
                        <span class="inquiry-card-value">${productType(item.product_type)}</span>
                    </div>
                    <div class="inquiry-card-field">
                        <span class="inquiry-card-label">차량명</span>
                        <span class="inquiry-card-value">${item.vehicle}</span>
                    </div>
                    <div class="inquiry-card-field">
                        <span class="inquiry-card-label">연락처</span>
                        <span class="inquiry-card-value">${item.phone}</span>
                    </div>
                    <div class="inquiry-card-field">
                        <span class="inquiry-card-label">보증금유형</span>
                        <span class="inquiry-card-value">${depositType(item.deposit_type)}</span>
                    </div>
                    ${item.deposit_amount ? `
                    <div class="inquiry-card-field">
                        <span class="inquiry-card-label">보증금금액</span>
                        <span class="inquiry-card-value">${item.deposit_amount}</span>
                    </div>
                    ` : ''}
                    <div class="inquiry-card-field">
                        <span class="inquiry-card-label">신청일시</span>
                        <span class="inquiry-card-value">${formattedDate(item.created_at)}</span>
                    </div>
                    <div class="inquiry-card-field">
                        <span class="inquiry-card-label">유입경로</span>
                        <span class="inquiry-card-value">${trafficSourceText(item.traffic_source)}</span>
                    </div>
                    ${item.source_url ? `
                    <div class="inquiry-card-field">
                        <span class="inquiry-card-label">유입URL</span>
                        <span class="inquiry-card-value" style="word-break: break-all; font-size: 0.85em; color: #666;">
                            ${item.source_url}
                        </span>
                    </div>
                    ` : ''}
                    <div class="inquiry-card-actions">
                        <button class="btn-action" onclick="openStatusModal(${item.id}, '${item.status}')">상태변경</button>
                        <button class="btn-action btn-delete" onclick="deleteInquiry(${item.id})">삭제</button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// 상태 변경 모달 열기
function openStatusModal(id, currentStatus) {
    document.getElementById('estimateId').value = id;
    document.getElementById('statusSelect').value = currentStatus;
    document.getElementById('statusModal').classList.add('active');
}

// 상태 변경 모달 닫기
document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('statusModal').classList.remove('active');
});

document.getElementById('cancelStatusBtn').addEventListener('click', () => {
    document.getElementById('statusModal').classList.remove('active');
});

// 상태 변경 폼 제출
document.getElementById('statusForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('estimateId').value;
    const status = document.getElementById('statusSelect').value;

    try {
        const response = await fetch(`/api/estimates/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });

        const result = await response.json();

        if (result.success) {
            document.getElementById('statusModal').classList.remove('active');
            loadInquiries();
        } else {
            alert(result.error || '상태 변경에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('오류가 발생했습니다.');
    }
});

// 비밀번호 변경 폼 제출
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    const errorDiv = document.getElementById('passwordError');
    const successDiv = document.getElementById('passwordSuccess');

    // 에러 메시지 초기화
    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');

    // 새 비밀번호 확인
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = '새 비밀번호가 일치하지 않습니다.';
        errorDiv.classList.add('show');
        return;
    }

    try {
        const response = await fetch('/api/admin/password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        const result = await response.json();

        if (result.success) {
            successDiv.textContent = result.message || '비밀번호가 변경되었습니다.';
            successDiv.classList.add('show');
            
            // 폼 초기화
            document.getElementById('passwordForm').reset();
            
            // 3초 후 메시지 숨기기
            setTimeout(() => {
                successDiv.classList.remove('show');
            }, 3000);
        } else {
            errorDiv.textContent = result.error || '비밀번호 변경에 실패했습니다.';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        errorDiv.textContent = '오류가 발생했습니다.';
        errorDiv.classList.add('show');
    }
});

// 모달 배경 클릭 시 닫기
document.getElementById('statusModal').addEventListener('click', (e) => {
    if (e.target.id === 'statusModal') {
        e.target.classList.remove('active');
    }
});

// 문의 삭제 함수
async function deleteInquiry(id) {
    if (!confirm('정말로 이 문의를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) {
        return;
    }

    try {
        const response = await fetch(`/api/estimates/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        if (result.success) {
            alert('문의가 삭제되었습니다.');
            loadInquiries();
        } else {
            alert(result.error || '삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error deleting inquiry:', error);
        alert('오류가 발생했습니다.');
    }
}

// 윈도우 리사이즈 시 모바일 메뉴 닫기
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeMobileMenu();
    }
});

