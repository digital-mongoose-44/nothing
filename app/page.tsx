import { Chat } from "./components/Chat";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Radio Traffic Player
        </h1>
      </header>
      <main className="flex-1">
        <Chat />
      </main>
    </div>
  );
}
