export function CodeBlock({
  language,
  code,
  label,
}: {
  language: string;
  code: string;
  label?: string;
}) {
  return (
    <div className="mb-4">
      {label && (
        <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest mb-2">
          {label}
        </p>
      )}
      <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#262626]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#262626]" />
            <div className="w-2 h-2 rounded-full bg-[#262626]" />
            <div className="w-2 h-2 rounded-full bg-[#262626]" />
          </div>
          <span className="text-[#333] text-[10px] font-mono">{language}</span>
        </div>
        <pre className="px-4 py-4 text-xs font-mono text-[#a3a3a3] overflow-x-auto leading-relaxed">
          {code}
        </pre>
      </div>
    </div>
  );
}