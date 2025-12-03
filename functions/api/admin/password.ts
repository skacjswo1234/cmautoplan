// Cloudflare Pages Functions API
// POST /api/admin/password - 관리자 비밀번호 변경

interface Env {
  'cmautoplan-db': D1Database;
}

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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: '모든 필드를 입력해주세요.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const db = env['cmautoplan-db'];
    
    // 현재 비밀번호 확인
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

    // 현재 비밀번호 확인
    if (admin.password !== currentPassword) {
      return new Response(
        JSON.stringify({ success: false, error: '현재 비밀번호가 일치하지 않습니다.' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 비밀번호 변경
    await db.prepare(
      'UPDATE admin SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(newPassword, admin.id).run();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '비밀번호가 변경되었습니다.' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error changing password:', error);
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

