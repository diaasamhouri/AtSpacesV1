"use client";

import Link from "next/link";
import { MotionWrapper } from "../components/ui/motion-wrapper";
import { IlluminationGraphic } from "../components/illumination-graphic";

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-500 to-brand-300 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
        </div>
        <IlluminationGraphic position="top-right" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <MotionWrapper type="fade-up">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              About <span className="gradient-text">AtSpaces</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500 dark:text-slate-400">
              Building Jordan&apos;s premier workspace marketplace.
            </p>
          </MotionWrapper>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper type="fade-up">
            <div className="glass-card rounded-3xl p-8 sm:p-16 max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Our Mission</h2>
              <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                We&apos;re building Jordan&apos;s premier workspace marketplace, connecting professionals with inspiring environments where they can do their best work. From bustling Amman to coastal Aqaba, AtSpaces makes it effortless to discover, book, and enjoy high-quality workspaces — whether you need a hot desk for an hour or a private office for your growing team.
              </p>
            </div>
          </MotionWrapper>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper type="fade-up" className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">What we stand for</h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">The values that drive everything we do.</p>
          </MotionWrapper>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Flexibility",
                description: "Work should fit your life, not the other way around. We offer hourly, daily, weekly, and monthly plans so you only pay for what you need.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
              },
              {
                title: "Community",
                description: "Great work happens when people connect. Our spaces foster collaboration, networking, and shared growth across industries.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />,
              },
              {
                title: "Innovation",
                description: "We use technology to simplify workspace booking — instant availability, smart recommendations, and seamless payments.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />,
              },
            ].map((value, idx) => (
              <MotionWrapper key={value.title} type="fade-up" delay={0.1 * (idx + 1)}>
                <div className="glass-card glass-card-hover rounded-3xl p-8 h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
                    <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      {value.icon}
                    </svg>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">{value.title}</h3>
                  <p className="mt-3 text-base text-slate-500 dark:text-slate-400 leading-relaxed">{value.description}</p>
                </div>
              </MotionWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper type="fade-up" className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl text-center">Our Story</h2>
            <div className="mt-8 space-y-6 text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
              <p>
                AtSpaces was born from a simple observation: Jordan&apos;s growing community of freelancers, startups, and remote workers needed better access to quality workspaces. Traditional office leases are expensive and inflexible. Cafes are unreliable. Working from home can be isolating.
              </p>
              <p>
                We set out to build a platform that connects workspace owners with the people who need them. By bringing together the best coworking spaces, private offices, and meeting rooms across Amman, Irbid, and Aqaba, we&apos;re making it easy for anyone to find and book the right space at the right time.
              </p>
              <p>
                Today, AtSpaces serves thousands of professionals and continues to grow. Our vision is to make flexible workspaces accessible to everyone in Jordan — and eventually, the region.
              </p>
            </div>
          </MotionWrapper>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <MotionWrapper type="scale-up">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Join the movement</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-500 dark:text-slate-400">
              Whether you&apos;re looking for a workspace or want to list one, we&apos;d love to have you.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
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
                Become a Host
              </Link>
            </div>
          </MotionWrapper>
        </div>
      </section>
    </>
  );
}
