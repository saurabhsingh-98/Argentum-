'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    } else {
      console.error(JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
      }))
    }
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#050505', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '12px' }}>
            Critical Error
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', maxWidth: '360px', lineHeight: 1.6, marginBottom: '32px' }}>
            {error.message || 'A critical error occurred. Please refresh the page.'}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '10px 24px',
              borderRadius: '9999px',
              background: '#C0C0C0',
              color: '#050505',
              fontSize: '10px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          {error.digest && (
            <p style={{ marginTop: '24px', fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
