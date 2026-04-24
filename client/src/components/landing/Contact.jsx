import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Contact() {
  const [form, setForm] = useState({ fullname: '', email: '', phone: '', project_details: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

  try {
    const response = await fetch('http://localhost:5001/api/auth/request-sent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Ensure these keys match what your backend expects
      body: JSON.stringify({
        fullname: form.fullname, // Mapping 'name' from state to 'fullname' for DB
        email: form.email,
        phone: form.phone,
        project_details: form.project_details, // Mapping 'message' to 'project_details'
      }),
    });

    const data = await response.json();

    if (response.ok) {
      toast.success("Message sent! We'll get back to you shortly.");
      // Reset form to initial state
      setForm({ fullname: '', email: '', phone: '', project_details: '' });
    } else {
      toast.error(data.error || 'Something went wrong. Please try again.');
    }
  } catch (err) {
    console.error('Submission Error:', err);
    toast.error('Could not connect to the server.');
  } finally {
    setSending(false);
  }
  };

  const contactInfo = [
    { icon: MapPin, label: 'Location', value: '144-02 Jewel Ave, Flushing, NY 11367' },
    { icon: Phone, label: 'Office', value: '718.233.9239' },
    { icon: Phone, label: 'Mobile', value: '917.770.8820' },
    { icon: Mail, label: 'Email', value: 'isaac@yessdisposal.com' },
    { icon: Clock, label: 'Hours', value: 'Mon-Fri: 9AM-5PM' },
  ];

  return (
    <section id="contact" className="py-24 lg:py-32 bg-secondary">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left - Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary text-xs font-semibold tracking-widest uppercase">Get in Touch</span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-secondary-foreground mt-3 leading-tight">
              Let's Discuss
              <br />
              <span className="text-primary">Your Project</span>
            </h2>
            <p className="mt-6 text-muted-foreground font-body leading-relaxed max-w-lg">
              Ready to start your next project? Contact us for a free consultation and quote. Our team is ready to provide efficient, compliant soil disposal solutions tailored to your needs.
            </p>

            <div className="mt-10 space-y-6">
              {contactInfo.map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="font-body font-medium text-secondary-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 lg:p-10 shadow-xl">
              <h3 className="font-heading font-bold text-xl text-foreground mb-6">Request a Quote</h3>
              <div className="space-y-5">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</Label>
                  <Input
                    id="fullname"
                    value={form.fullname}
                    onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                    placeholder="John Smith"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="john@company.com"
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="(555) 000-0000"
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="project_details" className="text-sm font-medium text-foreground">Project Details</Label>
                  <Textarea
                    id="project_details"
                    value={form.project_details}
                    onChange={(e) => setForm({ ...form, project_details: e.target.value })}
                    placeholder="Tell us about your project, timeline, and estimated volume..."
                    className="mt-1.5 min-h-[140px]"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold h-12 text-base"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}