export interface CleanupStage {
  readonly name: string
  run(): void | Promise<void>
}

export async function runCleanupStages(
  stages: readonly CleanupStage[],
  onError: (stage: string, error: unknown) => void | Promise<void>,
): Promise<void> {
  for (const stage of stages) {
    try {
      await stage.run()
    } catch (error) {
      try {
        await onError(stage.name, error)
      } catch {
        // Cleanup is best-effort, but every remaining stage must still run.
      }
    }
  }
}
