"use client";

import { useState, useEffect } from "react"; // Import useEffect
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // Import useSession
import {
    TextInput,
    PasswordInput,
    Button,
    Stack,
    Text,
    Title,
    Flex,
    Image
} from "@mantine/core";
import { showNotification } from "@/app/utils/notificationManager";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function AdminLogin() {
    const primaryColor = "#44208F";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { data: session, status } = useSession(); // Get session data and status

    // Effect to check session status on component mount
    useEffect(() => {
        if (status === "authenticated") {
            
        }
    }, [status, session, router]); // Depend on status, session, and router

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await signIn("credentials", {
            redirect: false,
            email,
            password,
            loginType: "admin", // Specify login type as admin
        });

        if (result?.error) {
            showNotification({
                title: "Unauthorized Access",
                message: result.error,
                withClose: true,
            });
            return; // Prevent redirection
        }

        showNotification({
            title: "Login Successful",
            message: "Welcome!",
            withClose: true,
        });
        // After successful login, the session will update, and the useEffect will handle redirection.
        // For immediate redirect after a fresh login, you can also add it here.
        router.push("/admin/dashboard");
    };

    return (
        <div className="flex min-h-screen bg-white w-full h-screen">
              {/* Form Section */}
              <div
                // Added sm:w-1/2 here to explicitly set width for half page
                className="flex-1 w-full sm:w-1/2 flex flex-col items-center justify-between p-6 box-border relative
                           min-h-screen h-full md:py-8 md:px-4
                           lg:py-12 lg:px-6"
              >
                {/* Logo and Company Title */}
                <Flex
                  align="center"
                  justify="center"
                  className="h-fit w-full flex gap-2"
                >
                  <Image
                    src="/assests/logo.png"
                    alt="Hero Media Network Logo"
                    w={'90px'}
                  />
                  <Title order={3} style={{ color: primaryColor }}>
                    Hero Media Network
                  </Title>
                </Flex>
        
                {/* Login Form */}
                <form
                  onSubmit={handleLogin}
                  className="flex flex-col justify-center gap-3 w-full min-w-[450px] max-w-[500px]
                             p-6 bg-white rounded-lg h-fit"
                >
                  <Title className="mb-3 text-[#44208F] text-xl font-bold text-center">
                    Welcome Back
                  </Title>
                  <Stack>
                    <TextInput
                      label="Email"
                      placeholder="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.currentTarget.value)}
                      styles={{
                        label: {
                            color: 'black',
                            fontWeight: 'bold',
                        },
                        input: {
                          backgroundColor: "#F5F5F5",
                          color: "black",
                        },
                      }}
                    />
                    <PasswordInput
                      label="Password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.currentTarget.value)}
                      styles={{
                        label: {
                            color: 'black',
                            fontWeight: 'bold',
                        },
                        input: {
                          backgroundColor: "#F5F5F5",
                          color: "black",
                        },
                      }}
                    />
                    <Flex justify="space-between" align="flex-end">
                      <Text></Text>
                      <Link
                        href="/forgot-password"
                        className="text-[#622DCD] cursor-pointer no-underline font-semibold text-sm hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </Flex>
                    <Button
                      type="submit"
                      className="bg-[#44208F] text-white transition-colors duration-300 rounded-lg text-lg hover:bg-[#271451]"
                    >
                      Login
                    </Button>
                  </Stack>
                </form> 
                <Text
                  c='black'
                  className="text-center text-base"
                >
                </Text>
              </div>
        
              {/* Image Section (now using Next.js Image component) */}
              <div
                // Added sm:w-1/2 here to explicitly set width for half page
                className="flex-1 w-full sm:w-1/2 relative overflow-hidden min-h-screen
                           hidden sm:flex bg-[url(/assests/9972.jpg)] bg-cover bg-center" // Hidden when vw < 624px (sm in tailwind)
              >
              </div>
            </div>
    );
}