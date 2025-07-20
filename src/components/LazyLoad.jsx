import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaImage } from 'react-icons/fa';

// Lazy Image Component
export const LazyImage = ({ 
  src, 
  alt, 
  placeholder = 'https://via.placeholder.com/400x400/333333/666666?text=Loading...',
  className = '',
  style = {},
  onLoad,
  onError,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (imgRef.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.unobserve(entry.target);
          }
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.1
        }
      );

      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div
      ref={imgRef}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#1a1a1a',
        ...style
      }}
      {...props}
    >
      {!isLoaded && !hasError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#333333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #666666',
              borderTopColor: '#FFFFFF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: isLoaded ? 'block' : 'none'
          }}
        />
      )}

      {hasError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#666666'
        }}>
          <FaImage size={32} style={{ marginBottom: '8px' }} />
          <span style={{ fontSize: '12px' }}>Image not available</span>
        </div>
      )}
    </div>
  );
};

// Lazy Video Component
export const LazyVideo = React.forwardRef(({ 
  src, 
  poster,
  className = '',
  style = {},
  onLoad,
  onError,
  controls = true,
  autoPlay = false,
  muted = true,
  loop = false,
  ...props 
}, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.unobserve(entry.target);
          }
        },
        {
          rootMargin: '100px 0px',
          threshold: 0.1
        }
      );

      observerRef.current.observe(videoRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div
      ref={videoRef}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#1a1a1a',
        ...style
      }}
      {...props}
    >
      {!isLoaded && !hasError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#333333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #666666',
              borderTopColor: '#FFFFFF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {isInView && !hasError && (
        <video
          ref={ref}
          src={src}
          poster={poster}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          onLoadedData={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: isLoaded ? 'block' : 'none'
          }}
        />
      )}

      {hasError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#666666'
        }}>
          <FaPlay size={32} style={{ marginBottom: '8px' }} />
          <span style={{ fontSize: '12px' }}>Video not available</span>
        </div>
      )}
    </div>
  );
});

// Lazy Component Wrapper
export const LazyComponent = ({ 
  children, 
  threshold = 0.1,
  rootMargin = '50px 0px',
  fallback = null,
  ...props 
}) => {
  const [isInView, setIsInView] = useState(false);
  const componentRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (componentRef.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.unobserve(entry.target);
          }
        },
        {
          rootMargin,
          threshold
        }
      );

      observerRef.current.observe(componentRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [rootMargin, threshold]);

  return (
    <div ref={componentRef} {...props}>
      {isInView ? children : fallback}
    </div>
  );
};

// Image with WebP support
export const OptimizedImage = ({ 
  src, 
  webpSrc, 
  alt, 
  ...props 
}) => {
  const [supportsWebP, setSupportsWebP] = useState(false);

  useEffect(() => {
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    };
    setSupportsWebP(checkWebPSupport());
  }, []);

  return (
    <picture>
      {webpSrc && supportsWebP && <source srcSet={webpSrc} type="image/webp" />}
      <LazyImage src={src} alt={alt} {...props} />
    </picture>
  );
};

export default {
  LazyImage,
  LazyVideo,
  LazyComponent,
  OptimizedImage
}; 