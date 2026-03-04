/**
 * Types and helpers for URL-based accountability verification.
 *
 * Verification means: open the URL in a browser, walk through the full user
 * flow (not just a health-check ping), and record pass/fail with evidence.
 */

export interface VerificationResult {
  /** The URL that was verified. */
  url: string;
  /** Whether the verification passed. */
  passed: boolean;
  /** Human-readable notes describing what was checked and what was found. */
  notes: string;
  /** Optional filesystem path to a screenshot taken during verification. */
  screenshotPath?: string;
  /** ISO-8601 timestamp when the check was performed. */
  checkedAt: string;
}

/**
 * Build a concise, human-readable summary of a verification result.
 * Suitable for inclusion in a Monday.com update body (plain text portion).
 */
export function buildVerificationSummary(result: VerificationResult): string {
  const status = result.passed ? "✅ PASS" : "❌ FAIL";
  const lines: string[] = [
    `${status} — ${result.url}`,
    `Checked: ${result.checkedAt}`,
    `Notes: ${result.notes}`,
  ];
  if (result.screenshotPath) {
    lines.push(`Screenshot: ${result.screenshotPath}`);
  }
  return lines.join("\n");
}

/**
 * Build an HTML update body from a verification result for posting to
 * the Monday.com Updates section.
 */
export function buildVerificationHtml(result: VerificationResult): string {
  const status = result.passed
    ? "<strong>✅ Verification PASSED</strong>"
    : "<strong>❌ Verification FAILED</strong>";
  const screenshot = result.screenshotPath
    ? `<p>Screenshot: ${result.screenshotPath}</p>`
    : "";
  return [
    `<p>${status} — <a href="${result.url}">${result.url}</a></p>`,
    `<p>${result.notes}</p>`,
    `<p><em>Checked: ${result.checkedAt}</em></p>`,
    screenshot,
  ]
    .filter(Boolean)
    .join("\n");
}
