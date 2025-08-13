/**
 * Utilidades de performance y optimización
 */

/**
 * Debounce para reducir llamadas frecuentes
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle para limitar frecuencia de ejecución
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Cache simple con TTL
 */
export class SimpleCache {
  constructor(ttl = 300000) { // 5 minutos por defecto
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    const expiresAt = Date.now() + this.ttl;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Retry con backoff exponencial
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Medidor de performance
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  start(label) {
    this.metrics.set(label, performance.now());
  }

  end(label) {
    const startTime = this.metrics.get(label);
    if (!startTime) {
      console.warn(`No se encontró métrica para: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(label);
    
    console.log(`${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  measure(label, fn) {
    return async (...args) => {
      this.start(label);
      try {
        const result = await fn(...args);
        this.end(label);
        return result;
      } catch (error) {
        this.end(label);
        throw error;
      }
    };
  }
}

/**
 * Lazy loading de componentes
 */
export const lazyLoadComponent = (importFunc, fallback = null) => {
  const LazyComponent = React.lazy(importFunc);
  
  return (props) => (
    <React.Suspense fallback={fallback || <div>Cargando...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

/**
 * Hook para detectar visibilidad del componente
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options]);

  return [setElement, isIntersecting];
};

export default {
  debounce,
  throttle,
  SimpleCache,
  retryWithBackoff,
  PerformanceMonitor,
  lazyLoadComponent,
  useIntersectionObserver
};
