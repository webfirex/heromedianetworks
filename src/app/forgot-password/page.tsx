"use client";

import { useState } from "react";
import { showNotification } from "@/app/utils/notificationManager";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowRight, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setIsLoading(false);
      showNotification({
        title: "Reset Link Sent",
        message: "If this email exists, a reset link has been sent.",
        withClose: true,
      });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Section - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 -left-32 w-96 h-96 bg-sky-600/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image
              src="/assests/logo.png"
              alt="TapNova Logo"
              width={56}
              height={56}
              className="rounded-xl"
            />
            <span className="text-xl font-semibold text-foreground">TapNova</span>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 p-4 rounded-2xl bg-teal-500/10 w-fit">
                <KeyRound className="h-8 w-8 text-teal-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Forgot Password</CardTitle>
              <CardDescription className="text-muted-foreground">
                {submitted 
                  ? "Check your email for reset instructions" 
                  : "Enter your email to receive a reset link"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-6"
                >
                  <div className="mx-auto mb-6 p-4 rounded-full bg-emerald-500/10 w-fit">
                    <CheckCircle className="h-12 w-12 text-emerald-400" />
                  </div>
                  <p className="text-foreground mb-2 font-medium">Email Sent!</p>
                  <p className="text-muted-foreground text-sm mb-6">
                    We&apos;ve sent a password reset link to <span className="text-foreground">{email}</span>
                  </p>
                  <p className="text-muted-foreground text-xs mb-6">
                    Didn&apos;t receive it? Check your spam folder or try again.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                    }}
                    className="border-border text-foreground hover:bg-card"
                  >
                    Try another email
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-background border-border h-11"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send Reset Link
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
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
              Don&apos;t Worry, We&apos;ve Got You
            </h2>
            <p className="text-lg text-emerald-100 mb-8">
              Password recovery is quick and secure. Just enter your email and we&apos;ll send you instructions to reset your password.
            </p>
            
            <div className="space-y-4 text-left max-w-sm mx-auto">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="text-2xl font-bold">1</div>
                <div className="text-sm text-teal-100">Enter your registered email address</div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="text-2xl font-bold">2</div>
                <div className="text-sm text-teal-100">Check your inbox for the reset link</div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-teal-100">Create a new secure password</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
