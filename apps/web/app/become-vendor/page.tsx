import Link from "next/link";

export default function BecomeVendorPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          List your space on{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-teal-400">
            AtSpaces
          </span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Join our network of coworking spaces across Jordan. Reach more
          customers and manage your bookings effortlessly.
        </p>
      </div>

      <div className="mt-12 space-y-6">
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            1. Create your account
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign up as a customer first, then apply to become a vendor.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            2. Submit your space details
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Provide information about your coworking space, including location,
            services, and pricing.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            3. Get approved and start earning
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Our team reviews your application. Once approved, your space goes
            live and customers can book instantly.
          </p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/auth/signup"
          className="inline-flex rounded-lg bg-brand-500 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-500/90 transition-colors"
        >
          Get Started
        </Link>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-brand-500 hover:text-brand-500/80"
          >
            Sign in
          </Link>{" "}
          and apply from your dashboard.
        </p>
      </div>
    </div>
  );
}
