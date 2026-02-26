import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-dark-900">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-7xl">
              Your workspace,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-teal-400">
                anywhere in Jordan
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Book hot desks, private offices, and meeting rooms across Amman,
              Irbid, and Aqaba. Flexible. Affordable. Instant.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/spaces"
                className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-500/90 transition-colors"
              >
                Browse Spaces
              </Link>
              <Link
                href="/about"
                className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-gray-50 dark:bg-dark-800 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Flexible workspace solutions
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Choose the space that fits your needs
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Hot Desk */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-dark-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-500/10">
                <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Hot Desk
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Shared workspace with a flexible seat. Perfect for freelancers
                and remote workers who need a productive environment.
              </p>
              <Link
                href="/spaces?type=hot-desk"
                className="mt-4 inline-flex items-center text-sm font-medium text-brand-500 hover:text-brand-500/80"
              >
                Find a desk
                <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>

            {/* Private Office */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-dark-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-500/10">
                <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Private Office
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Dedicated private office space for your team. Fully furnished
                with all the amenities you need to focus and grow.
              </p>
              <Link
                href="/spaces?type=private-office"
                className="mt-4 inline-flex items-center text-sm font-medium text-brand-500 hover:text-brand-500/80"
              >
                Find an office
                <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>

            {/* Meeting Room */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-dark-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-500/10">
                <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Meeting Room
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Professional meeting rooms equipped with screens, whiteboards,
                and video conferencing. Book by the hour.
              </p>
              <Link
                href="/spaces?type=meeting-room"
                className="mt-4 inline-flex items-center text-sm font-medium text-brand-500 hover:text-brand-500/80"
              >
                Book a room
                <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cities Section */}
      <section className="bg-white dark:bg-dark-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Available across Jordan
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Find your ideal workspace in any major city
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { name: "Amman", description: "The capital city with the most options" },
              { name: "Irbid", description: "University city with growing coworking scene" },
              { name: "Aqaba", description: "Coastal city for a different work vibe" },
            ].map((city) => (
              <Link
                key={city.name}
                href={`/spaces?city=${city.name.toLowerCase()}`}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-8 transition-all hover:border-brand-500 hover:shadow-md dark:border-gray-700 dark:bg-dark-800"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
                  {city.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {city.description}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-brand-500">
                  Explore spaces
                  <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-500 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">
            Ready to find your space?
          </h2>
          <p className="mt-3 text-lg text-white/80">
            Browse available spaces and book instantly. No commitment required.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/spaces"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-500 shadow-sm hover:bg-gray-100 transition-colors"
            >
              Browse Spaces
            </Link>
            <Link
              href="/become-vendor"
              className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              List Your Space
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
