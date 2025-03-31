import { NextResponse } from "next/server"
import { makeOutgoingCalls } from "../../../../../helpers/outgoingCalls"

export async function POST(request: Request) {
  await makeOutgoingCalls()
  const body = await request.json()
  return NextResponse.json({ message: "Success", body })
}
