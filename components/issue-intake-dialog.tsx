"use client"

import { useState, useCallback } from "react"
import { Bug, Lightbulb, ArrowLeft, Loader2, ExternalLink } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type {
  IssueType,
  IssueIntakePayload,
  IssueIntakeResponse,
} from "@/lib/issue-intake/schema"

interface IssueIntakeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = "choose" | "form" | "success"

export function IssueIntakeDialog({
  open,
  onOpenChange,
}: IssueIntakeDialogProps) {
  const [step, setStep] = useState<Step>("choose")
  const [issueType, setIssueType] = useState<IssueType | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issueUrl, setIssueUrl] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [field1, setField1] = useState("")
  const [field2, setField2] = useState("")
  const [field3, setField3] = useState("")
  const [fieldOptional, setFieldOptional] = useState("")
  const [honeypot, setHoneypot] = useState("")

  const reset = useCallback(() => {
    setStep("choose")
    setIssueType(null)
    setSubmitting(false)
    setError(null)
    setIssueUrl(null)
    setTitle("")
    setField1("")
    setField2("")
    setField3("")
    setFieldOptional("")
    setHoneypot("")
  }, [])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset()
    }
    onOpenChange(nextOpen)
  }

  function handleTypeSelect(type: IssueType) {
    setIssueType(type)
    setStep("form")
    setError(null)
  }

  function handleBack() {
    setStep("choose")
    setIssueType(null)
    setError(null)
    setTitle("")
    setField1("")
    setField2("")
    setField3("")
    setFieldOptional("")
    setHoneypot("")
  }

  function buildPayload(): IssueIntakePayload | null {
    if (!issueType) return null

    switch (issueType) {
      case "bug":
        return {
          type: "bug",
          title,
          whatHappened: field1,
          expectedBehavior: field2,
          stepsToReproduce: field3,
          browserDevice: fieldOptional || undefined,
        }
      case "feature":
        return {
          type: "feature",
          title,
          problem: field1,
          desiredBehavior: field2,
          extraContext: fieldOptional || undefined,
        }
      default: {
        const _exhaustive: never = issueType
        void _exhaustive
        return null
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload = buildPayload()
    if (!payload) return

    setSubmitting(true)

    try {
      const res = await fetch("/api/issue-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, website: honeypot }),
      })

      const data: IssueIntakeResponse = await res.json()

      if (!data.success) {
        setError(data.error ?? "Something went wrong")
        return
      }

      setIssueUrl(data.issueUrl ?? null)
      setStep("success")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle>How can we help?</DialogTitle>
              <DialogDescription>
                Choose what you&apos;d like to submit.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleTypeSelect("bug")}
                className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-accent"
              >
                <Bug className="size-8 text-destructive" />
                <span className="text-sm font-medium">Report a bug</span>
              </button>
              <button
                onClick={() => handleTypeSelect("feature")}
                className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-accent"
              >
                <Lightbulb className="size-8 text-chart-1" />
                <span className="text-sm font-medium">
                  Request a feature
                </span>
              </button>
            </div>
          </>
        )}

        {step === "form" && issueType && (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Go back"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <DialogTitle>
                  {issueType === "bug"
                    ? "Report a bug"
                    : "Request a feature"}
                </DialogTitle>
              </div>
              <DialogDescription>
                {issueType === "bug"
                  ? "Tell us what went wrong so we can fix it."
                  : "Tell us what you'd like to see."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="intake-title">Title</Label>
                <Input
                  id="intake-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    issueType === "bug"
                      ? "Brief summary of the bug"
                      : "Brief summary of your idea"
                  }
                  required
                  maxLength={256}
                  disabled={submitting}
                />
              </div>

              {issueType === "bug" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="intake-what-happened">
                      What happened?
                    </Label>
                    <Textarea
                      id="intake-what-happened"
                      value={field1}
                      onChange={(e) => setField1(e.target.value)}
                      placeholder="Describe the issue"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="intake-expected">
                      Expected behavior
                    </Label>
                    <Textarea
                      id="intake-expected"
                      value={field2}
                      onChange={(e) => setField2(e.target.value)}
                      placeholder="What should have happened?"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="intake-steps">Steps to reproduce</Label>
                    <Textarea
                      id="intake-steps"
                      value={field3}
                      onChange={(e) => setField3(e.target.value)}
                      placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="intake-browser">
                      Browser / device{" "}
                      <span className="text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="intake-browser"
                      value={fieldOptional}
                      onChange={(e) => setFieldOptional(e.target.value)}
                      placeholder="e.g. Chrome 120, iPhone 15"
                      disabled={submitting}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="intake-problem">
                      What problem are you trying to solve?
                    </Label>
                    <Textarea
                      id="intake-problem"
                      value={field1}
                      onChange={(e) => setField1(e.target.value)}
                      placeholder="Describe the problem or pain point"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="intake-desired">
                      What would you like to happen?
                    </Label>
                    <Textarea
                      id="intake-desired"
                      value={field2}
                      onChange={(e) => setField2(e.target.value)}
                      placeholder="Describe your ideal solution"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="intake-extra">
                      Anything else?{" "}
                      <span className="text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <Textarea
                      id="intake-extra"
                      value={fieldOptional}
                      onChange={(e) => setFieldOptional(e.target.value)}
                      placeholder="Additional context, screenshots, links..."
                      disabled={submitting}
                    />
                  </div>
                </>
              )}

              {/* Honeypot — invisible to humans, filled by bots */}
              <div aria-hidden="true" className="absolute -left-[9999px]">
                <label htmlFor="intake-website">Website</label>
                <input
                  type="text"
                  id="intake-website"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle>Thanks for your feedback!</DialogTitle>
              <DialogDescription>
                Your{" "}
                {issueType === "bug" ? "bug report" : "feature request"} has
                been submitted.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {issueUrl && (
                <a
                  href={issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  View on GitHub
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
