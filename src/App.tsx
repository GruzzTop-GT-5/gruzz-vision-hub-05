import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import * as Pages from "@/components/LazyPages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Pages.Index />} />
          <Route path="/auth" element={<Pages.Auth />} />
          <Route path="/balance" element={<Pages.Balance />} />
          <Route path="/rules" element={<Pages.Rules />} />
          <Route path="/ads" element={<Pages.Ads />} />
          <Route path="/create-ad" element={<Pages.CreateAd />} />
          <Route path="/create-order" element={<Pages.CreateOrder />} />
          <Route path="/ad/:id" element={<Pages.AdDetails />} />
          <Route path="/my-ads" element={<Pages.MyAds />} />
          <Route path="/profile" element={<Pages.Profile />} />
          <Route path="/profile/:userId" element={<Pages.UserProfile />} />
          <Route path="/orders" element={<Pages.Orders />} />
          <Route path="/available-orders" element={<Pages.AvailableOrders />} />
          <Route path="/history" element={<Pages.History />} />
          <Route path="/admin" element={<Pages.AdminPanelNew />} />
          <Route path="/chat-system" element={<Pages.ChatSystem />} />
          <Route path="*" element={<Pages.NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
