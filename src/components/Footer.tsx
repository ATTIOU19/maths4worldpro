import { Link } from "react-router-dom";
import { useT } from "@/i18n";

const Footer = () => {
  const t = useT();
  return (
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
            {t("footer.tagline")}
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/40">{t("footer.nav")}</h4>
          <div className="flex flex-col gap-2">
            <Link to="/" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">{t("nav.home")}</Link>
            <Link to="/tuteur-ia" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">{t("nav.tutor")}</Link>
            <Link to="/maths-metier" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">{t("nav.jobs")}</Link>
            <Link to="/a-propos" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">{t("nav.about")}</Link>
          </div>
        </div>

        <div>
          <a href="mailto:attioukotchole@gmail.com" className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/40 hover:text-primary-foreground transition-colors underline-offset-4 hover:underline block">{t("footer.contact")}</a>
          
          <p className="text-primary-foreground/60 text-sm mt-2">{t("footer.rights")}</p>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
