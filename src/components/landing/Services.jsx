import React from 'react';
import { motion } from 'framer-motion';
import { Truck, FlaskConical, Recycle, FileCheck, ShieldCheck, HardHat } from 'lucide-react';

const services = [
  {
    icon: FlaskConical,
    title: 'Soil Brokerage',
    description: 'Expert review of RIR, WC and SOE plans by our internal environmental scientists and engineers to produce the most economic disposal budgets.',
    imageKey: 'brokerage',
  },
  {
    icon: Truck,
    title: 'Soil Transportation',
    description: 'Top-tier truckers with valid NYSDEC Part 364 waste transporter permits operating under YESS BIC #511813 for fully compliant hauling.',
    imageKey: 'trucking',
  },
  {
    icon: Recycle,
    title: 'Disposal & Recycling',
    description: 'Cost-effective disposal through Landfill Recycling, Class B Recycling Centers, PADEP facilities, and advanced contaminated soil washing.',
    imageKey: 'disposal',
  },
  {
    icon: FileCheck,
    title: 'Facility Acceptance',
    description: 'We obtain formal Facility Acceptance letters from receiving disposal facilities, ensuring your project stays on schedule.',
  },
  {
    icon: ShieldCheck,
    title: 'Regulatory Compliance',
    description: 'Every load tracked using Part 360 Series Waste Tracking Documents to ensure legal disposal and maintain site regulatory standing.',
  },
  {
    icon: HardHat,
    title: 'Project Management',
    description: 'Dedicated project managers collaborating with developers, GCs, and environmental engineering consulting services.',
  },
];

export default function Services({ images }) {
  return (
    <section id="services" className="py-24 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-primary text-xs font-semibold tracking-widest uppercase">What We Do</span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mt-3">
            Our Services
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg font-body">
            Comprehensive soil brokerage, transportation, and disposal services tailored for NYC's construction industry.
          </p>
        </motion.div>

        {/* Featured Services with Images */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {services.slice(0, 3).map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-xl"
            >
              {images[service.imageKey] && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={images[service.imageKey]}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-2">{service.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-body">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Services */}
        <div className="grid md:grid-cols-3 gap-6">
          {services.slice(3).map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group p-6 bg-card rounded-xl border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-xl"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <service.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-2">{service.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-body">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}