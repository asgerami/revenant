export default function Home(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 md:px-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[#ededed]">
          Revenant
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-[#a3a3a3]">
          Find the dead packages in your codebase and bring your code back to life
        </p>
      </div>
    </main>
  );
}
