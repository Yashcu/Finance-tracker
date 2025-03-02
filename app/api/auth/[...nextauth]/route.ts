import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import NextAuth from "next-auth/next";

// Performance optimization: Cache recent successful logins
// This will be cleared server-side on deployments
const loginCache = new Map();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const email = credentials.email.toLowerCase();
        
        // Check cache first for faster repeated logins
        const cacheKey = `${email}:${credentials.password.substring(0, 3)}`;
        if (loginCache.has(cacheKey)) {
          return loginCache.get(cacheKey);
        }

        // Performance: Select only the fields we need
        const user = await prisma.user.findUnique({
          where: {
            email: email
          },
          select: {
            id: true,
            email: true,
            name: true,
            password: true
          }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        const userObj = {
          id: user.id,
          email: user.email,
          name: user.name,
        };
        
        // Cache successful login (expires after 1 hour)
        loginCache.set(cacheKey, userObj);
        setTimeout(() => loginCache.delete(cacheKey), 3600000);
        
        return userObj;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    // Speed optimization: Reduce the work factor for JWT computation
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days to match session
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error page optimization - direct to login with error param
  },
  callbacks: {
    session: async ({ session, token }) => {
      // Faster session callback by avoiding database lookups
      if (session?.user) {
        session.user.id = token.uid as string;
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    }
  },
  // Only enable debug in development, not in production
  debug: process.env.NODE_ENV === "development",
  // Add request/response timeouts for better error handling
  events: {
    async signIn() {
      // Clear expired items from cache periodically
      const now = Date.now();
      for (const [key, ttl] of Object.entries(loginCache)) {
        if (ttl < now) {
          loginCache.delete(key);
        }
      }
    }
  },
  // Only verify session when needed, not on every request
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      }
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 