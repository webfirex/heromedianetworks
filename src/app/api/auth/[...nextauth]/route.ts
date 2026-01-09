import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/db-prisma";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        loginType: { label: "Login Type", type: "text" }, // Added loginType to credentials
      },
      async authorize(credentials) {
        console.log("🔐 Incoming credentials:", credentials);

        if (!credentials?.email || !credentials?.password || !credentials?.loginType) {
          // This triggers the `credentials.error` parameter in the frontend
          throw new Error("Please enter all credentials, including login type");
        }

        const { email, password, loginType } = credentials;

        let user;
        if (loginType === "admin") {
          // Query the admins table using Prisma
          user = await prisma.admin.findUnique({
            where: { email },
            select: { id: true, email: true, password: true },
          });
          
          if (user) {
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
              throw new Error("Invalid credentials");
            }
            return {
              id: user.id,
              email: user.email,
              role: "admin",
            };
          }
        } else if (loginType === "publisher") {
          // Query the publishers table using Prisma
          user = await prisma.publisher.findUnique({
            where: { email },
            select: { id: true, email: true, password: true },
          });
          
          if (user) {
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
              throw new Error("Invalid credentials");
            }
            return {
              id: user.id,
              email: user.email,
              role: "publisher",
            };
          }
        } else {
          throw new Error("Invalid login type");
        }

        throw new Error("Invalid credentials");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && "role" in user) {
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.role) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 8 hours in seconds
  },
  pages: {
    signIn: "/auth/login", // Redirect to your custom login page
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };