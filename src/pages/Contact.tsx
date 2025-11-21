import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, EnvelopeSimple, Phone, MapPin, PaperPlaneTilt } from '@phosphor-icons/react';

export default function Contact() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: 'Message Sent! ✉️',
        description: 'Thank you for contacting us. We will get back to you soon.',
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-white/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold ml-4">Contact Us</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Contact Info Cards */}
        <div className="grid gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary p-3 rounded-full">
                  <EnvelopeSimple size={24} weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <a href="mailto:support@quiz2cash.com" className="text-sm text-muted-foreground hover:text-primary">
                    support@quiz2cash.com
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 text-accent p-3 rounded-full">
                  <Phone size={24} weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Phone</h3>
                  <a href="tel:+2348012345678" className="text-sm text-muted-foreground hover:text-primary">
                    +234 801 234 5678
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-secondary/10 text-secondary p-3 rounded-full">
                  <MapPin size={24} weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Address</h3>
                  <p className="text-sm text-muted-foreground">
                    Lagos, Nigeria
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="What is this about?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us more about your inquiry..."
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <PaperPlaneTilt size={20} className="mr-2" weight="fill" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Notice */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2">Need Quick Answers?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Check out our How to Play guide for answers to common questions about using Quiz2cash.
            </p>
            <Button onClick={() => navigate('/how-to-play')} variant="outline">
              View How to Play
            </Button>
          </CardContent>
        </Card>

        {/* Back Button */}
        <Button onClick={() => navigate('/')} size="lg" className="w-full">
          Back to Home
        </Button>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}
