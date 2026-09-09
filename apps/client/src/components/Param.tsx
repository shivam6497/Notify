export function Param({
  name,
  type,
  required,
  description,
}: {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}) {
  return (
    <div className="flex gap-4 py-3 border-b border-[#1a1a1a] last:border-0">
      <div className="w-48 shrink-0">
        <code className="text-white text-xs font-mono">{name}</code>
        {required && (
          <span className="ml-2 text-[10px] text-red-400 font-medium">
            required
          </span>
        )}
      </div>
      <div className="w-24 shrink-0">
        <code className="text-[#525252] text-xs font-mono">{type}</code>
      </div>
      <p className="text-[#525252] text-xs leading-relaxed">{description}</p>
    </div>
  );
}