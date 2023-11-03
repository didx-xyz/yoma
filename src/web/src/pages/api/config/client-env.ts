import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<object>,
) {
  const publicEnv = Object.fromEntries(
    Object.entries(global.process.env).filter(([key]) =>
      key.startsWith("NEXT_PUBLIC_"),
    ),
  );

  res.status(200).json(publicEnv);
}
