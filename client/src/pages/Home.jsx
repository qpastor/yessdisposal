import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Services from '../components/landing/Services';
import About from '../components/landing/About';
import Projects from '../components/landing/Projects';
import Contact from '../components/landing/Contact';
import Footer from '../components/landing/Footer';
import HeroBackground from '../assets/img/HeroBackGround.png';
import TruckingImage from '../assets/img/TruckingImage.jpg';
import BrokerageImage from '../assets/img/BrokageImage.png';
import DisposalImage from '../assets/img/DisposalImage.png';
import Project1 from '../assets/img/Project1.png';
import Project2 from '../assets/img/Project2.png';
import Project3 from '../assets/img/Project3.png';

const IMAGES = {
  hero: HeroBackground,
  services: {
    trucking: TruckingImage,
    brokerage: BrokerageImage,
    disposal: DisposalImage,
  },
  projects: [
    Project1,
    Project2,
    Project3,
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