"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { showNotification } from "@/app/utils/notificationManager";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Shield } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      loginType: "admin",
    });

    setIsLoading(false);

    if (result?.error) {
      showNotification({
        title: "Unauthorized Access",
        message: result.error,
        withClose: true,
      });
      return;
    }

    showNotification({
      title: "Login Successful",
      message: "Welcome!",
      withClose: true,
    });
    router.push("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Section - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 -left-32 w-96 h-96 bg-teal-600/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-[128px]" />
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
              alt="Hero Media Network Logo"
              width={56}
              height={56}
              className="rounded-xl"
            />
            <span className="text-xl font-semibold text-foreground">Hero Media Network</span>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 p-3 rounded-2xl bg-cyan-500/10 w-fit">
                <Shield className="h-7 w-7 text-cyan-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Admin Portal</CardTitle>
              <CardDescription className="text-muted-foreground">
                Secure access for administrators only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@heromedia.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-background border-border h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Access Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-center text-xs text-muted-foreground">
                  This is a restricted area. Unauthorized access attempts are logged and monitored.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right Section - Image/Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-teal-600 via-cyan-600 to-sky-700">
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[url('/assests/9972.jpg')] bg-cover bg-center opacity-20" />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/90 via-cyan-600/90 to-sky-700/90" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center max-w-lg"
          >
            <div className="mx-auto mb-8 p-5 rounded-3xl bg-white/10 backdrop-blur-sm w-fit">
              <Shield className="h-16 w-16" />
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Admin Control Center
            </h2>
            <p className="text-lg text-cyan-100 mb-8">
              Manage publishers, monitor performance, configure settings, and oversee all platform operations from one secure dashboard.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-12">
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm text-center">
                <div className="text-2xl font-bold mb-1">Full Access</div>
                <div className="text-sm text-teal-200">Platform Control</div>
              </div>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm text-center">
                <div className="text-2xl font-bold mb-1">Real-Time</div>
                <div className="text-sm text-teal-200">Analytics</div>
              </div>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm text-center">
                <div className="text-2xl font-bold mb-1">Secure</div>
                <div className="text-sm text-teal-200">2FA Enabled</div>
              </div>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm text-center">
                <div className="text-2xl font-bold mb-1">Audit</div>
                <div className="text-sm text-teal-200">Logs & Reports</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
