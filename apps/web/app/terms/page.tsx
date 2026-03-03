"use client";

import { MotionWrapper } from "../components/ui/motion-wrapper";

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: `By accessing or using the AtSpaces platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this platform.

These terms apply to all users of the platform, including customers, vendors, and visitors.`,
  },
  {
    id: "user-accounts",
    title: "User Accounts",
    content: `To use certain features of AtSpaces, you must create an account. You agree to:

- Provide accurate and complete information during registration
- Maintain the security of your account credentials
- Notify us immediately of any unauthorized access to your account
- Accept responsibility for all activities that occur under your account

We reserve the right to suspend or terminate accounts that violate these terms or are involved in fraudulent activity.`,
  },
  {
    id: "bookings-payments",
    title: "Bookings & Payments",
    content: `When you book a workspace through AtSpaces:

- **Pricing**: All prices are displayed in Jordanian Dinar (JOD) and include applicable taxes unless otherwise stated.
- **Payment**: Payment is required at the time of booking. We accept Visa, Mastercard, Apple Pay, and cash (at vendor discretion).
- **Confirmation**: Bookings may be subject to vendor approval. You will receive a confirmation once your booking is accepted.
- **Accuracy**: You are responsible for ensuring the accuracy of your booking details, including dates, times, and services selected.`,
  },
  {
    id: "vendor-responsibilities",
    title: "Vendor Responsibilities",
    content: `If you register as a vendor on AtSpaces, you agree to:

- Provide accurate descriptions of your spaces and services
- Maintain the quality and safety of your workspace
- Honor confirmed bookings and pricing
- Respond to booking requests in a timely manner
- Comply with all applicable local laws and regulations
- Maintain appropriate insurance for your workspace

AtSpaces reserves the right to remove vendor listings that do not meet our quality standards or violate these terms.`,
  },
  {
    id: "cancellation",
    title: "Cancellation Policy",
    content: `Cancellation policies vary by vendor and are displayed at the time of booking. General guidelines:

- **Customer Cancellations**: Cancellations made more than 24 hours before the booking start time are eligible for a full refund. Cancellations within 24 hours may be subject to a cancellation fee.
- **Vendor Cancellations**: If a vendor cancels a confirmed booking, the customer will receive a full refund.
- **No-Shows**: Failure to check in within the first 30 minutes of your booking may result in the booking being marked as a no-show, at the vendor's discretion.
- **Refunds**: Refunds are processed to the original payment method within 5-10 business days.`,
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    content: `AtSpaces provides a marketplace connecting workspace seekers with workspace providers. We do not own, operate, or manage the workspaces listed on our platform.

- AtSpaces is not liable for the condition, safety, or quality of any workspace
- We are not responsible for any personal injury, property damage, or loss arising from the use of a workspace
- Our total liability shall not exceed the amount you paid through the platform in the 12 months preceding the claim
- We are not liable for any indirect, incidental, or consequential damages`,
  },
  {
    id: "governing-law",
    title: "Governing Law",
    content: `These Terms of Service shall be governed by and construed in accordance with the laws of the Hashemite Kingdom of Jordan.

Any disputes arising from or relating to these terms shall be resolved through the courts of Amman, Jordan. Before pursuing legal action, both parties agree to attempt resolution through good-faith negotiation.`,
  },
  {
    id: "contact",
    title: "Contact",
    content: `If you have any questions about these Terms of Service, please contact us:

- **Email**: legal@atspaces.com
- **Address**: Amman, Jordan
- **Phone**: +962 6 XXX XXXX`,
  },
];

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <MotionWrapper type="fade-up">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">Terms of Service</h1>
            <p className="mt-4 text-slate-500 dark:text-slate-400">Last updated: February 2026</p>
          </MotionWrapper>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper type="fade-up">
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-12">
              Welcome to AtSpaces. These Terms of Service govern your use of our platform and services. Please read them carefully before using our platform.
            </p>
          </MotionWrapper>

          <div className="space-y-8">
            {sections.map((section, idx) => (
              <MotionWrapper key={section.id} type="fade-up" delay={0.05 * (idx + 1)}>
                <div id={section.id} className="glass-card rounded-2xl p-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{section.title}</h2>
                  <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm [[&_strong]:text-white_strong]:text-gray-900 dark:[[&_strong]:text-white_strong]:text-white [&_strong]:font-semibold">
                    {section.content}
                  </div>
                </div>
              </MotionWrapper>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
