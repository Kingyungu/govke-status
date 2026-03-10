import type { Metadata } from 'next'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://status.wahenga.co.uk'

export const metadata: Metadata = {
  title: 'GOV.KE Status — Kenya Government Services',
  description:
    'Real-time status of Kenya\'s government digital services. Hali ya huduma za kidijitali za Serikali ya Kenya.',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: 'GOV.KE Status',
    description: 'Real-time status of Kenya\'s government digital services.',
    url: SITE_URL,
    siteName: 'GOV.KE Status',
    locale: 'en_KE',
    type: 'website',
  },
  robots: { index: true, follow: true },
  alternates: {
    types: { 'application/feed+json': `${SITE_URL}/api/feed.json` },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-KE">
      <body className="bg-govke-grey-1 text-govke-black min-h-screen flex flex-col">
        {/* Accessibility skip link */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* ── GOV.KE Header ──────────────────────────────────────────── */}
        <header className="bg-govke-green text-white" role="banner">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
            {/* Wordmark */}
            <div className="flex items-center gap-2">
              <span className="bg-white text-govke-green font-bold text-sm px-2 py-0.5 rounded leading-tight select-none">
                GOV.KE
              </span>
              <span className="text-white font-light text-xl tracking-tight">Status</span>
            </div>

            {/* Divider + tagline */}
            <div className="hidden sm:block border-l border-govke-green-mid pl-4 ml-2">
              <p className="text-sm text-govke-green-mid leading-tight">
                Real-time status of Kenya&rsquo;s government digital services
              </p>
              <p className="text-xs text-govke-green-mid mt-0.5 opacity-80">
                Hali ya huduma za kidijitali za Serikali ya Kenya
              </p>
            </div>
          </div>
        </header>

        {/* ── Phase banner (GOV.UK pattern) ──────────────────────────── */}
        <div className="bg-govke-green-dark text-govke-green-mid text-xs px-4 sm:px-6 py-1.5">
          <div className="max-w-5xl mx-auto">
            This is an independent public interest service.{' '}
            <a
              href="https://github.com/govke/govke-status"
              className="underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-govke-focus"
              target="_blank"
              rel="noopener noreferrer"
            >
              View source on GitHub
            </a>
          </div>
        </div>

        {/* ── Main ────────────────────────────────────────────────────── */}
        <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
          {children}
        </main>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer className="border-t border-govke-border mt-12 bg-white" role="contentinfo">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-sm text-govke-grey-3">
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <p className="font-semibold text-govke-black mb-1">GOV.KE Status</p>
                <p className="text-xs">
                  An independent public service built by{' '}
                  <a
                    href="https://wahenga.co.uk"
                    className="underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-govke-focus"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Wahenga Consultancy
                  </a>
                  .
                </p>
                <p className="text-xs mt-1 text-govke-grey-3">
                  Not affiliated with the ICT Authority. Data is provided for public interest only.
                </p>
              </div>

              <nav aria-label="Footer links">
                <ul className="space-y-1 text-xs">
                  <li>
                    <a
                      href="/api/feed.json"
                      className="underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-govke-focus"
                    >
                      JSON Incident Feed
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/govke/govke-status"
                      className="underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-govke-focus"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:hello@wahenga.co.uk?subject=GOV.KE%20Status%20—%20Service%20suggestion"
                      className="underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-govke-focus"
                    >
                      Suggest a service to monitor
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
