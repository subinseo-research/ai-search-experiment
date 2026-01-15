export function WelcomePage({ onNext }) {
  return (
    <div className="h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full h-full max-h-[900px] bg-card rounded-lg shadow-sm border border-border p-12 flex flex-col">
        
        <div className="flex-1 flex flex-col justify-center space-y-6">

          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-[64px] font-bold">
              Welcome to our study! 
            </h1>
          </div>

          {/* Main Grid */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Left Column */}
            <div className="space-y-6">

              {/* Study Overview */}
              <div className="space-y-2">
                <h2 className="font-bold">📍 Study Overview</h2>

                <div className="space-y-3 text-muted-foreground">
                  <p>
                    This study explores how people discover interesting or unexpected information while searching online. You will use a search system to explore a topic and reflect on your search experience. Your participation will help inform the design of future search tools.
                  </p>

                  <div>
                    <p className="mb-2">
                      The study consists of three short parts:
                    </p>
                    <ol className="space-y-1.5 list-decimal list-inside ml-2">
                      <li>📝 A brief survey before the task</li>
                      <li>🔍 A short search session</li>
                      <li>📝 A brief survey after the task</li>
                    </ol>
                  </div>

                  <p>
                    ⏱️ The entire study takes about <b>10–12 minutes</b> to complete.
                  </p>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <h3 className="text-secondary-foreground font-bold">
                  📢 Important Notes from Researchers
                </h3>
                <ul className="space-y-1 text-secondary-foreground list-disc list-inside">
                  <li>😊 This is not a test of your knowledge or skills</li>
                  <li>⚠️ There are no right or wrong answers</li>
                  <li>🔒 All data is anonymized.</li>
                </ul>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">

              <div className="space-y-3">
                <h2 className="font-bold">🖥️ Search Session Preview</h2>

                <div className="border border-border rounded-lg overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1762330470070-249e7c23c8c0"
                    alt="Search interface example"
                    className="w-full h-[450px] object-cover"
                  />
                </div>

                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>⏰ You will perform a 4-minute search</li>
                  <li>📌 You can use the scrapbook feature to save interesting findings</li>
                </ul>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 flex justify-end">
          <button
            onClick={onNext}
            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Next: Get Started →
          </button>
        </div>

      </div>
    </div>
  );
}
