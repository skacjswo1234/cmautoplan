// Cloudflare Pages Functions API
// POST /api/admin/login - 관리자 로그인

import type { Env } from '../../types';

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context;
  
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return new Response(
        JSON.stringify({ success: false, error: '비밀번호를 입력해주세요.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const db = env['cmautoplan-db'];
    
    // 관리자 비밀번호 조회
    const admin = await db.prepare(
      'SELECT id, password FROM admin LIMIT 1'
    ).first();

    if (!admin) {
      return new Response(
        JSON.stringify({ success: false, error: '관리자 계정이 없습니다.' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 비밀번호 비교 (단순 비교)
    if (admin.password !== password) {
      return new Response(
        JSON.stringify({ success: false, error: '비밀번호가 일치하지 않습니다.' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 로그인 성공 (실제로는 JWT 토큰 등을 발급해야 함)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '로그인 성공',
        adminId: admin.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error during login:', error);
    return new Response(
      JSON.stringify({ success: false, error: '서버 오류가 발생했습니다.' }),
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

