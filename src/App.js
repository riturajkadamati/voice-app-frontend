import React, { useState, useRef } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import axios from "axios";
import { Mic, Square, Loader2, Volume2 } from "lucide-react";
import "./App.css";

const BACKEND_URL = "https://voice-app-backend-9hob.onrender.com";

export default function App() {
  const [status, setStatus] = useState("idle"); // idle | recording | processing | playing
  const [error, setError] = useState(null);
  const [responseText, setResponseText] = useState("");
  const audioRef = useRef(null);

  const { startRecording, stopRecording } = useReactMediaRecorder({
    audio: true,
    onStop: async (blobUrl, blob) => {
      await sendAudioToBackend(blob);
    },
  });

  const sendAudioToBackend = async (blob) => {
    setStatus("processing");
    setError(null);
    setResponseText("");

    try {
      const formData = new FormData();
      // Send as webm (default browser format)
      formData.append("audio", blob, "recording.webm");

      const response = await axios.post(`${BACKEND_URL}/api/talk`, formData, {
        responseType: "blob",
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Create a playable URL from the returned WAV blob
      const audioBlob = new Blob([response.data], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play it automatically
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setStatus("playing");

        audioRef.current.onended = () => {
          setStatus("idle");
        };
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  };

  const handleMicClick = () => {
    if (status === "idle") {
      setStatus("recording");
      startRecording();
    } else if (status === "recording") {
      stopRecording();
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "recording": return "Listening... (tap to stop)";
      case "processing": return "Thinking...";
      case "playing": return "Speaking...";
      default: return "Tap to speak";
    }
  };

  const getMicIcon = () => {
    if (status === "processing") return <Loader2 size={36} className="spin" />;
    if (status === "playing") return <Volume2 size={36} />;
    if (status === "recording") return <Square size={36} />;
    return <Mic size={36} />;
  };

  return (
    <div className="app">
      <div className="card">
        <h1 className="title">Gemini Voice Chat</h1>
        <p className="subtitle">Powered entirely by Gemini</p>

        <div className="orb-wrapper">
          <button
            className={`orb ${status}`}
            onClick={handleMicClick}
            disabled={status === "processing" || status === "playing"}
          >
            {getMicIcon()}
          </button>

          {/* Ripple rings when recording */}
          {status === "recording" && (
            <>
              <div className="ring ring1" />
              <div className="ring ring2" />
            </>
          )}
        </div>

        <p className="status-text">{getStatusText()}</p>

        {error && <p className="error-text">{error}</p>}

        {/* Hidden audio element for playback */}
        <audio ref={audioRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
