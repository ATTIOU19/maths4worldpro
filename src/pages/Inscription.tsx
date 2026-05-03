import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import AuthBackgroundVideo from "@/components/AuthBackgroundVideo";

const PAYS_AFRIQUE = [
  "Bénin", "Burkina Faso", "Cameroun", "Côte d'Ivoire", "Gabon",
  "Guinée", "Mali", "Niger", "République du Congo", "Sénégal",
  "Tchad", "Togo", "Autre",
];

const Inscription = () => {
  const navigate = useNavigate();
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [pays, setPays] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !prenoms || !pays || !email || !password) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nom, prenoms, pays },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erreur d'inscription", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Inscription réussie !", description: "Vérifiez votre email pour confirmer votre compte." });
      navigate("/connexion");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-[hsl(213_61%_8%)]">
      <AuthBackgroundVideo />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-sm">M4W</span>
            </div>
            <span className="text-white font-bold text-xl">MATHS4WORLD</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">Créer un compte</h1>
          <p className="text-white/70 mt-1">Rejoignez la communauté Maths4World</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" placeholder="Diallo" value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenoms">Prénoms</Label>
              <Input id="prenoms" placeholder="Amina" value={prenoms} onChange={(e) => setPrenoms(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pays">Pays</Label>
            <select
              id="pays"
              value={pays}
              onChange={(e) => setPays(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Sélectionnez votre pays</option>
              {PAYS_AFRIQUE.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="amina@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <UserPlus size={18} />
            {loading ? "Inscription en cours…" : "S'inscrire"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/connexion" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Inscription;
