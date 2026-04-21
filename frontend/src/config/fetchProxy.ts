import { API_BASE_URL } from './api'

const LEGACY_API_PREFIXES = [
  'http://localhost:3001/api',
  'https://localhost:3001/api',
]

const normalizeBase = (base: string) => base.replace(/\/+$/, '')

const rewriteLegacyUrl = (input: RequestInfo | URL): RequestInfo | URL => {
  const inputAsString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : null

  if (!inputAsString) return input

  for (const legacyPrefix of LEGACY_API_PREFIXES) {
    if (inputAsString.startsWith(legacyPrefix)) {
      const suffix = inputAsString.slice(legacyPrefix.length)
      const nextUrl = `${normalizeBase(API_BASE_URL)}${suffix}`
      return nextUrl
    }
  }

  return input
}

if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch.bind(window)

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const rewritten = rewriteLegacyUrl(input)
    return originalFetch(rewritten as RequestInfo | URL, init)
  }
}
