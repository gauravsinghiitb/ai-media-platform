import { useState, useEffect, useCallback, useRef } from 'react';

export const useInfiniteScroll = ({
  data = [],
  itemsPerPage = 10,
  threshold = 100, // pixels from bottom to trigger load
  hasMore = true,
  onLoadMore = () => {},
  loading = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef(null);
  const loadingRef = useRef(null);

  // Calculate displayed items based on current page
  useEffect(() => {
    const endIndex = currentPage * itemsPerPage;
    setDisplayedItems(data.slice(0, endIndex));
  }, [data, currentPage, itemsPerPage]);

  // Intersection Observer for infinite scroll
  const lastElementRef = useCallback(
    (node) => {
      if (loading || isLoadingMore) return;
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
            setIsLoadingMore(true);
            setCurrentPage(prev => prev + 1);
            
            // Call onLoadMore if provided
            if (onLoadMore) {
              onLoadMore(currentPage + 1);
            }
            
            // Reset loading state after a delay
            setTimeout(() => {
              setIsLoadingMore(false);
            }, 1000);
          }
        },
        {
          rootMargin: `${threshold}px`
        }
      );

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [loading, isLoadingMore, hasMore, currentPage, onLoadMore, threshold]
  );

  // Reset pagination when data changes
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setDisplayedItems([]);
    setIsLoadingMore(false);
  }, []);

  // Manual load more function
  const loadMore = useCallback(() => {
    if (!loading && !isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
      
      if (onLoadMore) {
        onLoadMore(currentPage + 1);
      }
      
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 1000);
    }
  }, [loading, isLoadingMore, hasMore, currentPage, onLoadMore]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    displayedItems,
    currentPage,
    isLoadingMore,
    hasMore,
    lastElementRef,
    resetPagination,
    loadMore
  };
};

// Hook for scroll-based infinite scroll (alternative to intersection observer)
export const useScrollInfiniteScroll = ({
  data = [],
  itemsPerPage = 10,
  hasMore = true,
  onLoadMore = () => {},
  loading = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Calculate displayed items based on current page
  useEffect(() => {
    const endIndex = currentPage * itemsPerPage;
    setDisplayedItems(data.slice(0, endIndex));
  }, [data, currentPage, itemsPerPage]);

  // Scroll event handler
  const handleScroll = useCallback(() => {
    if (loading || isLoadingMore || !hasMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Load more when user is near bottom
    if (scrollTop + windowHeight >= documentHeight - 200) {
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
      
      if (onLoadMore) {
        onLoadMore(currentPage + 1);
      }
      
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 1000);
    }
  }, [loading, isLoadingMore, hasMore, currentPage, onLoadMore]);

  // Add scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Reset pagination when data changes
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setDisplayedItems([]);
    setIsLoadingMore(false);
  }, []);

  return {
    displayedItems,
    currentPage,
    isLoadingMore,
    hasMore,
    resetPagination
  };
};

// Hook for video feed infinite scroll
export const useVideoInfiniteScroll = ({
  videos = [],
  onLoadMore = () => {},
  loading = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedVideos, setDisplayedVideos] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Update displayed videos
  useEffect(() => {
    setDisplayedVideos(videos.slice(0, currentIndex + 5)); // Show 5 videos ahead
  }, [videos, currentIndex]);

  // Load more videos when approaching end
  const loadMoreVideos = useCallback(() => {
    if (!loading && !isLoadingMore && currentIndex + 5 >= videos.length) {
      setIsLoadingMore(true);
      onLoadMore();
      
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 1000);
    }
  }, [loading, isLoadingMore, currentIndex, videos.length, onLoadMore]);

  // Update current index
  const updateCurrentIndex = useCallback((index) => {
    setCurrentIndex(index);
    loadMoreVideos();
  }, [loadMoreVideos]);

  return {
    displayedVideos,
    currentIndex,
    isLoadingMore,
    updateCurrentIndex,
    loadMoreVideos
  };
};

export default {
  useInfiniteScroll,
  useScrollInfiniteScroll,
  useVideoInfiniteScroll
}; 