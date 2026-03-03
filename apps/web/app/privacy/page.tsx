"use client";

import { MotionWrapper } from "../components/ui/motion-wrapper";

const sections = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    content: `We collect information you provide directly to us, including:

- **Account Information**: Name, email address, phone number, and password when you create an account.
- **Profile Information**: Profile photo, bio, and preferences you choose to add.
- **Booking Information**: Details about your workspace bookings, including dates, times, and payment methods.
- **Payment Information**: Payment card details processed securely through our payment providers. We do not store full card numbers on our servers.
- **Communications**: Messages you send through our platform, including reviews and support requests.
- **Vendor Information**: Business details, bank account information, and space listings if you register as a vendor.`,
  },
  {
    id: "how-we-use-it",
    title: "How We Use Your Information",
    content: `We use the information we collect to:

- Provide, maintain, and improve our services
- Process bookings and payments
- Send you booking confirmations, updates, and receipts
- Communicate with you about products, services, and promotions
- Monitor and analyze trends, usage, and activities
- Detect, investigate, and prevent fraudulent transactions and abuse
- Personalize your experience and provide relevant recommendations
- Comply with legal obligations`,
  },
  {
    id: "data-sharing",
    title: "Data Sharing",
    content: `We may share your information in the following circumstances:

- **With Vendors**: When you make a booking, we share your name and contact information with the workspace vendor to facilitate your visit.
- **With Service Providers**: We work with third-party companies to provide services such as payment processing, email delivery, and analytics.
- **For Legal Reasons**: We may disclose information if required by law, regulation, or legal process.
- **Business Transfers**: In connection with any merger, acquisition, or sale of company assets.

We do not sell your personal information to third parties.`,
  },
  {
    id: "cookies",
    title: "Cookies & Tracking",
    content: `We use cookies and similar technologies to:

- Keep you signed in to your account
- Remember your preferences and settings
- Analyze how our platform is used
- Deliver relevant content and recommendations

You can control cookies through your browser settings. Disabling cookies may limit your ability to use certain features of our platform.`,
  },
  {
    id: "data-security",
    title: "Data Security",
    content: `We implement appropriate technical and organizational measures to protect your personal information, including:

- Encryption of data in transit (TLS/SSL) and at rest
- Regular security assessments and penetration testing
- Access controls and authentication requirements
- Secure payment processing through PCI-compliant providers

While we strive to protect your information, no method of transmission over the internet is 100% secure.`,
  },
  {
    id: "your-rights",
    title: "Your Rights",
    content: `You have the right to:

- **Access**: Request a copy of your personal data
- **Correction**: Update or correct inaccurate information
- **Deletion**: Request deletion of your account and personal data
- **Portability**: Request your data in a machine-readable format
- **Objection**: Object to certain processing of your information

To exercise these rights, contact us at privacy@atspaces.com.`,
  },
  {
    id: "contact-us",
    title: "Contact Us",
    content: `If you have any questions about this Privacy Policy, please contact us at:

- **Email**: privacy@atspaces.com
- **Address**: Amman, Jordan
- **Phone**: +962 6 XXX XXXX

We will respond to your inquiry within 30 days.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <MotionWrapper type="fade-up">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">Privacy Policy</h1>
            <p className="mt-4 text-slate-500 dark:text-slate-400">Last updated: February 2026</p>
          </MotionWrapper>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper type="fade-up">
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-12">
              At AtSpaces, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
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
