export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col md:flex-row">
      {/* left panel — branding (hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 border-r border-[#262626]">
        {/* logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">N</span>
          </div>
          <span className="text-white font-medium tracking-tight">notify</span>
        </div>

        {/* center content */}
        <div>
          <div className="mb-8">
            {/* fake terminal */}
            <div className="bg-[#141414] border border-[#262626] rounded-lg p-4 font-mono text-xs mb-6">
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
              </div>
              <div className="space-y-1">
                <p>
                  <span className="text-[#525252]">POST</span>{" "}
                  <span className="text-white">/v1/notify</span>
                </p>
                <p className="text-[#525252]">{"{"}</p>
                <p className="text-[#525252] pl-4">
                  "eventSlug":{" "}
                  <span className="text-white">"order.placed"</span>,
                </p>
                <p className="text-[#525252] pl-4">
                  "subscriberId": <span className="text-white">"usr_123"</span>,
                </p>
                <p className="text-[#525252] pl-4">
                  "payload": {"{"} <span className="text-white">...</span> {"}"}
                </p>
                <p className="text-[#525252]">{"}"}</p>
                <div className="mt-3 pt-3 border-t border-[#262626]">
                  <p>
                    <span className="text-[#22c55e]">202</span>{" "}
                    <span className="text-[#525252]">Accepted</span>
                  </p>
                  <p className="text-[#525252]">
                    {"{"} "notificationId":{" "}
                    <span className="text-white">"ntf_..."</span> {"}"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Channels", value: "3" },
              { label: "Delivery", value: "99%" },
              { label: "Latency", value: "<50ms" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="border border-[#262626] rounded-lg p-3"
              >
                <p className="text-white font-semibold text-lg">{stat.value}</p>
                <p className="text-[#525252] text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <h2 className="text-white text-2xl font-semibold tracking-tight leading-snug">
            Notification infrastructure
            <br />
            <span className="text-[#525252]">for developers.</span>
          </h2>
        </div>

        {/* bottom */}
        <p className="text-[#525252] text-xs">
          Email · Webhook · In-app — one API call
        </p>
      </div>

      {/* right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24">
        {/* mobile logo */}
        <div className="flex items-center gap-2 mb-10 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">N</span>
          </div>
          <span className="text-white font-medium">notify</span>
        </div>

        <div className="w-full max-w-sm mx-auto md:mx-0">{children}</div>
      </div>
    </div>
  );
}
