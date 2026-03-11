import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "REPORTER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "REPORTER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "REPORTER";
  }
}
