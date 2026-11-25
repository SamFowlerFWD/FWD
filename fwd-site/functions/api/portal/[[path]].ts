// Cloudflare Pages Function: everything under /api/portal/*
// The client area API. The code lives in server/portal/router.ts.
import { handle } from '../../../server/portal/router';

export const onRequest = handle;
