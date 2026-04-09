import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Services from '../components/landing/Services';
import About from '../components/landing/About';
import Projects from '../components/landing/Projects';
import Contact from '../components/landing/Contact';
import Footer from '../components/landing/Footer';
import HeroBackground from '../assets/HeroBackGround.png';
import TruckingImage from '../assets/TruckingImage.jpg';
import BrokerageImage from '../assets/BrokageImage.png';
import DisposalImage from '../assets/DisposalImage.png';
import Project1Image from '../assets/Project1.png';
import Project2Image from '../assets/Project2.png';
import Project3Image from '../assets/Project3.png';

const IMAGES = {
  hero: HeroBackground,
  services: {
    trucking: TruckingImage,
    brokerage: BrokerageImage,
    disposal: DisposalImage,
  },
  projects: [Project1Image, Project2Image, Project3Image],
}

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