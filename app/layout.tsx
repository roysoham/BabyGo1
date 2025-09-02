export const metadata = { title: "BabyGo v1", description: "Global baby travel planner" };
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <header className="flex items-center gap-3">
            <img src="/logo-babygo.svg" alt="BabyGo" className="h-10 w-auto" />
            <h1 className="text-2xl font-extrabold tracking-tight">BabyGo v1</h1>
          </header>
          <main className="mt-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
