import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo-maths4world.jpeg";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { useLanguage, LANGUAGES } from "@/i18n";

const navLinks = [
  { key: "nav.home", to: "/" },
  { key: "nav.chat", to: "/chat" },
  { key: "nav.viz", to: "/visualisation" },
  { key: "nav.tutor", to: "/tuteur-ia" },
  { key: "nav.interview", to: "/entretien-vocal" },
  { key: "nav.jobs", to: "/maths-metier" },
  { key: "nav.about", to: "/a-propos" },
];

const PUBLIC_PATHS = new Set(["/"]);

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const { lang, setLang, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const isAuthed = !!session;

  const handleNavClick = (e: React.MouseEvent, to: string) => {
    if (!isAuthed && !PUBLIC_PATHS.has(to)) {
      e.preventDefault();
      setMobileOpen(false);
      navigate("/connexion", { state: { from: to } });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-primary-foreground/10">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Maths4World" className="w-10 h-10 rounded-lg object-cover" />
          <span className="text-primary-foreground font-bold text-lg tracking-tight hidden sm:block">MATHS4WORLD</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={(e) => handleNavClick(e, link.to)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === link.to
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              }`}
            >
              {t(link.key)}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              aria-label={t("nav.language")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            >
              <Globe size={16} />
              <span className="uppercase">{lang}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-card border border-border shadow-card py-1 z-50">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-card-foreground hover:bg-muted transition-colors"
                  >
                    <span>{l.flag}</span>
                    <span className="flex-1 text-left">{l.label}</span>
                    {lang === l.code && <Check size={14} className="text-secondary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {isAuthed ? (
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-5 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold hover:brightness-110 transition-all duration-200 shadow-hero"
            >
              {t("nav.logout")}
            </button>
          ) : (
            <>
              <Link
                to="/connexion"
                className="px-4 py-2 text-primary-foreground/80 hover:text-primary-foreground text-sm font-medium transition-colors"
              >
                {t("nav.login")}
              </Link>
              <Link
                to="/inscription"
                className="inline-flex items-center px-5 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold hover:brightness-110 transition-all duration-200 shadow-hero"
              >
                {t("nav.signup")}
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-primary-foreground p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-primary border-t border-primary-foreground/10"
          >
            <div className="p-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(e) => { handleNavClick(e, link.to); setMobileOpen(false); }}
                  className={`px-4 py-3 rounded-lg text-sm font-medium ${
                    location.pathname === link.to
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "text-primary-foreground/70"
                  }`}
                >
                  {t(link.key)}
                </Link>
              ))}
              <div className="mt-2 border-t border-primary-foreground/10 pt-3">
                <div className="flex items-center gap-2 text-primary-foreground/50 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Globe size={14} /> {t("nav.language")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        lang === l.code
                          ? "bg-secondary text-secondary-foreground font-semibold"
                          : "bg-primary-foreground/10 text-primary-foreground/80"
                      }`}
                    >
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              </div>
              {isAuthed ? (
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="mt-2 px-5 py-3 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold text-center"
                >
                  {t("nav.logout")}
                </button>
              ) : (
                <>
                  <Link
                    to="/connexion"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 px-5 py-3 border border-primary-foreground/20 text-primary-foreground rounded-lg text-sm font-semibold text-center"
                  >
                    {t("nav.login")}
                  </Link>
                  <Link
                    to="/inscription"
                    onClick={() => setMobileOpen(false)}
                    className="px-5 py-3 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold text-center"
                  >
                    {t("nav.signup")}
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
