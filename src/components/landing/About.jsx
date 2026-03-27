import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const highlights = [
'NYSDEC Part 364 Certified',
'BIC License #511813',
'Full OSHA & HAZMAT Certified',
'Part 360 Waste Tracking',
'Internal Environmental Scientists',
'Cost-Effective Disposal Solutions'];


export default function About() {
  return (
    <section id="about" className="py-24 lg:py-32 bg-secondary">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}>
            
            <span className="text-primary text-xs font-semibold tracking-widest uppercase">About Us</span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-secondary-foreground mt-3 leading-tight">
              NYC's Most Trusted
              <br />
              <span className="text-primary">Soil Broker</span>
            </h2>
            <div className="mt-8 space-y-4 text-muted-foreground font-body leading-relaxed">
              <p>
                With over 25 years of experience in the industry, YESS Trucking & Disposal is New York City's top Soil Broker. Our team of expert project managers collaborate closely with developers, general contractors and environmental engineering consulting services to service your team.
              </p>
              <p>
                We obtain formal Facility Acceptance letters from the receiving disposal facilities after YESS's internal environmental scientists and engineers carefully review every RIR, WC and SOE plan to produce the most economic budget with speed & precision.
              </p>
              <p>
                Transportation of all materials is hauled by top tier truckers with valid NYSDEC Part 364 waste transporter permits under YESS BIC #511813. YESS personnel all trained with full OSHA and HAZMAT certification manifest every load tracked using a "Part 360 Series Waste Tracking Document" to ensure legal disposal and maintain the site's regulatory standing.
              </p>
              <p>
                All disposal is done with the most cost effective manner including but not limited to Landfill Recycling, Class B Recycling Centers, PADEP Regulated facilities, NJ LSRPs, and Transfer Stations utilizing the most advanced contaminated soil washing converting contaminated soil, dredge spoils, and debris into high-quality approved sand and aggregate products, minimizing landfill reliance.
              </p>
            </div>
          </motion.div>

          {/* Right Column - Certifications */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}>
            
            <div className="bg-secondary-foreground/5 border border-border rounded-2xl p-8 lg:p-10">
              <h3 className="font-heading font-bold text-xl text-secondary-foreground mb-2">Certifications & Compliance</h3>
              <p className="text-muted-foreground text-sm mb-8 font-body">Industry-leading standards in every project we handle.</p>

              <div className="space-y-5">
                {highlights.map((item, i) =>
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * i }}
                  className="flex items-center gap-4">
                  
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-body font-medium text-secondary-foreground">{item}</span>
                  </motion.div>
                )}
              </div>

              <div className="mt-10 pt-8 border-t border-border">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="font-heading font-bold text-3xl text-primary">25+</p>
                    <p className="text-muted-foreground text-sm mt-1">Years in Business</p>
                  </div>
                  <div>
                    <p className="font-heading font-bold text-3xl text-primary">12</p>
                    <p className="text-muted-foreground text-sm mt-1">Projects Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>);

}