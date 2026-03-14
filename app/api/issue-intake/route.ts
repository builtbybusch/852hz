import { NextResponse } from "next/server"

import { createGitHubIssue } from "@/lib/issue-intake/github"
import { validatePayload } from "@/lib/issue-intake/schema"
import type { IssueIntakeResponse } from "@/lib/issue-intake/schema"

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5

const requestLog = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = requestLog.get(ip) ?? []
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= RATE_LIMIT_MAX) {
    requestLog.set(ip, recent)
    return true
  }

  recent.push(now)
  requestLog.set(ip, recent)
  return false
}

export async function POST(
  request: Request,
): Promise<NextResponse<IssueIntakeResponse>> {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown"

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many submissions. Please try again in a minute.",
        },
        { status: 429 },
      )
    }

    const body = (await request.json()) as Record<string, unknown>

    if (typeof body.website === "string" && body.website.length > 0) {
      return NextResponse.json({ success: true })
    }

    const result = validatePayload(body.payload)
    if ("error" in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      )
    }

    const { issueUrl } = await createGitHubIssue(result)

    return NextResponse.json({ success: true, issueUrl })
  } catch (err) {
    console.error("Issue intake error:", err)
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    )
  }
}
