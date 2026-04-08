"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useHistory } from "@/hooks/useHistory";
import { useSignLanguageTranslation } from "@/hooks/useSignLanguageTranslation";

export default function GestureClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [captureRate, setCaptureRate] = useState(2500);
  const [preferredLang, setPreferredLang] = useState("ASL");

  const { speak, isSpeaking } = useTextToSpeech();
  const { addEntry } = useHistory();

  const {
    currentTranslation,
    fullSentence,
    signLanguage,
    confidence,
    isProcessing,
    error: translationError,
    history: translationHistory,
    clearAll,
  } = useSignLanguageTranslation({
    videoRef,
    isActive: cameraActive,
    captureInterval: captureRate,
    language: preferredLang,
  });

  const startCamera = useCallback(async () => {
    try {
      setIsStarting(true);
      setCameraError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setIsStarting(false);
    } catch {
      setCameraError(
        "Camera access denied. Please allow camera permissions and try again."
      );
      setIsStarting(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const switchCamera = useCallback(async () => {
    if (!videoRef.current?.srcObject) return;
    const currentTrack = (
      videoRef.current.srcObject as MediaStream
    ).getVideoTracks()[0];
    const currentFacing = currentTrack.getSettings().facingMode;
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentFacing === "user" ? "environment" : "user",
          width: 1280,
          height: 720,
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError("Failed to switch camera.");
    }
  }, [stopCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleConvertToSpeech = async () => {
    const text = fullSentence || currentTranslation;
    if (!text) return;
    speak(text);
    await addEntry({ text, category: "social", source: "gesture" });
  };

  const handleCopy = () => {
    const text = fullSentence || currentTranslation;
    if (text) navigator.clipboard.writeText(text);
  };

  const confidenceColor =
    confidence === "high"
      ? "bg-tertiary-container text-on-tertiary-container"
      : confidence === "medium"
        ? "bg-secondary-fixed text-on-secondary-fixed"
        : confidence === "low"
          ? "bg-error-container text-on-error-container"
          : "bg-surface-container-high text-on-surface-variant";

  return (
    <div className="flex-1 p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
      {/* Video Viewfinder */}
      <section className="flex-[2] relative rounded-xl overflow-hidden bg-slate-900 group shadow-2xl min-h-[400px]">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
          autoPlay
          playsInline
          muted
        />

        {cameraActive ? (
          <>
            <div className="absolute inset-0 mesh-overlay pointer-events-none opacity-30" />
            {isProcessing && (
              <div className="absolute inset-0 border-4 border-primary/40 rounded-xl animate-pulse pointer-events-none" />
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/60 gap-6 p-8">
            <div className="flex items-center gap-6 mb-2">
              <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400" style={{ fontSize: '44px', fontVariationSettings: "'FILL' 1" }}>sign_language</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-blue-400/60 animate-pulse" style={{ fontSize: '28px' }}>arrow_forward</span>
                <span className="material-symbols-outlined text-blue-300/40" style={{ fontSize: '20px' }}>auto_awesome</span>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400" style={{ fontSize: '44px', fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
              </div>
            </div>

            <div className="text-center max-w-lg">
              <h3 className="text-2xl font-bold text-white mb-3">
                Sign Language Translator
              </h3>
              <p className="text-white/50 mb-6">
                Point your camera at someone using sign language. Gemma 3 Vision
                AI will detect and translate their gestures in real-time.
              </p>
            </div>

            <button
              onClick={startCamera}
              disabled={isStarting}
              className="hero-gradient text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-xl"
            >
              <span className="material-symbols-outlined text-2xl">
                {isStarting ? "hourglass_empty" : "videocam"}
              </span>
              {isStarting ? "Starting Camera..." : "Start Translation"}
            </button>
            {cameraError && (
              <p className="text-error text-sm text-center">{cameraError}</p>
            )}

            {/* Sign Language Selector */}
            <div className="w-full max-w-xl mt-2 bg-white/5 rounded-xl p-5">
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
                Sign Language
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {["ASL", "ISL", "BSL", "auto"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setPreferredLang(lang)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      preferredLang === lang
                        ? "bg-blue-500 text-white"
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    {lang === "auto" ? "Auto Detect" : lang}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] text-white/40 leading-relaxed">
                <div className="flex gap-2">
                  <span className="font-bold text-blue-400 min-w-[32px]">ASL</span>
                  <span>American Sign Language — US &amp; Canada</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-orange-400 min-w-[32px]">ISL</span>
                  <span>Indian Sign Language — India</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-green-400 min-w-[32px]">BSL</span>
                  <span>British Sign Language — UK</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-white/50 min-w-[32px]">Auto</span>
                  <span>Let Gemma AI auto-detect</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Badges */}
        {cameraActive && (
          <div className="absolute top-6 left-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-on-surface uppercase tracking-widest">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-container text-on-primary-container rounded-full shadow-sm">
              <span className="material-symbols-outlined text-sm">
                auto_awesome
              </span>
              <span className="text-xs font-bold">Gemma 3 Vision</span>
            </div>
            {signLanguage && signLanguage !== "none" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary-container text-on-tertiary-container rounded-full shadow-sm">
                <span className="material-symbols-outlined text-sm">
                  translate
                </span>
                <span className="text-xs font-bold uppercase">
                  {signLanguage}
                </span>
              </div>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary-fixed text-on-secondary-fixed rounded-full shadow-sm">
                <div className="w-2 h-2 rounded-full bg-secondary animate-spin" />
                <span className="text-xs font-bold">Analyzing...</span>
              </div>
            )}
          </div>
        )}

        {/* Camera Controls */}
        {cameraActive && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <button
              onClick={switchCamera}
              className="flex items-center gap-2 px-5 py-3 bg-surface-container-lowest text-on-surface rounded-full shadow-lg hover:bg-white transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">
                flip_camera_ios
              </span>
              <span className="text-sm font-semibold">Switch</span>
            </button>
            <button
              onClick={stopCamera}
              className="p-3 bg-error text-white rounded-full shadow-lg hover:opacity-90 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">stop</span>
            </button>
          </div>
        )}
      </section>

      {/* Translation & Control Panel */}
      <section className="flex-1 flex flex-col gap-5 md:max-w-[380px]">
        {/* Live Translation Card */}
        <div className="bg-surface-container-low p-8 rounded-xl flex-1 flex flex-col ambient-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black text-primary uppercase tracking-widest">
              Live Translation
            </h2>
            <div className="flex items-center gap-2">
              {confidence && confidence !== "none" && (
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${confidenceColor}`}
                >
                  {confidence}
                </span>
              )}
              <span className="material-symbols-outlined text-slate-400">
                translate
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-[200px]">
            {fullSentence || currentTranslation ? (
              <div className="space-y-4">
                <p className="text-3xl font-light leading-relaxed text-slate-800">
                  {fullSentence || currentTranslation}
                </p>
                {signLanguage && signLanguage !== "none" && (
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider">
                    Detected: {signLanguage}
                  </p>
                )}
              </div>
            ) : isProcessing ? (
              <div className="space-y-4">
                <p className="text-3xl font-light leading-relaxed text-slate-400">
                  <span className="inline-block px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-lg text-lg font-medium italic animate-pulse">
                    analyzing gesture...
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-2xl font-light text-on-surface-variant opacity-40 italic">
                {cameraActive
                  ? "Point camera at someone signing..."
                  : "Start the camera to begin translating"}
              </p>
            )}

            {translationError && (
              <div className="mt-4 p-3 bg-error-container rounded-lg">
                <p className="text-sm text-on-error-container">
                  {translationError}
                </p>
              </div>
            )}
          </div>

          {/* Translation History Scroll */}
          {translationHistory.length > 1 && (
            <div className="mt-4 pt-4 border-t border-outline-variant/20">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Recent Translations
              </p>
              <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto">
                {translationHistory
                  .slice(-5)
                  .reverse()
                  .map((entry, i) => (
                    <div
                      key={entry.timestamp}
                      className={`text-sm ${i === 0 ? "text-on-surface font-medium" : "text-on-surface-variant"}`}
                    >
                      {entry.translation}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => speak(fullSentence || currentTranslation)}
              disabled={!currentTranslation}
              className="flex-1 flex flex-col items-center justify-center p-4 bg-surface-container-lowest rounded-xl hover:bg-primary-fixed transition-colors text-slate-600 hover:text-primary active:scale-95 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-2xl">
                volume_up
              </span>
              <span className="text-[10px] font-bold mt-2">PLAY</span>
            </button>
            <button
              onClick={clearAll}
              className="flex-1 flex flex-col items-center justify-center p-4 bg-surface-container-lowest rounded-xl hover:bg-primary-fixed transition-colors text-slate-600 hover:text-primary active:scale-95"
            >
              <span className="material-symbols-outlined text-2xl">
                delete_sweep
              </span>
              <span className="text-[10px] font-bold mt-2">CLEAR</span>
            </button>
            <button
              onClick={handleCopy}
              disabled={!currentTranslation}
              className="flex-1 flex flex-col items-center justify-center p-4 bg-surface-container-lowest rounded-xl hover:bg-primary-fixed transition-colors text-slate-600 hover:text-primary active:scale-95 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-2xl">
                content_copy
              </span>
              <span className="text-[10px] font-bold mt-2">COPY</span>
            </button>
          </div>
        </div>

        {/* Convert to Speech CTA */}
        <button
          onClick={handleConvertToSpeech}
          disabled={(!fullSentence && !currentTranslation) || isSpeaking}
          className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-6 px-8 rounded-full flex items-center justify-center gap-4 shadow-xl active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-3xl">
            record_voice_over
          </span>
          <span className="text-xl font-bold tracking-tight">
            {isSpeaking ? "Speaking..." : "Convert to Speech"}
          </span>
        </button>

        {/* Capture Rate Control */}
        <div className="bg-surface-container-high/50 p-5 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Capture Speed
            </p>
            <span className="text-xs font-bold text-primary">
              {(captureRate / 1000).toFixed(1)}s
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="5000"
            step="500"
            value={captureRate}
            onChange={(e) => setCaptureRate(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
            <span>Faster (1s)</span>
            <span>Slower (5s)</span>
          </div>
        </div>
      </section>

      {/* Powered by — moved to AppShell footer */}
    </div>
  );
}
