import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db"; // your PostgreSQL pool
import bcrypt from "bcryptjs";

// Type for returned user
interface Publisher {
  id: number;
  email: string;
  password: string;
  role: string; // You can hardcode this as 'publisher' if that's fixed
}

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

        let result;
        if (loginType === "admin") {
          // Query the admins table
          result = await pool.query<Publisher>(
            "SELECT id, email, password, 'admin' AS role FROM admins WHERE email = $1",
            [email]
          );
        } else if (loginType === "publisher") {
          // Query the publishers table
          result = await pool.query<Publisher>(
            "SELECT id, email, password, 'publisher' AS role FROM publishers WHERE email = $1",
            [email]
          );
        } else {
          throw new Error("Invalid login type");
        }

        if ((result?.rowCount ?? 0) === 0) {
          throw new Error("Invalid credentials");
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          ...user,
          id: user.id.toString(),
        };
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
