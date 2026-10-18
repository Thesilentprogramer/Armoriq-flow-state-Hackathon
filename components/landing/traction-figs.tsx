const AXIS = "#a3a3a3";
const INK = "#111111";
const MUTED = "#525252";

function AxisFrame({
  xLabel,
  yLabel,
  xTicks,
  yTicks,
}: {
  xLabel: string;
  yLabel: string;
  xTicks: { x: number; label: string }[];
  yTicks: { y: number; label: string }[];
}) {
  return (
    <g fontFamily="ui-monospace, monospace" fontSize="7" fill={MUTED}>
      <line x1="36" y1="96" x2="188" y2="96" stroke={AXIS} strokeWidth="1" />
      <line x1="36" y1="16" x2="36" y2="96" stroke={AXIS} strokeWidth="1" />
      {xTicks.map((t) => (
        <g key={t.label}>
          <line x1={t.x} y1="96" x2={t.x} y2="99" stroke={AXIS} strokeWidth="1" />
          <text x={t.x} y="108" textAnchor="middle">
            {t.label}
          </text>
        </g>
      ))}
      {yTicks.map((t) => (
        <g key={t.label}>
          <line x1="33" y1={t.y} x2="36" y2={t.y} stroke={AXIS} strokeWidth="1" />
          <text x="30" y={t.y + 2.5} textAnchor="end">
            {t.label}
          </text>
        </g>
      ))}
      <text x="112" y="118" textAnchor="middle" fill={MUTED}>
        {xLabel}
      </text>
      <text
        x="12"
        y="56"
        textAnchor="middle"
        fill={MUTED}
        transform="rotate(-90 12 56)"
      >
        {yLabel}
      </text>
    </g>
  );
}

export function TractionFigs() {
  return (
    <section className="lp-section">
      <div className="lp-prose">
        <p className="text-[14px] leading-[1.6]">
          [*] The P0 demo is <strong>4</strong> spoken steps, <strong>3</strong> MCP tools, and{" "}
          <strong>3</strong> live ArmorIQ decisions — allow and block, not a slide deck.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          <figure>
            <svg
              viewBox="0 0 200 124"
              className="w-full border border-[var(--lp-rule)] bg-white"
              role="img"
              aria-label="Line chart of four demo steps to an active policy"
            >
              <AxisFrame
                xLabel="demo step"
                yLabel="ready %"
                xTicks={[
                  { x: 48, label: "1" },
                  { x: 88, label: "2" },
                  { x: 128, label: "3" },
                  { x: 168, label: "4" },
                ]}
                yTicks={[
                  { y: 96, label: "0" },
                  { y: 69, label: "50" },
                  { y: 42, label: "100" },
                ]}
              />
              <polyline
                fill="none"
                stroke={INK}
                strokeWidth="1.5"
                points="48,90 88,69 128,50 168,24"
              />
              {[
                { x: 48, y: 90, label: "speak" },
                { x: 88, y: 69, label: "IR" },
                { x: 128, y: 50, label: "confirm" },
                { x: 168, y: 24, label: "active" },
              ].map((p) => (
                <g key={p.label}>
                  <circle cx={p.x} cy={p.y} r="2.5" fill={INK} />
                  <text
                    x={p.x}
                    y={p.y - 6}
                    textAnchor="middle"
                    fontFamily="ui-monospace, monospace"
                    fontSize="6.5"
                    fill={MUTED}
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
            <figcaption className="mt-2 text-[12px] text-[var(--lp-muted)]">
              Fig 1. <strong className="text-[var(--lp-ink)]">4</strong> demo steps to active policy
            </figcaption>
          </figure>

          <figure>
            <svg
              viewBox="0 0 200 124"
              className="w-full border border-[var(--lp-rule)] bg-white"
              role="img"
              aria-label="Scatter of three sandbox MCP tools under policy"
            >
              <AxisFrame
                xLabel="tool index"
                yLabel="calls"
                xTicks={[
                  { x: 56, label: "1" },
                  { x: 108, label: "2" },
                  { x: 160, label: "3" },
                ]}
                yTicks={[
                  { y: 96, label: "0" },
                  { y: 72, label: "1" },
                  { y: 48, label: "2" },
                  { y: 24, label: "3" },
                ]}
              />
              {[
                { x: 56, y: 72, label: "lookup" },
                { x: 108, y: 24, label: "refund" },
                { x: 160, y: 72, label: "email" },
              ].map((p) => (
                <g key={p.label}>
                  <circle cx={p.x} cy={p.y} r="4" fill={INK} />
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    fontFamily="ui-monospace, monospace"
                    fontSize="6.5"
                    fill={MUTED}
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
            <figcaption className="mt-2 text-[12px] text-[var(--lp-muted)]">
              Fig 2. <strong className="text-[var(--lp-ink)]">3</strong> sandbox tools under policy
            </figcaption>
          </figure>

          <figure>
            <svg
              viewBox="0 0 200 124"
              className="w-full border border-[var(--lp-rule)] bg-white"
              role="img"
              aria-label="Bar chart of three ArmorIQ refund decisions"
            >
              <AxisFrame
                xLabel="decision"
                yLabel="count"
                xTicks={[
                  { x: 60, label: "allow" },
                  { x: 108, label: "hold" },
                  { x: 156, label: "block" },
                ]}
                yTicks={[
                  { y: 96, label: "0" },
                  { y: 72, label: "1" },
                  { y: 48, label: "2" },
                  { y: 24, label: "3" },
                ]}
              />
              {/* allow=1, hold=0, block=2 */}
              <rect x="48" y="72" width="24" height="24" fill={INK} />
              <rect x="96" y="96" width="24" height="0.5" fill="#737373" />
              <rect x="144" y="48" width="24" height="48" fill={INK} />
              <text x="60" y="68" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="7" fill={MUTED}>
                1
              </text>
              <text x="108" y="92" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="7" fill={MUTED}>
                0
              </text>
              <text x="156" y="44" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="7" fill={MUTED}>
                2
              </text>
            </svg>
            <figcaption className="mt-2 text-[12px] text-[var(--lp-muted)]">
              Fig 3. <strong className="text-[var(--lp-ink)]">3</strong> refund decisions from ArmorIQ
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
