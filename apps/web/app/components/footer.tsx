import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-dark-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-teal-400">
                At
              </span>
              <span className="text-gray-900 dark:text-white">Spaces</span>
            </span>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Premium coworking spaces across Jordan. Book hot desks, private
              offices, and meeting rooms in Amman, Irbid, and Aqaba.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Services
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/spaces?type=hot-desk"
                  className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
                >
                  Hot Desks
                </Link>
              </li>
              <li>
                <Link
                  href="/spaces?type=private-office"
                  className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
                >
                  Private Offices
                </Link>
              </li>
              <li>
                <Link
                  href="/spaces?type=meeting-room"
                  className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
                >
                  Meeting Rooms
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Company
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/become-vendor"
                  className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
                >
                  Become a Vendor
                </Link>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Locations
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/spaces?city=amman"
                  className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
                >
                  Amman
                </Link>
              </li>
              <li>
                <Link
                  href="/spaces?city=irbid"
                  className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
                >
                  Irbid
                </Link>
              </li>
              <li>
                <Link
                  href="/spaces?city=aqaba"
                  className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
                >
                  Aqaba
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-800">
          <p className="text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} AtSpaces. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
