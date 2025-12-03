// Cloudflare Pages Functions API
// GET /api/estimates/[id] - 특정 견적 신청 조회
// PATCH /api/estimates/[id] - 견적 신청 상태 업데이트 (관리자용)
// DELETE /api/estimates/[id] - 견적 신청 삭제 (관리자용)

// Cloudflare Pages Functions 타입 정의
interface Env {
  'cmautoplan-db': D1Database;
}

export async function onRequestGet(
  context: { env: Env; request: Request; params: { id: string } }
): Promise<Response> {
  const { env, params } = context;
  
  try {
    const db = env['cmautoplan-db'];
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return new Response(
        JSON.stringify({ success: false, error: '잘못된 ID입니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await db.prepare(
      'SELECT * FROM estimates WHERE id = ?'
    ).bind(id).first();

    if (!result) {
      return new Response(
        JSON.stringify({ success: false, error: '견적 신청을 찾을 수 없습니다.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching estimate:', error);
    return new Response(
      JSON.stringify({ success: false, error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestPatch(
  context: { env: Env; request: Request; params: { id: string } }
): Promise<Response> {
  const { env, request, params } = context;
  
  try {
    const db = env['cmautoplan-db'];
    const id = parseInt(params.id);
    const body = await request.json();

    if (isNaN(id)) {
      return new Response(
        JSON.stringify({ success: false, error: '잘못된 ID입니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 업데이트할 필드만 처리
    const updates: string[] = [];
    const values: any[] = [];

    if (body.status) {
      updates.push('status = ?');
      values.push(body.status);
    }

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: '업데이트할 필드가 없습니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await db.prepare(
      `UPDATE estimates SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return new Response(
      JSON.stringify({ success: true, message: '업데이트되었습니다.' }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating estimate:', error);
    return new Response(
      JSON.stringify({ success: false, error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestDelete(
  context: { env: Env; request: Request; params: { id: string } }
): Promise<Response> {
  const { env, params } = context;
  
  try {
    const db = env['cmautoplan-db'];
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return new Response(
        JSON.stringify({ success: false, error: '잘못된 ID입니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 먼저 존재하는지 확인
    const checkResult = await db.prepare(
      'SELECT id FROM estimates WHERE id = ?'
    ).bind(id).first();

    if (!checkResult) {
      return new Response(
        JSON.stringify({ success: false, error: '견적 신청을 찾을 수 없습니다.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 삭제 실행
    await db.prepare(
      'DELETE FROM estimates WHERE id = ?'
    ).bind(id).run();

    return new Response(
      JSON.stringify({ success: true, message: '삭제되었습니다.' }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error deleting estimate:', error);
    return new Response(
      JSON.stringify({ success: false, error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

