// /middleware.ts  (or /src/middleware.ts)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
    const auth = req.headers.get('authorization') ?? ''

    const expected1 = 'Basic ' + (globalThis.btoa ? globalThis.btoa('ai:moath') : Buffer.from('ai:moath').toString('base64'))
    const expected2 = 'Basic ' + (globalThis.btoa ? globalThis.btoa('ai:faisal') : Buffer.from('ai:faisal').toString('base64'))

    if (auth === expected1 || auth === expected2) return NextResponse.next()

    return new Response('Auth required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Protected"' },
    })
}
