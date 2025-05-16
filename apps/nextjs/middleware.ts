import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Middleware logic goes here
  console.log("middleware request")
}

export const config = {
  matcher: "/:path*",
}
