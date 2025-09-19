// displayStepUtils.ts
export function normalizeDisplayStep(currentStep: string | null | undefined, readyToGenerate: boolean): string {
    const step = (currentStep || "").toLowerCase();
    if (readyToGenerate) return "ready";
    if (step.includes("analy")) return "analyze";
    if (step.includes("feed")) return "feedback";
    return step || "analyze";
  }
  