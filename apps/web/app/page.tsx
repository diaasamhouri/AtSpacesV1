import React from 'react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Welcome to the absolute premium&nbsp;
          <code className="font-mono font-bold text-brand-500">AtSpaces</code>
        </p>
      </div>

      <div className="relative flex place-items-center mt-20 before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-brand-500/20 before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-brand-500/30 after:via-brand-500/10 after:blur-2xl after:content-[''] z-[-1]">
        <h1 className="text-6xl font-extrabold tracking-tight text-center sm:text-[5rem] drop-shadow-md z-10 transition-transform duration-500 ease-in-out transform hover:scale-105">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-indigo-400">At</span>Spaces
        </h1>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left mt-16 gap-4">
        <a href="/api/docs" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            Backend API <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Explore the NestJS backend and Swagger JSON Contracts.
          </p>
        </a>
      </div>
    </main>
  );
}
