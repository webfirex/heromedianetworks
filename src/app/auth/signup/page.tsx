"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TextInput,
  PasswordInput,
  Button,
  Checkbox,
  Title,
  Stack,
  Text,
  Flex,
  Image
} from "@mantine/core";
import { showNotification } from "@/app/utils/notificationManager";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function PublisherSignup() {
  const primaryColor = '#44208F';
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false, // ✅ Renamed from `agree`
  });

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

    if (form.password !== form.confirmPassword) {
      // setError("Passwords do not match");
      showNotification({
          title: '⚠️ Signup Error',
          message: 'Passwords do not match',
          withClose: false
        })
      return;
    }

    if (!form.acceptedTerms) {
      // setError("You must accept the terms and conditions");
      showNotification({
          title: '⚠️ Signup Error',
          message: 'You must accept the terms and conditions',
          withClose: false
        })
      return;
    }

    const res = await fetch("/api/auth/publisher-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    console.log(data);
    if (!res.ok) {
      setError(data.message || "Signup failed");
      if (data.message === 'Email') {
            showNotification({
              title: '⚠️ Signup Error',
              message: 'Email is already in use',
              withClose: false
            })
          } else if (data.message === 'Testing') {
            showNotification({
              title: '⚠️ Signup Error',
              message: 'Beta testing',
              withClose: false
            })
          } else if (data.message === 'Missing') {
            showNotification({
              title: '⚠️ Signup Error',
              message: 'All fields are required',
              withClose: false
            })
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
                  onSubmit={handleSubmit}
                  className="flex flex-col justify-center gap-3 w-full min-w-[450px] max-w-[500px]
                             p-6 bg-white rounded-lg h-fit"
                >
            <Title className="mb-3 text-[#44208F] text-xl font-bold text-center">
            Create an Account
          </Title>
                  <Stack >
            {/* {error && <Text color="red">{error}</Text>} */}
            <TextInput
              label="Name"
              placeholder="Name"
              value={form.name}
              onChange={(e) => handleChange("name", e.currentTarget.value)}
              // required
              // withAsterisk={false}
              styles={{
                label: {
                    color: 'black',
                    fontWeight: 'bold',
                },
                input:{
                  backgroundColor: "#F5F5F5",
                  color: "black",
                }
              }}
            />
            <TextInput
              label="Email"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.currentTarget.value)}
              // required
              // withAsterisk={false}
              styles={{
                label: {
                    color: 'black',
                    fontWeight: 'bold',
                },
                input:{
                  backgroundColor: "#F5F5F5",
                  color: "black",
                }
              }}
            />
            <TextInput
              label="Company"
              placeholder="Company"
              value={form.company}
              styles={{
                label: {
                    color: 'black',
                    fontWeight: 'bold',
                },
                input:{
                  backgroundColor: "#F5F5F5",
                  color: "black",
                }
              }}
              onChange={(e) => handleChange("company", e.currentTarget.value)}
            />
            <TextInput
              label="Phone Number"
              placeholder="Phone Number"
              value={form.phone}
              styles={{
                label: {
                    color: 'black',
                    fontWeight: 'bold',
                },
                input:{
                  backgroundColor: "#F5F5F5",
                  color: "black",
                }
              }}
              onChange={(e) => handleChange("phone", e.currentTarget.value)}
            />
            <PasswordInput
              label="Password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => handleChange("password", e.currentTarget.value)}
              // required
              // withAsterisk={false}
              styles={{
                label: {
                    color: 'black',
                    fontWeight: 'bold',
                },
                input:{
                  backgroundColor: "#F5F5F5",
                  color: "black",
                }
              }}
            />
             <PasswordInput
              label="Confirm Password"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={(e) =>
                handleChange("confirmPassword", e.currentTarget.value)
              }
              // required
              styles={{
                label: {
                    color: 'black',
                    fontWeight: 'bold',
                },
                input:{
                  backgroundColor: "#F5F5F5",
                  color: "black",
                }
              }}
              // withAsterisk={false}
            />
            <Checkbox
              label="I agree to the Terms and Privacy Policy"
              checked={form.acceptedTerms}
              onChange={(e) =>
                handleChange("acceptedTerms", e.currentTarget.checked)
              }
              // required
              styles={{
                label: {
                    color: 'black',
                    fontWeight: 'bold',
                },
                input: {
          backgroundColor: 'white', // Change to your desired background color
          borderColor: 'blue', // Optionally change the border color
        },
        icon: {
          color: 'purple',
        },
      }}
            />
                    <Flex justify="space-between" align="flex-end">
                      
                    </Flex>
                    <Button
                      type="submit"
                      className="bg-[#44208F] text-white transition-colors duration-300 rounded-lg text-lg hover:bg-[#271451]"
                    >
                      Sign up
                    </Button>
                  </Stack>
                </form> 
                <Text
          c='black'
          className="text-center text-base"
        >
          Already have an account?{" "}
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
}



            