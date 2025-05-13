import { NextApiRequest, NextApiResponse } from "next"
import { makeOutgoingCalls } from "@appear.sh/test-utils"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await makeOutgoingCalls("next-pages")
  const body = req.body
  res.status(200).json({ message: "Success", body })
}
