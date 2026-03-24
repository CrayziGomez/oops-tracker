import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "OWNER" | "USER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "OWNER" | "USER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "OWNER" | "USER";
  }
}
