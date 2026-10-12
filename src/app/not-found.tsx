import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-20 text-center">
      <h1 className="font-serif text-4xl">Page not found</h1>
      <p className="mt-3 text-sm text-muted">This page is not available. Browse furniture instead.</p>
      <Link href="/products" className="btn btn-primary mt-6">
        Explore furniture
      </Link>
    </div>
  );
}
