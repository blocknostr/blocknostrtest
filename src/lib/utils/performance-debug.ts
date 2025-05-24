// Debug utilities for performance testing and verification

import { PerformanceMonitor, createPerformanceComparison } from './performance';

// Create a global performance comparison tool
export const createFeedPerformanceTest = () => {
  const comparison = createPerformanceComparison();
  
  return {
    // Call this before loading the feed
    startBaseline: () => {
      console.log('🔥 Starting baseline performance measurement...');
      return comparison.baseline();
    },
    
    // Call this after virtualization is loaded
    measureOptimized: () => {
      console.log('⚡ Measuring optimized performance...');
      return comparison.optimized();
    },
    
    // Get the comparison results
    getResults: () => {
      const results = comparison.compare();
      console.group('📊 Performance Comparison Results');
      console.log('DOM Node Reduction:', results.domReduction);
      console.log('Memory Change:', results.memoryChange);
      console.log('Current Summary:', results.summary);
      console.groupEnd();
      return results;
    },
    
    // Quick performance snapshot
    snapshot: (label: string = 'snapshot') => {
      const monitor = PerformanceMonitor.getInstance();
      const domNodes = monitor.trackDOMNodes(label);
      const memory = monitor.trackMemory(label);
      
      console.log(`📸 Performance Snapshot [${label}]:`, {
        domNodes,
        memoryMB: memory ? (memory.used / 1024 / 1024).toFixed(2) : 'N/A'
      });
      
      return { domNodes, memory };
    }
  };
};

// Add to window for easy browser console testing
declare global {
  interface Window {
    performanceTest: ReturnType<typeof createFeedPerformanceTest>;
  }
}

// Auto-initialize for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.performanceTest = createFeedPerformanceTest();
  
  console.log(`
🚀 Performance Testing Available!

Use these commands in browser console:
- window.performanceTest.snapshot('my-test') - Take a performance snapshot
- window.performanceTest.startBaseline() - Start baseline measurement
- window.performanceTest.measureOptimized() - Measure after optimization
- window.performanceTest.getResults() - Compare baseline vs optimized

The virtualized feed should show:
✅ 50-70% fewer DOM nodes
✅ Better memory efficiency
✅ Smoother scrolling performance
  `);
}

// Performance testing hook for React components
export const usePerformanceTest = () => {
  return createFeedPerformanceTest();
};

// Helper to verify virtual scrolling is working
export const verifyVirtualScrolling = () => {
  const feedContainer = document.querySelector('[data-testid="virtualized-feed"]') || 
                       document.querySelector('.scrollbar-thin') ||
                       document.querySelector('[style*="height"]');
  
  if (!feedContainer) {
    console.warn('⚠️ Virtual scrolling container not found');
    return false;
  }
  
  const renderedCards = document.querySelectorAll('[data-testid="note-card"]') ||
                       document.querySelectorAll('.message-bubble, .card');
  
  console.log(`🔍 Virtual Scrolling Check:
- Container found: ✅
- Rendered cards: ${renderedCards.length}
- Expected: Only visible cards (5-15) should be rendered
- Status: ${renderedCards.length <= 15 ? '✅ Working' : '⚠️ May need adjustment'}
  `);
  
  return renderedCards.length <= 15;
}; 