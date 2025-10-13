// .workers/index.js
// Cloudflare Workers entry point for Node.js Runtime

import { handleRequest } from './handler';

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  }
};