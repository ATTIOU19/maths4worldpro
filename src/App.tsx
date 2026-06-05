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
import Inscription from "./pages/Inscription";
import Connexion from "./pages/Connexion";
import MotDePasseOublie from "./pages/MotDePasseOublie";
import ReinitialiserMotDePasse from "./pages/ReinitialiserMotDePasse";
import ChatIA from "./pages/ChatIA";
import Visualisation from "./pages/Visualisation";
import NotionApprentissage from "./pages/NotionApprentissage";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Routes publiques */}
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />

          {/* Routes protégées */}
          <Route path="/" element={<Index />} />
          <Route path="/tuteur-ia" element={<RequireAuth><TuteurIA /></RequireAuth>} />
          <Route path="/maths-metier" element={<RequireAuth><MathsMetier /></RequireAuth>} />
          <Route path="/a-propos" element={<RequireAuth><APropos /></RequireAuth>} />
          <Route path="/entretien-vocal" element={<RequireAuth><EntretienSetup /></RequireAuth>} />
          <Route path="/entretien-vocal/session" element={<RequireAuth><EntretienSession /></RequireAuth>} />
          <Route path="/chat" element={<RequireAuth><ChatIA /></RequireAuth>} />
          <Route path="/visualisation" element={<RequireAuth><Visualisation /></RequireAuth>} />
          <Route path="/notion" element={<RequireAuth><NotionApprentissage /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
