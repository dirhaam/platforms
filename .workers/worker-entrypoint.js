// .workers/worker-entrypoint.js
// Custom worker entrypoint that uses Node.js runtime for specific routes

// Import the generated Next.js application
import { handleRequest } from '../.vercel/output/server.js';

// Route patterns that require Node.js runtime
const NODEJS_ROUTES = [
  '/api/',
  '/admin/',
  // Add other route patterns that need Node.js runtime
];

export default {
  /**
   * Main fetch handler for the worker
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Check if this route requires Node.js runtime
    const needsNodeJS = NODEJS_ROUTES.some(pattern => pathname.startsWith(pattern));
    
    if (needsNodeJS) {
      // For routes that need Node.js runtime, we can't run them directly in Edge
      // Instead, we should either:
      // 1. Redirect to a dedicated Node.js worker/service
      // 2. Return an error indicating this route is not available in Edge
      // 3. Use a hybrid approach with D1/R2 for data storage
      
      return new Response(
        JSON.stringify({ 
          error: 'This route requires Node.js runtime and is not available in Edge environment',
          route: pathname,
          suggestion: 'Please use the Node.js deployment or contact administrator'
        }),
        { 
          status: 501, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For routes that can run in Edge, handle normally
    try {
      return await handleRequest(request, env, ctx);
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};