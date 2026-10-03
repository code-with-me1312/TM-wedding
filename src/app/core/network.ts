/** Stops indefinite loading without claiming a queued Firestore write was cancelled. */
export async function withNetworkDeadline<T>(
  operation: Promise<T>,
  milliseconds = 20000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "The connection is taking too long. Please reconnect and retry.",
              ),
            ),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
export function requireConnection(): void {
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    throw new Error("You’re offline. Please reconnect and try again.");
}
