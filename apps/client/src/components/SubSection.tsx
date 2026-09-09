export function SubSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="mb-10 scroll-mt-24">
      <h3 className="text-white text-base font-medium mb-4">{title}</h3>
      {children}
    </div>
  );
}
