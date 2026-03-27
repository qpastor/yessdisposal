import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Services from '../components/landing/Services';
import About from '../components/landing/About';
import Projects from '../components/landing/Projects';
import Contact from '../components/landing/Contact';
import Footer from '../components/landing/Footer';

const IMAGES = {
  hero: 'https://media.base44.com/images/public/69b986f7419ad56e045285ee/0b8193d9b_generated_47e2d3d7.png',
  services: {
    trucking: 'https://media.base44.com/images/public/69b986f7419ad56e045285ee/540fc5080_Triaxle-Dump-Truck.jpg',
    brokerage: 'https://media.base44.com/images/public/69b986f7419ad56e045285ee/475e70d4a_generated_a3af5bb1.png',
    disposal: 'https://media.base44.com/images/public/69b986f7419ad56e045285ee/3b68e2325_generated_944b5684.png',
  },
  projects: [
    'https://media.base44.com/images/public/69b986f7419ad56e045285ee/3efd4e3a5_generated_5aa6b374.png',
    'https://media.base44.com/images/public/69b986f7419ad56e045285ee/48052e603_generated_14965cd5.png',
    'https://media.base44.com/images/public/69b986f7419ad56e045285ee/11ac7dc61_generated_0e3bf0ac.png',
  ],
};

export default function Home() {
  return (
    <div className="min-h-screen font-body">
      <Navbar />
      <Hero heroImage={IMAGES.hero} />
      <Services images={IMAGES.services} />
      <About />
      <Projects />
      <Contact />
      <Footer />
    </div>
  );
}