import React, { useEffect, useState } from 'react';

// Debug component to help verify virtual scrolling is working
const VirtualScrollDebug: React.FC = () => {
  const [stats, setStats] = useState({
    totalCards: 0,
    renderedCards: 0,
    domNodes: 0,
    scrollPosition: 0,
    fixedHeight: 0,
    feedHeight: 0,
    worldChatHeight: 0
  });

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const updateStats = () => {
      // Count total cards vs rendered cards
      const virtualContainer = document.querySelector('.react-window-list') || 
                              document.querySelector('[style*="height"]');
      
      const allCards = document.querySelectorAll('[style*="position: absolute"]');
      const visibleCards = document.querySelectorAll('.card, [class*="card"]');
      const totalDomNodes = document.querySelectorAll('*').length;
      
      const scrollPosition = virtualContainer?.scrollTop || 0;
      
      // Check if items have consistent heights
      const itemElements = document.querySelectorAll('[style*="height: 280px"]');
      const constrainedContainers = document.querySelectorAll('.h-\\[268px\\]');
      const fixedHeight = itemElements.length + constrainedContainers.length;

      // Get feed height from VirtualizedFeed container
      const feedContainer = document.querySelector('.react-window-list');
      const feedHeight = feedContainer ? feedContainer.clientHeight : 0;

      // Calculate WorldChat height (within sidebar after search + crypto sections)
      const sidebarAvailableHeight = window.innerHeight - 56; // h-[calc(100vh-3.5rem)]
      const worldChatHeight = sidebarAvailableHeight - 60 - 160 - 24; // minus search, crypto, spacing

      setStats({
        totalCards: 100, // Assuming we have ~100 posts
        renderedCards: allCards.length,
        domNodes: totalDomNodes,
        scrollPosition: Math.round(scrollPosition),
        fixedHeight: fixedHeight,
        feedHeight: feedHeight,
        worldChatHeight: worldChatHeight
      });
    };

    // Update stats periodically
    const interval = setInterval(updateStats, 1000);
    
    // Update on scroll
    const virtualContainer = document.querySelector('.react-window-list');
    if (virtualContainer) {
      virtualContainer.addEventListener('scroll', updateStats);
    }

    return () => {
      clearInterval(interval);
      if (virtualContainer) {
        virtualContainer.removeEventListener('scroll', updateStats);
      }
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  const isOptimized = stats.renderedCards <= 20;
  const hasFixedHeight = stats.fixedHeight > 0;
  const heightsAligned = Math.abs(stats.feedHeight - stats.worldChatHeight) <= 10; // Within 10px tolerance

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs font-mono z-50 border border-gray-600">
      <div className="font-bold mb-2 text-blue-400">🚀 Virtual Scroll Debug</div>
      <div>Rendered: {stats.renderedCards} / ~{stats.totalCards}</div>
      <div>DOM Nodes: {stats.domNodes.toLocaleString()}</div>
      <div>Scroll: {stats.scrollPosition}px</div>
      <div>Fixed Height Items: {stats.fixedHeight}</div>
      <div>Feed Height: {stats.feedHeight}px</div>
      <div>WorldChat Height: {stats.worldChatHeight}px</div>
      <div className={`mt-1 ${isOptimized ? 'text-green-400' : 'text-yellow-400'}`}>
        Virtual: {isOptimized ? '✅ Optimized' : '⚠️ Check Config'}
      </div>
      <div className={`${hasFixedHeight ? 'text-green-400' : 'text-red-400'}`}>
        Spacing: {hasFixedHeight ? '✅ Consistent' : '❌ Variable'}
      </div>
      <div className={`${heightsAligned ? 'text-green-400' : 'text-yellow-400'}`}>
        Alignment: {heightsAligned ? '✅ Aligned' : '⚠️ Check Heights'}
      </div>
    </div>
  );
};

export default VirtualScrollDebug; 