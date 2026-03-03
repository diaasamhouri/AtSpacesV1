"use client";

import Link from "next/link";
import { MotionWrapper } from "../components/ui/motion-wrapper";

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-500 to-brand-300 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <MotionWrapper type="fade-up">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              How <span className="gradient-text">AtSpaces</span> Works
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500 dark:text-slate-400">
              Finding and booking your ideal workspace takes just three simple steps.
            </p>
          </MotionWrapper>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {/* Step 1 */}
            <MotionWrapper type="fade-up" delay={0.1}>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">1</span>
                    <span className="text-sm font-bold text-brand-500 uppercase tracking-wider">Discover</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Find your perfect space</h2>
                  <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                    Search by city, workspace type, or amenities. Use our filters to narrow down by price range, availability windows, and community ratings. Whether you need a hot desk for an afternoon or a private office for your team, the right space is a search away.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {["Search across Amman, Irbid, and Aqaba", "Filter by workspace type and amenities", "Compare prices and read reviews"].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <svg className="h-5 w-5 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass-card rounded-3xl p-8 flex items-center justify-center min-h-[280px]">
                  <svg className="h-24 w-24 text-brand-500/40" fill="none" viewBox="0 0 24 24" strokeWidth="0.75" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
              </div>
            </MotionWrapper>

            {/* Step 2 */}
            <MotionWrapper type="fade-up" delay={0.1}>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="glass-card rounded-3xl p-8 flex items-center justify-center min-h-[280px] md:order-first order-last">
                  <svg className="h-24 w-24 text-brand-500/40" fill="none" viewBox="0 0 24 24" strokeWidth="0.75" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">2</span>
                    <span className="text-sm font-bold text-brand-500 uppercase tracking-wider">Book Instantly</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Reserve in seconds</h2>
                  <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                    Select your service, pick your time slot, and apply any promo codes. Pay securely with Visa, Mastercard, or Apple Pay. Many spaces offer instant confirmation so you can plan with confidence.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {["Choose hourly, half-day, daily, or monthly plans", "Apply promo codes for discounts", "Secure payment with instant confirmation"].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <svg className="h-5 w-5 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </MotionWrapper>

            {/* Step 3 */}
            <MotionWrapper type="fade-up" delay={0.1}>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">3</span>
                    <span className="text-sm font-bold text-brand-500 uppercase tracking-wider">Work & Thrive</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Show up and succeed</h2>
                  <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                    Check in at the location, enjoy premium amenities, and focus on what matters. After your session, rate and review your experience to help the community.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {["Check in at the location with your booking code", "Enjoy high-speed WiFi, coffee, and more", "Rate and review to help fellow professionals"].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <svg className="h-5 w-5 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass-card rounded-3xl p-8 flex items-center justify-center min-h-[280px]">
                  <svg className="h-24 w-24 text-brand-500/40" fill="none" viewBox="0 0 24 24" strokeWidth="0.75" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </div>
              </div>
            </MotionWrapper>
          </div>
        </div>
      </section>

      {/* For Vendors Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper type="fade-up">
            <div className="glass-card rounded-3xl p-8 sm:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-500/5 pointer-events-none blur-3xl rounded-full translate-y-1/2" aria-hidden="true" />
              <h2 className="relative z-10 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Are you a space owner?
              </h2>
              <p className="relative z-10 mx-auto mt-6 max-w-2xl text-lg text-slate-500 dark:text-slate-400">
                List your space on AtSpaces and reach thousands of professionals looking for the perfect work environment. Manage bookings, track earnings, and grow your business effortlessly.
              </p>
              <div className="relative z-10 mt-8 grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
                {[
                  { title: "List Your Space", desc: "Create your profile and add branches with photos and pricing" },
                  { title: "Reach More Clients", desc: "Get discovered by professionals across Jordan" },
                  { title: "Manage Easily", desc: "Track bookings, earnings, and reviews from one dashboard" },
                ].map((item) => (
                  <div key={item.title} className="text-left">
                    <h3 className="text-sm font-bold text-brand-500">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </MotionWrapper>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <MotionWrapper type="scale-up">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-500 dark:text-slate-400">
              Join thousands of professionals who have found their perfect workspace.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/spaces"
                className="w-full sm:w-auto rounded-full bg-brand-500 active:scale-95 px-8 py-4 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,91,4,0.4)] hover:shadow-[0_6px_20px_rgba(255,91,4,0.6)] hover:-translate-y-0.5 transition-all duration-300"
              >
                Book Now
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
    </>
  );
}
