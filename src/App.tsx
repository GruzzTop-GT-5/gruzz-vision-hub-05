import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Balance from "./pages/Balance";
import { Rules } from "./pages/Rules";
import Ads from "./pages/Ads";
import CreateAd from "./pages/CreateAd";
import UserProfile from "./pages/UserProfile";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import AvailableOrders from "./pages/AvailableOrders";
import History from "./pages/History";
import AdminPanel from "./pages/AdminPanel";
import ChatSystem from "./pages/ChatSystem";
import AdDetails from "./pages/AdDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/ads" element={<Ads />} />
        <Route path="/create-ad" element={<CreateAd />} />
        <Route path="/ad/:id" element={<AdDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/available-orders" element={<AvailableOrders />} />
        <Route path="/history" element={<History />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/chat-system" element={<ChatSystem />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
