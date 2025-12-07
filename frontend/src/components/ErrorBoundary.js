import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container">
          <div className="header">
            <h1>Oops! Something went wrong</h1>
          </div>
          <div className="content" style={{ textAlign: 'center' }}>
            <div className="error active" style={{ marginTop: '20px' }}>
              <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              className="btn"
              onClick={() => window.location.reload()}
              style={{ marginTop: '20px' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
