export type IssueType = "bug" | "feature"

export interface BugPayload {
  type: "bug"
  title: string
  whatHappened: string
  expectedBehavior: string
  stepsToReproduce: string
  browserDevice?: string
}

export interface FeaturePayload {
  type: "feature"
  title: string
  problem: string
  desiredBehavior: string
  extraContext?: string
}

export type IssueIntakePayload = BugPayload | FeaturePayload

export interface IssueIntakeRequest {
  payload: IssueIntakePayload
  website?: string
}

export interface IssueIntakeResponse {
  success: boolean
  issueUrl?: string
  error?: string
}

export function validatePayload(
  data: unknown,
): IssueIntakePayload | { error: string } {
  if (!data || typeof data !== "object") {
    return { error: "Invalid payload" }
  }

  const d = data as Record<string, unknown>

  if (typeof d.title !== "string" || d.title.trim().length === 0) {
    return { error: "Title is required" }
  }

  if (d.title.length > 256) {
    return { error: "Title must be 256 characters or fewer" }
  }

  switch (d.type) {
    case "bug": {
      if (
        typeof d.whatHappened !== "string" ||
        d.whatHappened.trim().length === 0
      ) {
        return { error: '"What happened?" is required' }
      }
      if (
        typeof d.expectedBehavior !== "string" ||
        d.expectedBehavior.trim().length === 0
      ) {
        return { error: '"Expected behavior" is required' }
      }
      if (
        typeof d.stepsToReproduce !== "string" ||
        d.stepsToReproduce.trim().length === 0
      ) {
        return { error: '"Steps to reproduce" is required' }
      }
      return {
        type: "bug",
        title: d.title.trim(),
        whatHappened: (d.whatHappened as string).trim(),
        expectedBehavior: (d.expectedBehavior as string).trim(),
        stepsToReproduce: (d.stepsToReproduce as string).trim(),
        browserDevice:
          typeof d.browserDevice === "string" && d.browserDevice.trim()
            ? d.browserDevice.trim()
            : undefined,
      }
    }
    case "feature": {
      if (typeof d.problem !== "string" || d.problem.trim().length === 0) {
        return { error: '"What problem are you trying to solve?" is required' }
      }
      if (
        typeof d.desiredBehavior !== "string" ||
        d.desiredBehavior.trim().length === 0
      ) {
        return {
          error: '"What would you like to happen?" is required',
        }
      }
      return {
        type: "feature",
        title: d.title.trim(),
        problem: (d.problem as string).trim(),
        desiredBehavior: (d.desiredBehavior as string).trim(),
        extraContext:
          typeof d.extraContext === "string" && d.extraContext.trim()
            ? d.extraContext.trim()
            : undefined,
      }
    }
    default: {
      const _exhaustive: never = d.type as never
      void _exhaustive
      return { error: 'Invalid issue type. Must be "bug" or "feature".' }
    }
  }
}
