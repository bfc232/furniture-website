import Link from "next/link";
import { SITE } from "@/lib/site";

/**
 * Wordmark placeholder. Replace this link's contents with the final logo image
 * when the brand file is ready — keep the link to "/" and the accessible name.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-baseline text-current ${className}`}
      aria-label={SITE.brand}
    >
      <span className="text-[1.45rem] font-bold leading-none tracking-[-0.045em] sm:text-[1.6rem]">
        Import<span className="text-accent">Now</span>
      </span>
    </Link>
  );
}
