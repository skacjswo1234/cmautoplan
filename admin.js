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
    tbody.innerHTML = '<tr><td colspan="9" class="loading">로딩 중...</td></tr>';

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
            tbody.innerHTML = '<tr><td colspan="9" class="loading">데이터를 불러오는데 실패했습니다.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading inquiries:', error);
        tbody.innerHTML = '<tr><td colspan="9" class="loading">오류가 발생했습니다.</td></tr>';
    }
}

// 문의 목록 표시
function displayInquiries(data) {
    const tbody = document.getElementById('inquiriesTableBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading">데이터가 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => {
        const productType = item.product_type === 'rent' ? '장기렌트' : '리스';
        const depositType = {
            'none': '무보증',
            'deposit': '보증금',
            'advance': '선수금'
        }[item.deposit_type] || item.deposit_type;
        
        const statusText = {
            'pending': '대기중',
            'contacted': '연락완료',
            'completed': '완료',
            'cancelled': '취소'
        }[item.status] || item.status;

        const formattedDate = new Date(item.created_at).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <tr>
                <td>${item.id}</td>
                <td>${productType}</td>
                <td>${item.vehicle}</td>
                <td>${item.phone}</td>
                <td>${depositType}</td>
                <td>${item.deposit_amount || '-'}</td>
                <td><span class="status-badge ${item.status}">${statusText}</span></td>
                <td>${formattedDate}</td>
                <td>
                    <button class="btn-action" onclick="openStatusModal(${item.id}, '${item.status}')">상태변경</button>
                </td>
            </tr>
        `;
    }).join('');
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

