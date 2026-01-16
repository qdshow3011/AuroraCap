export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      const url = new URL(request.url);
      
      if (url.pathname === '/proxy') {
        const targetUrl = url.searchParams.get('url');
        const method = url.searchParams.get('method') || 'GET';
        
        if (!targetUrl) {
          return new Response(JSON.stringify({ error: 'Missing target URL' }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }

        const proxyHeaders = new Headers();
        const originalHeaders = Object.fromEntries(request.headers.entries());
        
        const allowedHeaders = [
          'accept',
          'accept-encoding',
          'accept-language',
          'cache-control',
          'connection',
          'content-type',
          'user-agent',
          'referer',
          'origin'
        ];

        for (const [key, value] of Object.entries(originalHeaders)) {
          if (allowedHeaders.includes(key.toLowerCase())) {
            proxyHeaders.set(key, value);
          }
        }

        const proxyRequest = new Request(targetUrl, {
          method: method,
          headers: proxyHeaders,
          body: method !== 'GET' ? request.body : undefined,
          cf: {
            cacheTtl: 60,
            cacheEverything: false,
            resolveOverride: undefined
          }
        });

        const response = await fetch(proxyRequest);
        
        const responseHeaders = new Headers(corsHeaders);
        const allowedResponseHeaders = [
          'content-type',
          'content-length',
          'content-encoding',
          'cache-control',
          'etag'
        ];

        for (const [key, value] of response.headers.entries()) {
          if (allowedResponseHeaders.includes(key.toLowerCase())) {
            responseHeaders.set(key, value);
          }
        }

        const responseBody = await response.text();
        
        return new Response(responseBody, {
          status: response.status,
          headers: responseHeaders
        });
      }

      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ 
          status: 'ok',
          timestamp: new Date().toISOString(),
          worker: 'financial-data-proxy'
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      return new Response(JSON.stringify({ 
        error: 'Not Found',
        availableEndpoints: ['/proxy', '/health']
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};