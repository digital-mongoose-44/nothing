import { Chat } from "./components/Chat";
import { ThemeToggle } from "./components/ThemeToggle";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold text-foreground">
          Radio Traffic Assistant
        </h1>
        <ThemeToggle />
      </header>
      <main className="flex-1">
        <Chat />
      </main>
    </div>
  );
}
