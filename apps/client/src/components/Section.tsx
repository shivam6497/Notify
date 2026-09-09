export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-24">
      <h2 className="text-white text-xl font-semibold tracking-tight mb-6 pb-4 border-b border-[#262626]">
        {title}
      </h2>
      {children}
    </section>
  );
}