"use client";
import { useState } from "react";
import { TextInput, Button, Stack, Title, Text, Flex, Image } from "@mantine/core";
import { showNotification } from "@/app/utils/notificationManager";
import Link from "next/link";

const ForgotPassword = () => {
  const primaryColor = "#44208F";
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      showNotification({
        title: "Reset Link Sent",
        message: "If this email exists, a reset link has been sent.",
        withClose: true,
      });
    }, 800);
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

        <form
          onSubmit={handleForgotPassword}
          className="flex flex-col justify-center gap-3 w-full min-w-[450px] max-w-[500px]
                     p-6 bg-white rounded-lg h-fit"
        >
          <Title className="mb-3 text-[#44208F] text-xl font-bold text-center">
            Forgot Password
          </Title>
          <Stack>
            {submitted ? (
              <Text color="green">Check your email for a reset link.</Text>
            ) : (
              <>
                <TextInput
                  label="Email"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  required
                  styles={{
                    input: {
                      backgroundColor: "#F5F5F5",
                      color: "black",
                    },
                  }}
                />
            <Button
              type="submit"
              className="bg-[#44208F] text-white transition-colors duration-300 rounded-lg text-lg hover:bg-[#271451]"
            >
              Send Reset Link
            </Button>
            </>
            )}
          </Stack>
        </form>

        {/* Sign Up Link */}
        <Text
          c='black'
          className="text-center text-base"
        >
          Remembered your password? {" "}
          <Link
            href="/auth/login"
            className="text-[#622DCD] cursor-pointer no-underline font-semibold hover:underline"
          >
            Login
          </Link>
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
};

export default ForgotPassword;