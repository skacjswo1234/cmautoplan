// Cloudflare Pages Function for /admin route
interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  
  // Use ASSETS to fetch admin.html
  const adminRequest = new Request(new URL('/admin.html', request.url));
  return env.ASSETS.fetch(adminRequest);
}

