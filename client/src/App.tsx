import React from 'react';
import { Toaster } from './components/ui/toaster';
import { Toaster as Sonner } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VoteProvider } from './context/VoteContext';
import Index from './pages/Index';
import Register from './pages/Register';
import Login from './pages/Login';
import VotingDashboard from './pages/VotingDashboard';
import Confirmation from './pages/Confirmation';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App: React.FC = () => {
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <VoteProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/register/admin" element={<Register />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/vote" element={<VotingDashboard />} />
                  <Route path="/confirmation" element={<Confirmation />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </VoteProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('App render error', e);
    return <div>App crashed</div>;
  }
};

export default App;
