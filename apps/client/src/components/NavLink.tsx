export function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="text-[#525252] hover:text-white text-xs transition-colors block py-1"
    >
      {label}
    </a>
  );
}