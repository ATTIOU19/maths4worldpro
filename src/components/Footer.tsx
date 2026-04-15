import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="mt-auto bg-primary text-primary-foreground py-16">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-3 gap-12">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <span className="text-secondary-foreground font-black text-sm">M4W</span>
            </div>
            <span className="font-bold text-lg">MATHS4WORLD</span>
          </div>
          <p className="text-primary-foreground/60 text-sm leading-relaxed">
            L'IA qui enseigne les mathématiques
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/40">Navigation</h4>
          <div className="flex flex-col gap-2">
            <Link to="/" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">Accueil</Link>
            <Link to="/tuteur-ia" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">Tuteur IA</Link>
            <Link to="/maths-metier" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">Maths Métier</Link>
            <Link to="/a-propos" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">À propos</Link>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/40">Contact</h4>
          <a href="mailto:attioukotchole@gmail.com" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">attioukotchole@gmail.com</a>
          <p className="text-primary-foreground/60 text-sm mt-2">© 2026 MATHS4WORLD. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
