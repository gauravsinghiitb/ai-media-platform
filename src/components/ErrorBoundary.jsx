import React from 'react';
import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/explore';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#000000',
          color: '#FFFFFF',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'Arial, sans-serif'
        }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
              borderRadius: '16px',
              padding: '40px',
              border: '1px solid #333333',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              maxWidth: '500px',
              width: '100%'
            }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                fontSize: '64px',
                marginBottom: '20px',
                color: '#FF6B6B'
              }}
            >
              <FaExclamationTriangle />
            </motion.div>
            
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#FFFFFF'
            }}>
              Oops! Something went wrong
            </h1>
            
            <p style={{
              fontSize: '16px',
              color: '#CCCCCC',
              marginBottom: '30px',
              lineHeight: '1.5'
            }}>
              We encountered an unexpected error. Don't worry, our team has been notified and is working to fix it.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                background: '#1a1a1a',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #333333',
                textAlign: 'left'
              }}>
                <summary style={{ cursor: 'pointer', color: '#FFFFFF', fontWeight: '600' }}>
                  Error Details (Development)
                </summary>
                <pre style={{
                  color: '#CCCCCC',
                  fontSize: '12px',
                  marginTop: '10px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleRefresh}
                style={{
                  background: '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FaHome size={14} />
                Try Again
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleGoHome}
                style={{
                  background: 'transparent',
                  color: '#FFFFFF',
                  border: '1px solid #666666',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FaHome size={14} />
                Go Home
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 