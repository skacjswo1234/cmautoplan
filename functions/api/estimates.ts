// Cloudflare Pages Functions API
// POST /api/estimates - 견적 신청 생성
// GET /api/estimates - 견적 신청 목록 조회 (관리자용)

// Cloudflare Pages Functions 타입 정의
interface Env {
  'cmautoplan-db': D1Database;
}

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context;
  
  try {
    // CORS 헤더 설정
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // OPTIONS 요청 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 요청 본문 파싱
    const body = await request.json();
    
    // 필수 필드 추출 및 기본값 설정
    const { productType, vehicle, phone, name, deposit, depositAmount, advanceAmount, privacyConsent, thirdPartyConsent, marketingConsent, trafficSource } = body;
    
    // productType과 deposit이 null이거나 없을 경우 기본값 설정
    const finalProductType = productType || 'rent';
    const finalDeposit = deposit || 'none';
    
    // 필수 필드 검증 (vehicle, phone, name은 반드시 필요)
    if (!vehicle || !phone || !name) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '필수 필드가 누락되었습니다.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 개인정보 동의 확인
    if (!privacyConsent || !thirdPartyConsent) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '개인정보 수집·이용 및 제3자 제공 동의는 필수입니다.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 핸드폰 번호 유효성 검사 (10-11자리 숫자)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone.replace(/[^0-9]/g, ''))) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '올바른 핸드폰 번호를 입력해주세요.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 보증금/선수금 금액 설정
    let finalDepositAmount = null;
    if (finalDeposit === 'deposit' && depositAmount) {
      finalDepositAmount = depositAmount;
    } else if (finalDeposit === 'advance' && advanceAmount) {
      finalDepositAmount = advanceAmount;
    }

    // D1 데이터베이스에 삽입
    const db = env['cmautoplan-db'];
    
    // 유입 경로 처리 (null 또는 빈 값이면 null로 저장)
    const finalTrafficSource = trafficSource && trafficSource.trim() !== '' ? trafficSource.trim() : null;

    const result = await db.prepare(
      `INSERT INTO estimates (product_type, vehicle, phone, name, deposit_type, deposit_amount, privacy_consent, third_party_consent, marketing_consent, traffic_source, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).bind(
      finalProductType,
      vehicle,
      phone.replace(/[^0-9]/g, ''), // 숫자만 저장
      name,
      finalDeposit,
      finalDepositAmount,
      privacyConsent ? 1 : 0,
      thirdPartyConsent ? 1 : 0,
      marketingConsent ? 1 : 0,
      finalTrafficSource
    ).run();

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: result.meta.last_row_id,
        message: '견적 신청이 완료되었습니다.' 
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error creating estimate:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '서버 오류가 발생했습니다.' 
      }),
      { 
        status: 500, 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
}

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context;
  
  try {
    const db = env['cmautoplan-db'];
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const status = url.searchParams.get('status');

    let query = 'SELECT * FROM estimates';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).all();

    // UTC 시간을 한국 시간(UTC+9)으로 변환하는 함수
    const convertToKoreaTime = (dateString: string | null): string | null => {
      if (!dateString) return null;
      
      try {
        // UTC 시간을 Date 객체로 변환
        const utcDate = new Date(dateString);
        
        // UTC 시간에 9시간(한국 시간대) 추가
        const koreaTime = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
        
        // YYYY-MM-DD HH:mm:ss 형식으로 변환
        const year = koreaTime.getUTCFullYear();
        const month = String(koreaTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(koreaTime.getUTCDate()).padStart(2, '0');
        const hours = String(koreaTime.getUTCHours()).padStart(2, '0');
        const minutes = String(koreaTime.getUTCMinutes()).padStart(2, '0');
        const seconds = String(koreaTime.getUTCSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } catch (error) {
        console.error('날짜 변환 오류:', error);
        return dateString;
      }
    };

    // 결과 데이터의 날짜를 한국 시간으로 변환
    const convertedData = result.results.map((item: any) => ({
      ...item,
      created_at: convertToKoreaTime(item.created_at),
      updated_at: convertToKoreaTime(item.updated_at)
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: convertedData,
        count: convertedData.length 
      }),
      { 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error fetching estimates:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '서버 오류가 발생했습니다.' 
      }),
      { 
        status: 500, 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
}

