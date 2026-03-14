import type { IssueIntakePayload } from "./schema"

const GITHUB_API = "https://api.github.com"

function formatBugBody(p: Extract<IssueIntakePayload, { type: "bug" }>): string {
  let body = `## What happened?\n\n${p.whatHappened}\n\n`
  body += `## Expected behavior\n\n${p.expectedBehavior}\n\n`
  body += `## Steps to reproduce\n\n${p.stepsToReproduce}\n\n`
  if (p.browserDevice) {
    body += `## Browser / device\n\n${p.browserDevice}\n\n`
  }
  body += `---\n*Submitted via the web app*`
  return body
}

function formatFeatureBody(
  p: Extract<IssueIntakePayload, { type: "feature" }>,
): string {
  let body = `## Problem\n\n${p.problem}\n\n`
  body += `## Desired behavior\n\n${p.desiredBehavior}\n\n`
  if (p.extraContext) {
    body += `## Additional context\n\n${p.extraContext}\n\n`
  }
  body += `---\n*Submitted via the web app*`
  return body
}

function labelsForType(type: IssueIntakePayload["type"]): string[] {
  switch (type) {
    case "bug":
      return ["bug", "source:web"]
    case "feature":
      return ["feature request", "source:web"]
    default: {
      const _exhaustive: never = type
      void _exhaustive
      return ["source:web"]
    }
  }
}

function formatBody(payload: IssueIntakePayload): string {
  switch (payload.type) {
    case "bug":
      return formatBugBody(payload)
    case "feature":
      return formatFeatureBody(payload)
    default: {
      const _exhaustive: never = payload
      void _exhaustive
      return ""
    }
  }
}

export async function createGitHubIssue(
  payload: IssueIntakePayload,
): Promise<{ issueUrl: string }> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!token || !owner || !repo) {
    throw new Error("GitHub environment variables are not configured")
  }

  const body = formatBody(payload)
  const labels = labelsForType(payload.type)

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      title: payload.title,
      body,
      labels,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()

    if (res.status === 422 && errBody.includes("Label")) {
      const retryRes = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/issues`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({
            title: payload.title,
            body,
          }),
        },
      )

      if (!retryRes.ok) {
        throw new Error(`GitHub API error: ${retryRes.status}`)
      }

      const retryData = (await retryRes.json()) as { html_url: string }
      return { issueUrl: retryData.html_url }
    }

    throw new Error(`GitHub API error: ${res.status}`)
  }

  const data = (await res.json()) as { html_url: string }
  return { issueUrl: data.html_url }
}
