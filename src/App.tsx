import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AlephiumWalletProvider } from '@alephium/web3-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import NewHomePage from '@/pages/NewHomePage';
import SettingsPage from '@/pages/SettingsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import NotebinPage from '@/pages/NotebinPage';
import WalletsPage from '@/pages/WalletsPage';
import DAOPage from '@/pages/DAOPage';
import SingleDAOPage from '@/pages/SingleDAOPage';
import ArticlesPage from '@/pages/articles/ArticlesPage';
import ArticleEditorPage from '@/pages/articles/ArticleEditorPage';
import MyArticlesPage from '@/pages/articles/MyArticlesPage';
import ArticleDraftsPage from '@/pages/articles/ArticleDraftsPage';
import UnifiedContentViewer from '@/pages/UnifiedContentViewer';

import MainLayout from '@/layouts/MainLayout';
import { Toaster } from '@/lib/toast';

// Create a new QueryClient instance
const queryClient = new QueryClient();

const App: React.FC = () => {
  useEffect(() => {
    console.log('🚀 BlockNostr App initialized');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AlephiumWalletProvider network="mainnet">
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              <Route path="/" element={<MainLayout />}>
                {/* Home Routes */}
                <Route index element={<NewHomePage />} />
                
                {/* Article Routes */}
                <Route path="articles" element={<ArticlesPage />} />
                <Route path="articles/new" element={<ArticleEditorPage />} />
                <Route path="articles/drafts" element={<ArticleDraftsPage />} />
                <Route path="articles/my-articles" element={<MyArticlesPage />} />
                
                {/* Content Viewer (handles both posts and articles) */}
                <Route path="post/:id" element={<UnifiedContentViewer />} />
                <Route path="article/:id" element={<UnifiedContentViewer />} />
                <Route path="event/:id" element={<UnifiedContentViewer />} />
                
                {/* Notebin Routes */}
                <Route path="notebin" element={<NotebinPage />} />
                
                {/* User Routes */}
                <Route path="settings" element={<SettingsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="wallets" element={<WalletsPage />} />
                
                {/* DAO Routes */}
                <Route path="dao" element={<DAOPage />} />
                <Route path="dao/:id" element={<SingleDAOPage />} />
                
                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
            
            {/* Global Toast Container with custom styling */}
            <Toaster
              position="bottom-right"
              gutter={8}
              containerStyle={{
                bottom: 20, // Space from bottom of screen
                right: 20,  // Space from right side
              }}
              toastOptions={{
                style: {
                  background: 'transparent',
                  boxShadow: 'none',
                  padding: 0,
                  margin: 0,
                },
                className: 'custom-toast',
                duration: 4000,
              }}
            />
          </div>
        </Router>
      </AlephiumWalletProvider>
    </QueryClientProvider>
  );
};

export default App;
