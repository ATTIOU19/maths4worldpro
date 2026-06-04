import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Mail, ArrowLeft } from "lucide-react";
import AuthBackgroundVideo from "@/components/AuthBackgroundVideo";

const MotDePasseOublie = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Erreur", description: "Veuillez saisir votre email.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Email envoyé", description: "Vérifiez votre boîte de réception." });
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
          <h1 className="text-2xl font-bold text-white mt-4">Mot de passe oublié</h1>
          <p className="text-white/70 mt-1">Recevez un lien de réinitialisation par email</p>
        </div>

        {sent ? (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="text-primary" size={26} />
            </div>
            <h2 className="text-lg font-semibold text-card-foreground">Vérifiez votre email</h2>
            <p className="text-sm text-muted-foreground">
              Si un compte est associé à <span className="font-medium text-foreground">{email}</span>, vous recevrez un lien pour réinitialiser votre mot de passe.
            </p>
            <Link to="/connexion" className="inline-flex items-center gap-2 text-primary font-medium hover:underline text-sm">
              <ArrowLeft size={16} /> Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="amina@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Mail size={18} />
              {loading ? "Envoi…" : "Envoyer le lien"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link to="/connexion" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
                <ArrowLeft size={14} /> Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default MotDePasseOublie;
