// import { makeOutgoingCalls } from "../../../../helpers/outgoingCalls.js"
import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  //   await makeOutgoingCalls()
  res.status(200).json({ message: "Success", body: req.body })
}
