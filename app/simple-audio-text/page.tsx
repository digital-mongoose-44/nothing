import AudioPlayer from "./AudioPlayer";

const SimpleAudioText = () => {
  return (
      <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0f10 0%, #1a1a1f 100%)",
        padding: "24px",
      }}
    >
      <AudioPlayer
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        title="Midnight Dreams"
        artist="Electronic Waves"
      />
    </div>
  );
};

export default SimpleAudioText;