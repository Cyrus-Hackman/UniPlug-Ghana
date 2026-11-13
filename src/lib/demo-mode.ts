// Demo mode lets the app render sample data (src/lib/mock-data.ts) when the
// database is unreachable, e.g. for local UI work without a database.
// It is off unless DEMO_MODE=true is set explicitly, so production never
// shows fake listings or reports fake successes.
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true"
}
