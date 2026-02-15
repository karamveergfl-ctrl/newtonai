import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CreditBalance } from "@/components/CreditBalance";
import Logo from "@/components/Logo";
import { Menu, X, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavChild = {
  href: string;
  label: string;
  badge?: string;
};

type NavLink = {
  href?: string;
  label: string;
  type: "link" | "dropdown";
  children?: NavChild[];
  badge?: string;
};

const navLinks: NavLink[] = [
  { href: "/", label: "Home", type: "link" },
  {
    label: "Features",
    type: "dropdown",
    children: [
      { href: "/features", label: "Features" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/compare", label: "Compare" },
    ],
  },
  { href: "/tools", label: "Tools", type: "link" },
  {
    label: "Resources",
    type: "dropdown",
    children: [
      { href: "/guides", label: "Guides", badge: "NEW" },
      { href: "/blog", label: "Blog" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  { href: "/pricing", label: "Pricing", type: "link" },
  { href: "/about", label: "About", type: "link" },
];

// Flatten navLinks for mobile menu
const mobileNavLinks: NavChild[] = navLinks.flatMap((link) => {
  if (link.type === "dropdown" && link.children) {
    return link.children;
  }
  return [{ href: link.href!, label: link.label, badge: link.badge }];
});

interface HeaderProps {
  transparent?: boolean;
}

export const Header = ({ transparent = false }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const headerBg = transparent && !isScrolled
    ? "bg-transparent"
    : "bg-background/80 backdrop-blur-lg border-b border-border/50";

  const isActiveDropdown = (children: NavChild[]) => {
    return children.some((child) => location.pathname === child.href);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5">
              <Logo size="xs" compact />
              <span className="font-bold text-lg md:text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                NewtonAI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) =>
                link.type === "link" ? (
                  <Link
                    key={link.href}
                    to={link.href!}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      location.pathname === link.href
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {link.label}
                    {link.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-primary/15 text-primary animate-pulse">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                ) : (
                  <DropdownMenu key={link.label}>
                    <DropdownMenuTrigger
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 outline-none ${
                        isActiveDropdown(link.children || [])
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {link.label}
                      <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="min-w-[180px] bg-popover border border-border"
                    >
                      {link.children?.map((child) => (
                        <DropdownMenuItem key={child.href} asChild>
                          <Link
                            to={child.href}
                            className={`flex items-center gap-2 cursor-pointer ${
                              location.pathname === child.href
                                ? "text-primary"
                                : ""
                            }`}
                          >
                            {child.label}
                            {child.badge && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-primary/15 text-primary animate-pulse">
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              )}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {location.pathname !== "/" && <CreditBalance />}
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth">Sign up</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Keep AnimatePresence for essential UX */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden bg-background border-b border-border shadow-lg"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {mobileNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    location.pathname === link.href
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-primary/15 text-primary animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/auth">Sign up</Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-16 md:h-20" />
    </>
  );
};

export default Header;
