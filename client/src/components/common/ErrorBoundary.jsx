import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          fontFamily: 'sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Đã có lỗi xảy ra.</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>Rất xin lỗi vì sự bất tiện này. Vui lòng tải lại trang hoặc quay lại sau.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              padding: '10px 24px', 
              cursor: 'pointer',
              backgroundColor: '#ff5a5f',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
