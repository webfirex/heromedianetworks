"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showNotification } from "@/app/utils/notificationManager";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, User, Building2, Phone, ArrowRight, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function PublisherSignup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState("");
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      const userRole = session?.user?.role;
      if (userRole === "publisher") {
        router.push("/publisher/dashboard");
      }
    }
  }, [status, session, router]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (form.password !== form.confirmPassword) {
      showNotification({
        title: '⚠️ Signup Error',
        message: 'Passwords do not match',
        withClose: false
      });
      setIsLoading(false);
      return;
    }

    if (!form.acceptedTerms) {
      showNotification({
        title: '⚠️ Signup Error',
        message: 'You must accept the terms and conditions',
        withClose: false
      });
      setIsLoading(false);
      return;
    }

    const res = await fetch("/api/auth/publisher-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setIsLoading(false);

    if (!res.ok) {
      setError(data.message || "Signup failed");
      if (data.message === 'Email') {
        showNotification({
          title: '⚠️ Signup Error',
          message: 'Email is already in use',
          withClose: false
        });
      } else if (data.message === 'Testing') {
        showNotification({
          title: '⚠️ Signup Error',
          message: 'Beta testing',
          withClose: false
        });
      } else if (data.message === 'Missing') {
        showNotification({
          title: '⚠️ Signup Error',
          message: 'All fields are required',
          withClose: false
        });
      }
      return;
    }

    showNotification({
      title: "Signup Successful",
      message: "Your account has been created successfully!",
      withClose: true,
    });
    router.push("/auth/login");
  };

  const benefits = [
    "Real-time analytics dashboard",
    "Advanced fraud protection",
    "Instant payouts",
    "24/7 dedicated support"
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Section - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 -left-32 w-96 h-96 bg-sky-600/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10 py-8"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image
              src="/assests/logo.png"
              alt="Hero Media Network Logo"
              width={56}
              height={56}
              className="rounded-xl"
            />
            <span className="text-xl font-semibold text-foreground">Hero Media Network</span>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-foreground">Create an Account</CardTitle>
              <CardDescription className="text-muted-foreground">
                Join our publisher network today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="pl-10 bg-background border-border h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="pl-10 bg-background border-border h-11"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-foreground">Company</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        type="text"
                        placeholder="Company name"
                        value={form.company}
                        onChange={(e) => handleChange("company", e.target.value)}
                        className="pl-10 bg-background border-border h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Phone number"
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="pl-10 bg-background border-border h-11"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      className="pl-10 pr-10 bg-background border-border h-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      className="pl-10 pr-10 bg-background border-border h-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox
                    id="terms"
                    checked={form.acceptedTerms}
                    onCheckedChange={(checked) => handleChange("acceptedTerms", checked as boolean)}
                    className="mt-0.5 border-border data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground font-normal leading-relaxed cursor-pointer">
                    I agree to the{" "}
                    <Link href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right Section - Image/Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-sky-600 via-teal-600 to-emerald-700">
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[url('/assests/9972.jpg')] bg-cover bg-center opacity-20" />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600/90 via-teal-600/90 to-emerald-700/90" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center max-w-lg"
          >
            <h2 className="text-4xl font-bold mb-6">
              Join Our Publisher Network
            </h2>
            <p className="text-lg text-emerald-100 mb-10">
              Get access to premium offers, real-time analytics, and dedicated support to maximize your affiliate revenue.
            </p>
            
            <div className="space-y-4 text-left">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="p-1 rounded-full bg-white/20">
                    <CheckCircle className="h-5 w-5 text-emerald-300" />
                  </div>
                  <span className="text-teal-50">{benefit}</span>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-12 p-6 rounded-2xl bg-white/10 backdrop-blur-sm">
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-teal-200">Publishers Trust Us</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
