import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { LogIn, Eye, EyeOff } from "lucide-react";
import AuthBackgroundVideo from "@/components/AuthBackgroundVideo";
import { useT } from "@/i18n";

const Connexion = () => {
  const navigate = useNavigate();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: t("auth.error"), description: t("auth.fillAllFields"), variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast({ title: t("auth.login.errorTitle"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.login.welcomeTitle"), description: t("auth.login.successDesc") });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[hsl(213_61%_8%)]">
      <AuthBackgroundVideo />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-sm">M4W</span>
            </div>
            <span className="text-white font-bold text-xl">MATHS4WORLD</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">{t("auth.login.title")}</h1>
          <p className="text-white/70 mt-1">{t("auth.login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-4">
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

          <div className="text-right">
            <Link to="/mot-de-passe-oublie" className="text-sm text-primary hover:underline">
              {t("auth.login.forgotPassword")}
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <LogIn size={18} />
            {loading ? t("auth.login.submitLoading") : t("auth.login.submit")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <Link to="/inscription" className="text-primary font-medium hover:underline">
              {t("auth.login.signupLink")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Connexion;
