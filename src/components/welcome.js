export function WelcomePage({ onNext }) {
  return (
    <div className="h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full h-full max-h-[900px] bg-card rounded-lg shadow-sm border border-border p-12 flex flex-col">

        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <h1 className="text-[64px] font-bold text-center">
            Online Search Study
          </h1>
          <p className="text-base text-muted-foreground text-center">
            PI: Subin Seo at University of Maryland, College Park
          </p>
        </div>

        {/* Footer */}
        <div className="pt-6 flex justify-center">
          <button
            onClick={onNext}
            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Go to the consent form →
          </button>
        </div>

      </div>
    </div>
  );
}
