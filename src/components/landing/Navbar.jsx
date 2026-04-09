import React, { useState, useEffect } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Threads } from 'react-bootstrap-icons';
import Logo from '@/assets/YessLogo.png';

const navLinks = [
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' }
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-secondary/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-28">
          {/* Logo */}
          <a href="#" className="flex items-center">
            <img src={Logo} alt="Yess Logo" className="h-12 w-auto object-contain" 
            />
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative text-sm font-medium text-white tracking-wide uppercase group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-full shadow-[0_0_8px_2px_hsl(var(--primary)/0.6)]" />
              </a>
            ))}
            <a href="#contact">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold tracking-wide">
                <Phone className="w-4 h-4 mr-2" />
                Get a Quote
              </Button>
            </a>
            <a href="https://www.facebook.com/profile.php?id=100041518574120"><Facebook className="text-white"/></a>
            <a href="https://www.instagram.com/isaacyess/"><Instagram className="text-white"/></a>
            <a href="https://www.threads.com/@isaacyess?xmt=AQF04wdsAQ3JF-P01wkAGTzWXU2itSE-NYrXlDs32AQroLQ"><Threads className="text-white"/></a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-secondary-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
            
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-secondary/98 backdrop-blur-md border-t border-border">
          <div className="px-6 py-6 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-muted-foreground hover:text-secondary-foreground tracking-wide uppercase"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a href="#contact" onClick={() => setMenuOpen(false)}>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold mt-2">
                <Phone className="w-4 h-4 mr-2" />
                Get a Quote
              </Button>
            </a>
            </div>
        </div>
      )}
    </nav>
  );
}