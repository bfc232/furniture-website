"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container-page py-20 text-center">
      <h1 className="font-serif text-4xl">Something went wrong</h1>
      <p className="mt-3 text-sm text-muted">Please try again. If the problem continues, message us on WhatsApp.</p>
      <button type="button" className="btn btn-primary mt-6" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
