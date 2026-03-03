"use client";

import { useState } from "react";
import { apiFetch } from "../../lib/api";
import { MotionWrapper } from "../components/ui/motion-wrapper";

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "general",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiFetch('/contact', {
        method: 'POST',
        body: formState,
      });
    } catch {
      // Still show success - message may have been sent
    }

    setSubmitted(true);
    setSubmitting(false);
  }

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
              <span className="gradient-text">Get in Touch</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500 dark:text-slate-400">
              Have a question, partnership idea, or need support? We&apos;d love to hear from you.
            </p>
          </MotionWrapper>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Form */}
            <MotionWrapper type="fade-up" delay={0.1}>
              <div className="glass-card rounded-3xl p-8">
                {submitted ? (
                  <div className="text-center py-16">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/20 mx-auto mb-6">
                      <svg className="h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Message Sent!</h3>
                    <p className="mt-3 text-slate-500 dark:text-slate-400">We&apos;ll get back to you as soon as possible.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFormState({ name: "", email: "", subject: "general", message: "" });
                      }}
                      className="mt-6 text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Name</label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="w-full glass-input rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-slate-500 text-sm"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Email</label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="w-full glass-input rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-slate-500 text-sm"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Subject</label>
                      <select
                        id="subject"
                        value={formState.subject}
                        onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                        className="w-full glass-input rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="support">Support</option>
                        <option value="partnership">Partnership</option>
                        <option value="vendor">Vendor Inquiry</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Message</label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        value={formState.message}
                        onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                        className="w-full glass-input rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-slate-500 text-sm resize-none"
                        placeholder="How can we help?"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,91,4,0.4)] hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                )}
              </div>
            </MotionWrapper>

            {/* Contact Info */}
            <MotionWrapper type="fade-up" delay={0.2}>
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Information</h2>
                  <p className="mt-3 text-slate-500 dark:text-slate-400">
                    Reach out through any of these channels and we&apos;ll respond within 24 hours.
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />,
                      label: "Email",
                      value: "hello@atspaces.com",
                    },
                    {
                      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />,
                      label: "Phone",
                      value: "+962 6 XXX XXXX",
                    },
                    {
                      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />,
                      label: "Office",
                      value: "Amman, Jordan",
                      extra: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />,
                    },
                  ].map((item) => (
                    <div key={item.label} className="glass-card rounded-2xl p-6 flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 shrink-0">
                        <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          {item.extra || item.icon}
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Map placeholder */}
                <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center min-h-[200px]">
                  <svg className="h-12 w-12 text-brand-500/40 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Our Office</p>
                  <p className="text-xs text-slate-500 mt-1">Amman, Jordan</p>
                </div>
              </div>
            </MotionWrapper>
          </div>
        </div>
      </section>
    </>
  );
}
