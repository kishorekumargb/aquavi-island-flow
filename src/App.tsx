import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { useAnalytics } from "@/hooks/useAnalytics";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import NotFound from "./pages/NotFound";
import { OrderConfirmation } from "./components/OrderConfirmation";


const queryClient = new QueryClient();

const AppContent = () => {
  // Initialize Google Analytics with your Measurement ID
  // Replace 'G-XXXXXXXXXX' with your actual GA4 Measurement ID
  // Set debug to true in development, false in production
  const isDevelopment = import.meta.env.DEV;
  
  // TODO: Replace with your actual GA4 Measurement ID
  const GA_MEASUREMENT_ID = 'G-PMRHBJLL78'; // Replace this with your actual ID
  
  useAnalytics(GA_MEASUREMENT_ID, isDevelopment);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/access-water-360" element={<AdminDashboard />} />
      <Route path="/user-dashboard" element={<UserDashboard />} />
      <Route path="/order-confirmation" element={<OrderConfirmation />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
