import Link from "next/link";
import { AtSpacesLogo } from "./at-spaces-logo";

const SOCIAL_LINKS = [
  {
    key: 'instagram',
    url: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
    label: 'Instagram',
    icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />,
  },
  {
    key: 'facebook',
    url: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
    label: 'Facebook',
    icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />,
  },
  {
    key: 'linkedin',
    url: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN,
    label: 'LinkedIn',
    icon: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />,
  },
  {
    key: 'twitter',
    url: process.env.NEXT_PUBLIC_SOCIAL_TWITTER,
    label: 'X (Twitter)',
    icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />,
  },
].filter(s => s.url);

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-dark-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="w-12 h-1 bg-brand-500 rounded-full mb-5" />
            <AtSpacesLogo size="md" />
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Premium workspaces across Jordan. Book hot desks, private
              offices, and meeting rooms designed for productivity and collaboration.
            </p>
            {/* Social links - only rendered if URLs are configured */}
            {SOCIAL_LINKS.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                {SOCIAL_LINKS.map((social) => (
                  <a key={social.key} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-brand-500 hover:text-brand-500 transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">{social.icon}</svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-gray-900 dark:text-white">
              Services
            </h3>
            <ul className="mt-4 space-y-1">
              <li className="py-1.5">
                <Link
                  href="/spaces?type=hot-desk"
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-400 transition-colors"
                >
                  Hot Desks
                </Link>
              </li>
              <li className="py-1.5">
                <Link
                  href="/spaces?type=private-office"
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-400 transition-colors"
                >
                  Private Offices
                </Link>
              </li>
              <li className="py-1.5">
                <Link
                  href="/spaces?type=meeting-room"
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-400 transition-colors"
                >
                  Meeting Rooms
                </Link>
              </li>
              <li className="py-1.5">
                <Link
                  href="/ai-assistant"
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-400 transition-colors"
                >
                  AI Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-gray-900 dark:text-white">
              Company
            </h3>
            <ul className="mt-4 space-y-1">
              <li className="py-1.5">
                <Link
                  href="/about"
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li className="py-1.5">
                <Link
                  href="/contact"
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li className="py-1.5">
                <Link
                  href="/become-vendor"
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-400 transition-colors"
                >
                  Become a Host
                </Link>
              </li>
              <li className="py-1.5">
                <Link
                  href="/how-it-works"
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-400 transition-colors"
                >
                  How it Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-gray-900 dark:text-white">
              Locations
            </h3>
            <ul className="mt-4 space-y-1">
              <li className="py-1.5">
                <Link
                  href="/spaces?city=amman"
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-400 transition-colors"
                >
                  Amman
                </Link>
              </li>
              <li className="py-1.5">
                <Link
                  href="/spaces?city=irbid"
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-400 transition-colors"
                >
                  Irbid
                </Link>
              </li>
              <li className="py-1.5">
                <Link
                  href="/spaces?city=aqaba"
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-400 transition-colors"
                >
                  Aqaba
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} AtSpaces. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-slate-500">
            <Link href="/privacy" className="text-sm py-2 hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-sm py-2 hover:text-slate-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
