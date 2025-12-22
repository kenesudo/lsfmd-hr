import Button from "@/components/Button";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <div className="relative h-full w-full">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/landing-bg.svg')" }}
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 h-full flex flex-col">
          <Navbar />

          <main className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-3xl text-center">
              <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 tracking-tight">
                Human Resources
              </h1>
              <p className="text-lg sm:text-xl text-white/80 mb-10">
                Los Santos Fire and Medical Department
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/dashboard">
                  <Button size="lg" variant="primary" className="w-full sm:w-auto">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
