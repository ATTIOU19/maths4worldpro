import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TuteurIA from "./pages/TuteurIA";
import MathsMetier from "./pages/MathsMetier";
import APropos from "./pages/APropos";
import EntretienSetup from "./pages/EntretienSetup";
import EntretienSession from "./pages/EntretienSession";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tuteur-ia" element={<TuteurIA />} />
          <Route path="/maths-metier" element={<MathsMetier />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/entretien-vocal" element={<EntretienSetup />} />
          <Route path="/entretien-vocal/session" element={<EntretienSession />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
