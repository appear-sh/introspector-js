import { makeOutgoingCalls } from "@appear.sh/test-utils"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  await makeOutgoingCalls("next-app")
  const body = await request.json()
  return NextResponse.json({ message: "Success", body })
}
