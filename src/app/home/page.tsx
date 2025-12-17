'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Zap, 
  Target, 
  Shield, 
  ChevronRight,
  Play,
  Star,
  ArrowRight,
  CheckCircle,
  Smartphone,
  ChartColumnIncreasing
} from 'lucide-react';
import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useSession } from "next-auth/react";
import Image from 'next/image';

function FloatingElement({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [-10, 10, -10] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const { data: session } = useSession();

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  const testimonials = [
    {
      name: "Sarah Chen",
      company: "MediaFlow Inc",
      text: "Hero Media Networks transformed our affiliate tracking. ROI increased by 340% in just 3 months.",
      avatar: "https://images.pexels.com/photos/3768894/pexels-photo-3768894.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    },
    {
      name: "Marcus Rodriguez",
      company: "Digital Ventures",
      text: "The real-time analytics and fraud protection saved us thousands. Best decision we made this year.",
      avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    },
    {
      name: "Emily Watson",
      company: "Growth Partners",
      text: "Onboarding was seamless, and the tracking accuracy is unmatched. Our team loves the interface.",
      avatar: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const features = [
    {
      icon: <BarChart3 className="h-8 w-8 text-sky-400" />,
      title: "Real-Time Analytics",
      description: "Track performance metrics instantly with our advanced dashboard and get actionable insights."
    },
    {
      icon: <Shield className="h-8 w-8 text-emerald-400" />,
      title: "Fraud Protection",
      description: "Advanced AI-powered fraud detection keeps your campaigns safe and your ROI protected."
    },
    {
      icon: <Target className="h-8 w-8 text-teal-400" />,
      title: "Smart Targeting",
      description: "Precision targeting tools help you reach the right audience with maximum conversion rates."
    },
    {
      icon: <Zap className="h-8 w-8 text-amber-400" />,
      title: "Lightning Fast",
      description: "Sub-second tracking speeds ensure no conversion goes unnoticed, maximizing your revenue."
    },
    {
      icon: <Users className="h-8 w-8 text-cyan-400" />,
      title: "Publisher Management",
      description: "Streamlined onboarding and management tools for your entire publisher network."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-emerald-400" />,
      title: "Growth Optimization",
      description: "AI-driven recommendations help optimize campaigns for maximum performance and growth."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Quick Setup",
      description: "Integrate our tracking code in minutes with our simple SDK and comprehensive documentation."
    },
    {
      number: "02",
      title: "Monitor & Track",
      description: "Watch real-time data flow in with advanced analytics, conversion tracking, and performance metrics."
    },
    {
      number: "03",
      title: "Optimize & Scale",
      description: "Use AI-powered insights to optimize campaigns and scale your affiliate network efficiently."
    },
    {
      number: "04",
      title: "Maximize Revenue",
      description: "Leverage our advanced fraud protection and targeting tools to maximize your ROI and earnings."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <Image src="/assests/logoR.png" alt="Logo" width={44} height={44} />
              <span className="text-lg font-semibold text-foreground hidden md:inline">Hero Media Networks</span>
            </motion.div>
            
            <div className="flex items-center space-x-4 md:space-x-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm hidden md:inline">Features</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm hidden md:inline">How It Works</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors text-sm hidden md:inline">Success Stories</a>
              <div className="flex items-center gap-3">
                {session && session.user ? (
                  <>
                    {session.user.role === 'publisher' && (
                      <Link href="/publisher/dashboard">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          Dashboard
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button variant="ghost" className="text-foreground hover:bg-card">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
                {session?.user?.role === 'admin' && (
                  <>
                    <Link href="/auth/login">
                      <Button variant="ghost" className="text-foreground hover:bg-card">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Gradient background orbs */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sky-600/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-[128px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[160px]" />
        </div>
        
        <motion.div 
          style={{ y: y1, opacity }}
          className="relative z-10 max-w-5xl mx-auto text-center px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
              🚀 Next-Gen Affiliate Tracking Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight tracking-tight">
              Track Smarter,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400">
                Earn Faster
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              The most advanced affiliate tracking platform for publishers who demand precision, 
              speed, and maximum revenue optimization.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 text-base">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-card px-8 h-12 text-base">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            <div className="flex w-full justify-center mt-12">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-sky-600/20 via-teal-600/20 to-emerald-600/20 rounded-2xl blur-2xl" />
                <img 
                  src="/hmn-hero.png" 
                  alt="Dashboard Preview" 
                  className='relative rounded-xl max-w-[950px] w-full border border-border shadow-2xl' 
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-muted-foreground"
          >
            <ChevronRight className="h-6 w-6 rotate-90" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need to{' '}
              <span className="text-emerald-400">Succeed</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to maximize your affiliate marketing performance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card className="h-full bg-card border-border hover:border-emerald-500/50 transition-all duration-300">
                  <CardHeader>
                    <div className="mb-4 p-3 w-fit rounded-xl bg-card border border-border">{feature.icon}</div>
                    <CardTitle className="text-foreground">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It <span className="text-teal-400">Works</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our streamlined onboarding process
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-600 to-emerald-600 text-white font-bold text-xl mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full">
                    <motion.div
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
                      viewport={{ once: true }}
                    >
                      <ArrowRight className="h-6 w-6 text-border mx-auto" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Publisher Benefits */}
      <section className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Built for <span className="text-sky-400">Publishers</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Everything you need to manage your affiliate network and maximize revenue
              </p>
              
              <div className="space-y-5">
                {[
                  "One-click publisher onboarding with automated verification",
                  "Real-time performance tracking and detailed analytics",
                  "Advanced fraud detection and protection systems",
                  "Flexible commission structures and instant payouts",
                  "Mobile-optimized tracking for all devices",
                  "24/7 dedicated support and account management"
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <div className="p-1 rounded-full bg-emerald-500/10">
                      <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    </div>
                    <span className="text-muted-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <FloatingElement delay={0}>
                <div className="bg-gradient-to-br from-sky-600 to-emerald-600 rounded-2xl p-8 text-white">
                  <ChartColumnIncreasing className="h-12 w-12 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Real-Time Dashboard</h3>
                  <p className="text-sky-100">Track clicks, conversions, and revenue as they happen</p>
                </div>
              </FloatingElement>
              
              <FloatingElement delay={1}>
                <div className="bg-card rounded-2xl p-6 border border-border mt-6 ml-8">
                  <Smartphone className="h-10 w-10 text-teal-400 mb-3" />
                  <h4 className="text-lg font-semibold text-foreground mb-2">Mobile Optimized</h4>
                  <p className="text-muted-foreground">Perfect tracking across all devices</p>
                </div>
              </FloatingElement>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Preview */}
      <section className="py-24 bg-background relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600/5 via-teal-600/5 to-emerald-600/5" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">
              See It In <span className="text-emerald-400">Action</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience our intuitive dashboard and powerful analytics in real-time
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="relative max-w-5xl mx-auto"
          >
            <div className="bg-card rounded-2xl p-6 border border-border shadow-2xl">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              
              <div className="bg-gradient-to-br from-sky-600 to-emerald-600 rounded-xl p-8 text-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <motion.div
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                    className="bg-white/10 rounded-xl p-5 backdrop-blur-sm"
                  >
                    <TrendingUp className="h-8 w-8 mb-3" />
                    <div className="text-3xl font-bold">$47,892</div>
                    <div className="text-sky-100 text-sm">Revenue Today</div>
                  </motion.div>
                  
                  <motion.div
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="bg-white/10 rounded-xl p-5 backdrop-blur-sm"
                  >
                    <Users className="h-8 w-8 mb-3" />
                    <div className="text-3xl font-bold">1,234</div>
                    <div className="text-sky-100 text-sm">Active Publishers</div>
                  </motion.div>
                  
                  <motion.div
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    className="bg-white/10 rounded-xl p-5 backdrop-blur-sm"
                  >
                    <Target className="h-8 w-8 mb-3" />
                    <div className="text-3xl font-bold">23.4%</div>
                    <div className="text-sky-100 text-sm">Conversion Rate</div>
                  </motion.div>
                </div>
                
                <div className="text-center">
                  <Button size="lg" className="bg-white text-emerald-600 hover:bg-white/90 h-12 px-8">
                    <Play className="mr-2 h-5 w-5" />
                    Try Interactive Demo
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Success <span className="text-sky-400">Stories</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how publishers are maximizing their revenue with Hero Media Networks
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-8">
                <div className="flex justify-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 text-amber-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-2xl text-foreground font-medium mb-8">
                  &quot;{testimonials[currentTestimonial].text}&quot;
                </blockquote>
                <div className="flex items-center justify-center space-x-4">
                  <img
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-border"
                  />
                  <div className="text-left">
                    <div className="font-semibold text-foreground">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {testimonials[currentTestimonial].company}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-emerald-500' : 'bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Affiliate Network?
            </h2>
            <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
              Join thousands of publishers who trust Hero Media Networks to maximize their revenue
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-white/90 h-12 px-8 text-base">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <p className="text-emerald-200 mt-6 text-sm">
              No credit card required • Setup in minutes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Image src="/assests/logoR.png" alt="Logo" width={44} height={44} />
                <span className="text-xl font-bold text-foreground">Hero Media Networks</span>
              </div>
              <p className="text-muted-foreground max-w-md">
                The most advanced affiliate tracking platform for publishers who demand precision, speed, and maximum revenue optimization.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground text-sm">
            <Link href="https://webepex.com"><p className="mb-2">Designed & Developed by <span className='text-emerald-400 font-semibold hover:text-emerald-300 transition-colors'>WebEpex</span> | prakhar@webepex.com</p></Link>
            <p>Copyright &copy; 2025 | Hero Media Networks | All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
