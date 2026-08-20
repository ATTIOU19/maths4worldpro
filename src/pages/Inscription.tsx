import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import AuthBackgroundVideo from "@/components/AuthBackgroundVideo";
import { useT } from "@/i18n";

const PAYS_AFRIQUE = [
  "Bénin", "Burkina Faso", "Cameroun", "Côte d'Ivoire", "Gabon",
  "Guinée", "Mali", "Niger", "République du Congo", "Sénégal",
  "Tchad", "Togo", "Autre",
];

const Inscription = () => {
  const navigate = useNavigate();
  const t = useT();
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
      toast({ title: t("auth.error"), description: t("auth.fillAllFields"), variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: t("auth.error"), description: t("auth.signup.passwordTooShort"), variant: "destructive" });
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
      toast({ title: t("auth.signup.errorTitle"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.signup.successTitle"), description: t("auth.signup.successDesc") });
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
          <h1 className="text-2xl font-bold text-white mt-4">{t("auth.signup.title")}</h1>
          <p className="text-white/70 mt-1">{t("auth.signup.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">{t("auth.signup.lastName")}</Label>
              <Input id="nom" placeholder={t("auth.signup.lastNamePlaceholder")} value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenoms">{t("auth.signup.firstName")}</Label>
              <Input id="prenoms" placeholder={t("auth.signup.firstNamePlaceholder")} value={prenoms} onChange={(e) => setPrenoms(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pays">{t("auth.signup.country")}</Label>
            <select
              id="pays"
              value={pays}
              onChange={(e) => setPays(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">{t("auth.signup.selectCountry")}</option>
              {PAYS_AFRIQUE.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.passwordPlaceholder")}
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
            {loading ? t("auth.signup.submitLoading") : t("auth.signup.submit")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.signup.hasAccount")}{" "}
            <Link to="/connexion" className="text-primary font-medium hover:underline">
              {t("auth.signup.loginLink")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Inscription;
