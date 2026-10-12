/** Wall-clock milliseconds at request time (call from server components / route handlers). */
export function requestTimeMs(): number {
  return Date.now();
}
