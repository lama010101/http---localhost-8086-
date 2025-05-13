import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GameProvider } from "@/contexts/GameContext";

import TestLayout from "./layouts/TestLayout";
import HomePage from "./pages/HomePage";
import GameRoundPage from "./pages/GameRoundPage";
import FinalResultsPage from "./pages/FinalResultsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import GameRoomPage from "./pages/GameRoomPage";
import FriendsPage from "./pages/FriendsPage";
import AuthPage from "./pages/AuthPage";
import AdminImagesPage from "./pages/AdminImagesPage";
import AdminBadgesPage from "./pages/AdminBadgesPage";
import RoundResultsPage from "./pages/RoundResultsPage";

// Enhanced AuthRedirectHandler with better session handling
const AuthRedirectHandler = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check for hash fragment which indicates a redirect from OAuth
    const handleAuthRedirect = async () => {
      // Get current URL hash
      const hashParams = window.location.hash;
      
      if (hashParams && hashParams.includes('access_token')) {
        console.log("Detected OAuth redirect with access token");
        
        try {
          // First set the access token from URL into storage
          const accessToken = new URLSearchParams(hashParams.substring(1)).get('access_token');
          if (accessToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: '',
            });
          }
          
          // Then get the session which will now include the token we just set
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error getting session after OAuth redirect:", error);
            return;
          }
          
          if (data?.session) {
            console.log("Successfully retrieved session after OAuth redirect");
            // Scrub the hash so you don't leak tokens in your URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // Navigate to home page after successful authentication
            navigate('/test', { replace: true });
          } else {
            console.warn("No session found after OAuth redirect");
          }
        } catch (err) {
          console.error("Failed to process OAuth redirect:", err);
        }
      }
    };
    
    handleAuthRedirect();
  }, [navigate]);
  
  return null;
};

const App = () => {
  const queryClient = new QueryClient();

  return (
    <React.StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <GameProvider>
                <AuthRedirectHandler />
                <Routes>
                  <Route path="/test" element={<TestLayout />}>
                      <Route index element={<HomePage />} />
                      <Route path="auth" element={<AuthPage />} />
                      <Route path="leaderboard" element={<LeaderboardPage />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="room" element={<GameRoomPage />} />
                      <Route path="friends" element={<FriendsPage />} />
                      <Route path="admin/images" element={<AdminImagesPage />} />
                      <Route path="admin/badges" element={<AdminBadgesPage />} />
                      
                      <Route path="game/room/:roomId/round/:roundNumber" element={<GameRoundPage />} />
                      <Route path="game/room/:roomId/round/:roundNumber/results" element={<RoundResultsPage />} />
                      <Route path="game/room/:roomId/final" element={<FinalResultsPage />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/test" replace />} />
                </Routes>
                </GameProvider>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

export default App;
