import { FigmaAudioPlayer } from "./index";

export default function FigmaAudioPlayerPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8 flex flex-col items-center justify-center gap-8">
      <h1 className="text-white text-2xl font-bold mb-4">
        FigmaAudioPlayer Demo
      </h1>

      <FigmaAudioPlayer
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        timestamp="08:15:23"
        label="Alpha-1"
        transcript="Hostile contact detected at grid reference 4-7. Moving to intercept."
      />

      <FigmaAudioPlayer
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
        timestamp="09:22:45"
        label="Bravo-2"
        transcript="All units be advised, we have visual confirmation of the target. Proceeding with caution."
      />
    </div>
  );
}
