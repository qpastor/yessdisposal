import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Building2, Users } from 'lucide-react';
import Project1 from '@/assets/img/Project1.jpg';
import Project2 from '@/assets/img/Project2.jpg';
import Project3 from '@/assets/img/Project3.jpg';
import Project4 from '@/assets/img/Project4.jpg';
import Project5 from '@/assets/img/Project5.jpg';
import Project6 from '@/assets/img/Project6.jpg';


const projects = [
  {
    title: '120 East 144th Street',
    location: 'Bronx, NYC',
    units: '500 Units',
    description: 'NYC OER Project No. 22TMP0662X, 22EHAZ138X — 270 truck loads of old foundation trucked away, 7019.2 ton of PA Regulated Dirt disposed with 217 trucks, Recycled Stone backfill & soil washing services.',
    contact: 'Beitel Group · Ami Weinstock · 718-612-6145',
    image: Project1,
  },
  {
    title: '399 Exterior Street',
    location: 'Bronx, NYC',
    units: '2000 Units',
    description: 'Brownfield Site #C203139 — 270 truck loads of old foundation trucked away, 7019.2 ton of PA Regulated Dirt disposed with 217 trucks. All environmental monitoring under P.W. Grosser Consulting, Inc.',
    contact: 'Beitel Group · Ami Weinstock · 718-612-6145',
    image: Project2,
  },
  {
    title: '3880 9th Ave',
    location: 'Manhattan, NYC',
    units: '338 Units',
    description: 'Full soil excavation, transportation, and disposal services. All materials hauled under valid NYSDEC Part 364 waste transporter permits.',
    contact: 'On Target Construction · Simon Drummer · 718-938-5690',
    image: Project3,
  },
  {
    title: '620 W 153rd Street',
    location: 'Manhattan, NYC',
    units: '324 Units',
    description: 'Soil brokerage and compliant disposal services for a high-rise residential development. Every load tracked using Part 360 Series Waste Tracking Documents.',
    contact: 'The Jay Group · Tovia Khon · 917-624-0299',
    image: Project4,
  },
  {
    title: '2886 Atlantic Ave',
    location: 'Brooklyn, NYC',
    units: '230 Units',
    description: 'Cost-effective soil disposal through Class B Recycling Centers and PADEP regulated facilities. Full OSHA and HAZMAT certified personnel on-site.',
    contact: 'The Jay Group · Joel Khon · 718-938-5690',
    image: Project5,
  },
  {
    title: '1499 Bedford Ave',
    location: 'Brooklyn, NYC',
    units: '172 Units',
    description: 'Complete soil removal, transportation, and recycling services. Advanced contaminated soil washing converting materials into high-quality approved aggregate products.',
    contact: 'CW Realty Group · Adam · 347-533-0860',
    image: Project6,
  },
];

export default function Projects() {
  return (
    <section id="projects" className="py-24 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-primary text-xs font-semibold tracking-widest uppercase">Our Work</span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mt-3">
            Completed Projects
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg font-body">
            A selection of our completed projects across New York City's most demanding construction environments.
          </p>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.15 }}
              className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-2xl"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="font-heading font-bold text-lg text-foreground mb-1">{project.title}</h3>
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {project.location}
                </div>
                <div className="flex items-center gap-1.5 text-primary text-sm font-semibold mb-3">
                  <Building2 className="w-3.5 h-3.5" />
                  {project.units}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed font-body mb-4">{project.description}</p>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{project.contact}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}