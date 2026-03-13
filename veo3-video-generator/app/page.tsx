import { VideoGenerator } from "@/components/VideoGenerator";

export default function Home() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Veo 3 Video Generator
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Describe a scene and let{" "}
            <span className="font-medium text-foreground">Claude</span> craft
            the perfect prompt for{" "}
            <span className="font-medium text-foreground">Google Veo 3</span>
          </p>
        </header>

        <VideoGenerator />
      </div>
    </main>
  );
}
