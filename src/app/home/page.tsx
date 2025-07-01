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
import { Group, Image } from '@mantine/core';

// function AnimatedSphere() {
//   return (
//     <Sphere visible args={[1, 100, 200]} scale={2}>
//       <MeshDistortMaterial
//         color="#3B82F6"
//         attach="material"
//         distort={0.3}
//         speed={1.5}
//         roughness={0.2}
//         transparent
//         opacity={0.8}
//       />
//     </Sphere>
//   );
// }

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
      icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
      title: "Real-Time Analytics",
      description: "Track performance metrics instantly with our advanced dashboard and get actionable insights."
    },
    {
      icon: <Shield className="h-8 w-8 text-teal-500" />,
      title: "Fraud Protection",
      description: "Advanced AI-powered fraud detection keeps your campaigns safe and your ROI protected."
    },
    {
      icon: <Target className="h-8 w-8 text-blue-500" />,
      title: "Smart Targeting",
      description: "Precision targeting tools help you reach the right audience with maximum conversion rates."
    },
    {
      icon: <Zap className="h-8 w-8 text-teal-500" />,
      title: "Lightning Fast",
      description: "Sub-second tracking speeds ensure no conversion goes unnoticed, maximizing your revenue."
    },
    {
      icon: <Users className="h-8 w-8 text-blue-500" />,
      title: "Publisher Management",
      description: "Streamlined onboarding and management tools for your entire publisher network."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-teal-500" />,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <Image src="/assests/logoR.png" alt="Logo" w={"50px"} />
              <span className="text-xl font-bold text-slate-900 hidden md:inline">Hero Media Networks</span>
            </motion.div>
            
            <div className="flex items-center space-x-4 md:space-x-8">
              <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors hidden md:inline">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-blue-600 transition-colors hidden md:inline">How It Works</a>
              <a href="#testimonials" className="text-slate-600 hover:text-blue-600 transition-colors hidden md:inline">Success Stories</a>
              <Group>
                {session && session.user ? (
                  <>
                    {session.user.role === 'publisher' && (
                      <Link href="/publisher/dashboard">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                          Dashboard
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
                {session?.user?.role === 'admin' && (
                  <>
                    <Link href="/auth/login">
                      <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </Group>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            {/* <AnimatedSphere /> */}
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </div>
        
        <motion.div 
          style={{ y: y1, opacity }}
          className="relative z-10 max-w-4xl mx-auto text-center px-4 bg-white/10 backdrop-blur-lg h-[70vh] flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="secondary" className="mb-4 mt-20 bg-blue-100 text-blue-800">
              🚀 Next-Gen Affiliate Tracking Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Track Smarter,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
                Earn Faster
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              The most advanced affiliate tracking platform for publishers who demand precision, 
              speed, and maximum revenue optimization.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-slate-300 px-8 py-4">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            <div className="flex w-full justify-center mt-5">
              <img src="/hmn-hero.png" alt=" " className='rounded-lg max-w-[950px] w-full self-center' />
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
            className="text-slate-400"
          >
            <ChevronRight className="h-6 w-6 rotate-90" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to{' '}
              <span className="text-blue-600">Succeed</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to maximize your affiliate marketing performance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card className="h-full border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-4">{feature.icon}</div>
                    <CardTitle className="text-slate-900">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
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
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              How It <span className="text-teal-600">Works</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
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
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 text-white font-bold text-xl mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full">
                    <motion.div
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
                      viewport={{ once: true }}
                    >
                      <ArrowRight className="h-6 w-6 text-slate-300 mx-auto" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Publisher Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Built for <span className="text-blue-600">Publishers</span>
              </h2>
              <p className="text-xl text-slate-600 mb-8">
                Everything you need to manage your affiliate network and maximize revenue
              </p>
              
              <div className="space-y-6">
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
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700">{benefit}</span>
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
                <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl p-8 text-white">
                  <ChartColumnIncreasing className="h-12 w-12 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Real-Time Dashboard</h3>
                  <p className="text-blue-100">Track clicks, conversions, and revenue as they happen</p>
                </div>
              </FloatingElement>
              
              <FloatingElement delay={1}>
                <div className="bg-white rounded-2xl p-6 shadow-lg mt-6 ml-8">
                  <Smartphone className="h-10 w-10 text-teal-500 mb-3" />
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Mobile Optimized</h4>
                  <p className="text-slate-600">Perfect tracking across all devices</p>
                </div>
              </FloatingElement>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Preview */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              See It In <span className="text-teal-400">Action</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
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
            <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl p-8 text-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                    className="bg-white/10 rounded-lg p-4"
                  >
                    <TrendingUp className="h-8 w-8 mb-2" />
                    <div className="text-2xl font-bold">$47,892</div>
                    <div className="text-blue-200">Revenue Today</div>
                  </motion.div>
                  
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="bg-white/10 rounded-lg p-4"
                  >
                    <Users className="h-8 w-8 mb-2" />
                    <div className="text-2xl font-bold">1,234</div>
                    <div className="text-blue-200">Active Publishers</div>
                  </motion.div>
                  
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    className="bg-white/10 rounded-lg p-4"
                  >
                    <Target className="h-8 w-8 mb-2" />
                    <div className="text-2xl font-bold">23.4%</div>
                    <div className="text-blue-200">Conversion Rate</div>
                  </motion.div>
                </div>
                
                <div className="text-center">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100">
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
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Success <span className="text-blue-600">Stories</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
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
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-2xl text-slate-700 font-medium mb-6">
                  &quot;{testimonials[currentTestimonial].text}&quot;
                </blockquote>
                <div className="flex items-center justify-center space-x-4">
                  <img
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <div className="font-semibold text-slate-900">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="text-slate-600">
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
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Affiliate Network?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of publishers who trust Hero Media Networks to maximize their revenue
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-4">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <p className="text-blue-200 mt-4 text-sm">
              No credit card required • Setup in minutes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Image src="/assests/logoR.png" alt="Logo" w={"50px"} />
                <span className="text-xl font-bold">Hero Media Networks</span>
              </div>
              <p className="text-slate-400 max-w-md">
                The most advanced affiliate tracking platform for publishers who demand precision, speed, and maximum revenue optimization.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <Link href="https://webepex.com"><p>Designed & Developed by <span className='text-blue-500 font-bold'>WebEpex</span> | prakhar@webepex.com</p></Link><br/>
            <p>Copyright &copy; 2025 | Hero Media Networks | All Rights Reserved & All Wrongs Reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}