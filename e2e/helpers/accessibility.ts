import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type SupportedImpact = "minor" | "moderate" | "serious" | "critical";

function formatViolations(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]): string {
  return violations
    .map((violation) => {
      const targets = violation.nodes
        .flatMap((node) => node.target)
        .slice(0, 5)
        .join(", ");
      return `${violation.impact ?? "unknown"} ${violation.id}: ${violation.help} [${targets}]`;
    })
    .join("\n");
}

export async function expectNoAxeViolations(
  page: Page,
  selector: string,
  minimumImpact: SupportedImpact = "serious",
) {
  const results = await new AxeBuilder({ page }).include(selector).analyze();
  const impacts: SupportedImpact[] = ["minor", "moderate", "serious", "critical"];
  const thresholdIndex = impacts.indexOf(minimumImpact);
  const relevantViolations = results.violations.filter((violation) => {
    const impact = (violation.impact ?? "minor") as SupportedImpact;
    return impacts.indexOf(impact) >= thresholdIndex;
  });

  expect(
    relevantViolations,
    relevantViolations.length > 0 ? `Axe violations for ${selector}:\n${formatViolations(relevantViolations)}` : undefined,
  ).toEqual([]);

  return results;
}