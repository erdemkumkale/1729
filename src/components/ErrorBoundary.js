import React from 'react'

// Shows the error on screen instead of a blank page, so it can be reported and fixed.
export default class ErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ padding: 24, maxWidth: 560, margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#EDEDEA', background: '#0C0C0B', minHeight: '100vh' }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Bir şeyler ters gitti</h2>
        <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 16 }}>
          Sayfayı yenilemeyi dene. Sorun sürerse aşağıdaki metni bize gönder.
        </p>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14, background: '#1A1A18', padding: 14, borderRadius: 8, marginBottom: 16 }}>
          {String(this.state.error?.message || this.state.error)}
        </pre>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '12px 20px', fontSize: 16, borderRadius: 8, border: 'none', background: '#EDEDEA', color: '#0C0C0B', cursor: 'pointer' }}
        >
          Yenile
        </button>
      </div>
    )
  }
}
