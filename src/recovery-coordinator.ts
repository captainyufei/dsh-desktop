export interface RecoveryTicket {
  isCurrent(): boolean
}

export interface RecoveryCoordinatorOptions {
  readonly onError: (error: unknown) => void | Promise<void>
}

export interface RecoveryCoordinator {
  schedule(operation: (ticket: RecoveryTicket) => void | Promise<void>): Promise<void>
}

/**
 * Serialize native recovery flows while invalidating any older flow as soon as
 * a newer failure is reported. Scheduled promises always settle successfully,
 * so Electron event handlers can safely launch them without an unhandled
 * rejection path.
 */
export function createRecoveryCoordinator(
  options: RecoveryCoordinatorOptions,
): RecoveryCoordinator {
  let latestGeneration = 0
  let tail = Promise.resolve()

  return {
    schedule(operation) {
      const generation = ++latestGeneration
      const ticket: RecoveryTicket = {
        isCurrent: () => generation === latestGeneration,
      }

      const scheduled = tail.then(async () => {
        if (!ticket.isCurrent()) {
          return
        }
        try {
          await operation(ticket)
        } catch (error) {
          try {
            await options.onError(error)
          } catch {
            // This boundary deliberately contains both recovery and terminal
            // cleanup failures so event-launched work never rejects globally.
          }
        }
      })
      tail = scheduled
      return scheduled
    },
  }
}
