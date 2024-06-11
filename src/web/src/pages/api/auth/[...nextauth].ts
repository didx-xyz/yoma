import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth from "next-auth";
import { authOptions } from "~/server/auth";

export default function auth(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return NextAuth(req, res, authOptions);
}
