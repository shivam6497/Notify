export function Endpoint({
  method,
  path,
  description,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
}) {
  const colors = {
    GET: "text-[#22c55e] bg-[#22c55e]/10",
    POST: "text-blue-400 bg-blue-400/10",
    PATCH: "text-amber-400 bg-amber-400/10",
    DELETE: "text-red-400 bg-red-400/10",
  };

  return (
    <div className="flex items-center gap-3 bg-[#141414] border border-[#262626] rounded-lg px-4 py-3 mb-4">
      <span
        className={`text-[10px] font-bold font-mono px-2 py-1 rounded ${colors[method]}`}
      >
        {method}
      </span>
      <code className="text-white text-xs font-mono">{path}</code>
      <span className="text-[#525252] text-xs ml-auto hidden sm:block">
        {description}
      </span>
    </div>
  );
}