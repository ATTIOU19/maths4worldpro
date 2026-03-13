import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Accueil", to: "/" },
  { label: "Tuteur IA", to: "/tuteur-ia" },
  { label: "Entretien Vocal", to: "/entretien-vocal" },
  { label: "Maths Métier", to: "/maths-metier" },
  { label: "À propos", to: "/a-propos" },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-primary-foreground/10">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
            <span className="text-secondary-foreground font-black text-sm tracking-tight">M4W</span>
          </div>
          <span className="text-primary-foreground font-bold text-lg tracking-tight hidden sm:block">MATHS4WORLD</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === link.to
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/connexion"
            className="px-4 py-2 text-primary-foreground/80 hover:text-primary-foreground text-sm font-medium transition-colors"
          >
            Connexion
          </Link>
          <Link
            to="/inscription"
            className="inline-flex items-center px-5 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold hover:brightness-110 transition-all duration-200 shadow-hero"
          >
            S'inscrire
          </Link>
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
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium ${
                    location.pathname === link.to
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "text-primary-foreground/70"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/tuteur-ia"
                onClick={() => setMobileOpen(false)}
                className="mt-2 px-5 py-3 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold text-center"
              >
                Commencer gratuitement
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
