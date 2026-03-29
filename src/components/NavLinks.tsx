"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Home", href: "/" },
  { label: "Chat", href: "/chat" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-4">
      {links.map(({ label, href }) =>
        (pathname === href || pathname.startsWith(href + "/")) ? (
          <span key={href} className="text-sm font-bold">
            {label}
          </span>
        ) : (
          <Link key={href} href={href} className="text-sm font-medium hover:text-foreground/80 transition-colors">
            {label}
          </Link>
        )
      )}
    </nav>
  );
}
