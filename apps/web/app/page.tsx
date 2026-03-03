import Link from "next/link";
import { MotionWrapper } from "./components/ui/motion-wrapper";
import { HomeSearchBar } from "./components/home-search-bar";
import { IlluminationGraphic } from "./components/illumination-graphic";

export default function Home() {
  return (
    <>
      {/* Gradient blobs */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-500 to-brand-300 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>
      <div className="absolute inset-x-0 top-[20rem] -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none" aria-hidden="true">
        <div className="relative left-[calc(50%+15rem)] aspect-[1155/678] w-[30rem] -translate-x-1/2 rotate-[150deg] bg-gradient-to-tr from-orange-400 to-brand-600 opacity-10 sm:w-[50rem]" style={{ clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32 lg:pb-40">
        {/* Floating glass orbs */}
        <div className="absolute top-32 left-[10%] w-32 h-32 rounded-full glass-panel opacity-30 pointer-events-none" style={{ animation: 'float 6s ease-in-out infinite' }} aria-hidden="true" />
        <IlluminationGraphic position="top-right" />
        <div className="absolute bottom-20 left-[20%] w-16 h-16 rounded-full glass-panel opacity-25 pointer-events-none" style={{ animation: 'float 7s ease-in-out infinite 2s' }} aria-hidden="true" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <MotionWrapper type="fade-up" immediate className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-7xl lg:text-8xl pb-4">
              Your workspace,{" "}
              <span className="gradient-text inline-block">
                anywhere in Jordan.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Book hot desks, private offices, and meeting rooms across Amman, Irbid, and Aqaba. Flexible, affordable, and instant.
            </p>

            {/* Search Bar */}
            <HomeSearchBar />

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/spaces"
                className="w-full sm:w-auto rounded-full bg-brand-500 active:scale-95 px-8 py-4 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,91,4,0.4)] hover:shadow-[0_6px_20px_rgba(255,91,4,0.6)] hover:-translate-y-0.5 transition-all duration-300"
              >
                Start Browsing
              </Link>
              <Link
                href="/become-vendor"
                className="w-full sm:w-auto rounded-full glass-card px-8 py-4 text-sm font-bold text-gray-900 dark:text-white hover:border-slate-500 transition-all duration-300"
              >
                Host a Space
              </Link>
            </div>
          </MotionWrapper>
        </div>
      </section>

      {/* Services Section */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper type="fade-up" className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Flexible solutions for every team
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
              Whether you need a quiet desk for the day or a private suite for your entire agency, we have you covered.
            </p>
          </MotionWrapper>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Hot Desk",
                description: "Shared workspace with a flexible seat. Immediate access to premium amenities, perfect for dynamic freelancers.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />,
                href: "/spaces?type=hot-desk"
              },
              {
                title: "Private Office",
                description: "Dedicated private suites for your team. Fully furnished with glass walls, ergonomic seating, and gigabit internet.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />,
                href: "/spaces?type=private-office"
              },
              {
                title: "Meeting Room",
                description: "High-tech boardrooms equipped with 4K displays, whiteboards, and acoustic dampening. Bookable by the hour.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />,
                href: "/spaces?type=meeting-room"
              },
              {
                title: "Event Space",
                description: "Large venues for workshops, conferences, and community events. Full AV setups and catering coordination.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />,
                href: "/spaces?type=event-space"
              }
            ].map((service, idx) => (
              <MotionWrapper key={service.title} type="fade-up" delay={0.1 * (idx + 1)} className="group relative flex flex-col justify-between rounded-3xl glass-card glass-card-hover p-8 transition-all duration-300 hover:border-brand-500/50 hover:-translate-y-1 hover:shadow-glass-brand">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dark-800/80 group-hover:bg-brand-500/20 transition-colors">
                    <svg className="h-6 w-6 text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      {service.icon}
                    </svg>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                    {service.description}
                  </p>
                </div>
                <div className="mt-8">
                  <Link
                    href={service.href}
                    className="inline-flex items-center text-sm font-bold text-brand-500 hover:text-brand-400 group-hover:translate-x-1 transition-transform"
                  >
                    Explore options
                    <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </MotionWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper type="fade-up" className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
              Three simple steps to your perfect workspace.
            </p>
          </MotionWrapper>

          <div className="grid gap-8 md:grid-cols-3 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-brand-500/50 via-brand-500/20 to-brand-500/50" aria-hidden="true" />

            {[
              {
                step: "1",
                title: "Search",
                description: "Browse spaces by city, type, or amenities. Filter by price, availability, and ratings.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />,
              },
              {
                step: "2",
                title: "Book",
                description: "Pick your dates, choose your plan, and confirm instantly. Secure payment online.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />,
              },
              {
                step: "3",
                title: "Work",
                description: "Show up and start working. It's that simple. Rate and review your experience.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />,
              },
            ].map((item, idx) => (
              <MotionWrapper key={item.step} type="fade-up" delay={0.15 * (idx + 1)} className="relative text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl glass-card mb-6 relative z-10">
                  <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    {item.icon}
                  </svg>
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-xs font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="mt-3 text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {item.description}
                </p>
              </MotionWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper type="fade-up">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { value: "200+", label: "Spaces" },
                { value: "3", label: "Cities" },
                { value: "10,000+", label: "Bookings" },
                { value: "4.8", label: "Avg Rating" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl p-6 text-center">
                  <p className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </MotionWrapper>
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper type="fade-up" className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Available across Jordan
              </h2>
              <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
                Find your ideal workspace in any major city.
              </p>
            </div>
            <Link href="/spaces" className="inline-flex items-center text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors">
              View all locations <span aria-hidden="true" className="ml-1">&rarr;</span>
            </Link>
          </MotionWrapper>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { name: "Amman", description: "The capital city with the most options", delay: 0.1 },
              { name: "Irbid", description: "University city with a growing coworking scene", delay: 0.2 },
              { name: "Aqaba", description: "Coastal city for a different work vibe", delay: 0.3 },
            ].map((city) => (
              <MotionWrapper key={city.name} type="fade-up" delay={city.delay}>
                <Link
                  href={`/spaces?city=${city.name.toLowerCase()}`}
                  className="group block relative overflow-hidden rounded-3xl glass-card glass-card-hover p-8 hover:border-brand-500/50 hover:shadow-glass-brand"
                >
                  {/* Abstract gradient pattern */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-500/10 to-transparent rounded-bl-full pointer-events-none" aria-hidden="true" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
                    {city.name}
                  </h3>
                  <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
                    {city.description}
                  </p>
                </Link>
              </MotionWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-32 mb-16">
        <div className="absolute inset-x-0 bottom-0 -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none" aria-hidden="true">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-brand-500 to-brand-300 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <MotionWrapper type="scale-up" className="mx-auto max-w-3xl rounded-3xl glass-card px-6 py-20 shadow-glass sm:p-24 relative overflow-hidden">
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-brand-500/10 pointer-events-none blur-3xl rounded-full translate-y-1/2" aria-hidden="true"></div>
            {/* Illumination decoration */}
            <IlluminationGraphic position="top-right" />

            <h2 className="relative z-10 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl text-balance">
              Ready to find your perfect space?
            </h2>
            <p className="relative z-10 mx-auto mt-6 max-w-xl text-lg text-slate-500 dark:text-slate-400">
              Browse available spaces and book instantly. No commitment required. Upgrade the way you work today.
            </p>
            <div className="relative z-10 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/spaces"
                className="w-full sm:w-auto rounded-full bg-brand-500 active:scale-95 px-8 py-4 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,91,4,0.4)] hover:shadow-[0_6px_20px_rgba(255,91,4,0.6)] hover:-translate-y-0.5 transition-all duration-300"
              >
                Browse Spaces
              </Link>
              <Link
                href="/become-vendor"
                className="w-full sm:w-auto rounded-full glass-card px-8 py-4 text-sm font-bold text-gray-900 dark:text-white hover:border-slate-500 transition-all duration-300"
              >
                List Your Space
              </Link>
            </div>
          </MotionWrapper>
        </div>
      </section>
    </>
  );
}
