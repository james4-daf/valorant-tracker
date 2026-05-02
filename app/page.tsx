const insightCards = [
  {
    title: "Weapon Confidence",
    prompt: "Phantom or Vandal?",
    body: "See which rifle actually converts more duels for you by map, range, and side.",
  },
  {
    title: "Economy Rounds",
    prompt: "Pistol god, bonus ghost?",
    body: "Compare pistol, bonus, eco, and full-buy rounds to find where momentum disappears.",
  },
  {
    title: "Side Splits",
    prompt: "Defense anchor or attack passenger?",
    body: "Break down attack vs defense impact, first deaths, trade value, and round conversion.",
  },
  {
    title: "Warm-Up Effect",
    prompt: "Did prep change game one?",
    body: "Compare sessions with and without a warm-up to see if your first match starts cleaner.",
  },
];

const upcomingSignals = [
  "Opt-in Riot account linking via RSO",
  "Post-match review only, no live overlays",
  "Agent, map, weapon, and economy trends",
  "Private-by-default player profiles",
];

export default function Home() {
  return (
    <div className="min-h-full overflow-hidden bg-[#08090d] text-zinc-100">
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 -top-72 h-144 w-xl -translate-x-1/2 rounded-full bg-red-500/20 blur-3xl" />
          <div className="absolute -bottom-48 -right-32 h-136 w-136 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[72px_72px] mask-[radial-gradient(circle_at_top,black,transparent_70%)]" />
        </div>

        <nav className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.45em] text-red-300">
              Valorant Improvement Tracker
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Opt-in performance review for serious players
            </p>
          </div>
          <div className="rounded-full border border-red-300/30 bg-red-500/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.24em] text-red-200">
            Coming soon
          </div>
        </nav>

        <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/3 px-4 py-2 text-sm text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_22px_rgba(110,231,183,0.8)]" />
              Built for post-match learning, not live scouting
            </div>

            <h1 className="text-balance text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
              Learn from the stats your matches are already trying to tell you.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              A coming-soon Valorant tracker for players who want practical,
              post-match answers: why your pistol rounds are sharp, why bonus
              rounds fall apart, whether Phantom or Vandal suits you, and why
              defense feels easier than attack.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:hello@example.com?subject=Valorant%20Improvement%20Tracker"
                className="inline-flex items-center justify-center rounded-full bg-red-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-red-400"
              >
                Request early access
              </a>
              <a
                href="#insights"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-200 transition hover:border-white/35 hover:bg-white/5"
              >
                Preview insights
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-4xl bg-linear-to-br from-red-500/20 via-white/5 to-cyan-300/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-zinc-950/80 p-5 shadow-2xl shadow-black/50 backdrop-blur">
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                    Match Review
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">EliteDorito4</h2>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Private beta
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Pistol", "68%", "+12%"],
                  ["Bonus", "31%", "-18%"],
                  ["Defense", "61%", "+9%"],
                ].map(([label, value, delta]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="mt-3 text-2xl font-semibold">{value}</p>
                    <p className="mt-1 font-mono text-xs text-red-200">{delta}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/8 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.26em] text-red-200">
                  Coaching Signal
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-200">
                  Your attack rounds on Ascent show strong opening fights, but
                  low trade conversion after first contact. Review entry timing
                  and second-man spacing before adding more aim practice.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {upcomingSignals.map((signal) => (
                  <div
                    key={signal}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300"
                  >
                    <span>{signal}</span>
                    <span className="font-mono text-xs text-zinc-500">soon</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="insights"
          className="grid gap-4 border-t border-white/10 py-10 sm:grid-cols-2 lg:grid-cols-4"
        >
          {insightCards.map((card) => (
            <article
              key={card.title}
              className="group rounded-3xl border border-white/10 bg-white/3 p-5 transition hover:-translate-y-1 hover:border-red-300/35 hover:bg-white/5.5"
            >
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-red-200">
                {card.title}
              </p>
              <h3 className="mt-4 text-xl font-semibold text-white">
                {card.prompt}
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{card.body}</p>
            </article>
          ))}
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs leading-6 text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Not affiliated with Riot Games. Production stats will require player
            opt-in through Riot Sign On.
          </p>
          <p>Post-match analysis only. No live overlays. No opponent scouting.</p>
        </footer>
      </main>
    </div>
  );
}
