"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useHistory } from "@/hooks/useHistory";
import { useSignLanguageTranslation } from "@/hooks/useSignLanguageTranslation";
import { useHandTracking, HAND_CONNECTIONS } from "@/hooks/useHandTracking";
import { getGesturePhrase } from "@/lib/gesture-map";
import { exportConversation } from "@/lib/export";

export default function GestureClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [captureRate, setCaptureRate] = useState(2500);
  const [preferredLang, setPreferredLang] = useState("ASL");
  const [isOnline, setIsOnline] = useState(true);
  // Two-way communication
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [replySigns, setReplySigns] = useState<Array<{ word: string; sign: string; description: string; emoji: string }>>([]);
  const [isLoadingSigns, setIsLoadingSigns] = useState(false);

  const { speak, isSpeaking } = useTextToSpeech();
  const { addEntry } = useHistory();

  // Check online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // MediaPipe hand tracking (runs always when camera active — must be before translation hook)
  const { hands, handCount, isLoaded: handTrackingLoaded, offlineGesture } = useHandTracking({
    videoRef,
    isActive: cameraActive,
  });

  const {
    currentTranslation,
    fullSentence,
    signLanguage,
    confidence,
    isProcessing,
    streamingText,
    error: translationError,
    history: translationHistory,
    clearAll,
  } = useSignLanguageTranslation({
    videoRef,
    isActive: cameraActive && isOnline,
    captureInterval: captureRate,
    language: preferredLang,
    handsDetected: handCount > 0,
    onTranslation: (text, sl) => {
      addEntry({ text, category: "social", source: "gesture" });
    },
  });

  // Offline fallback translation
  const offlineTranslation = offlineGesture ? getGesturePhrase(offlineGesture) : null;

  const displayTranslation = isOnline
    ? fullSentence || currentTranslation
    : offlineTranslation || "";

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
      setCameraError("Camera access denied. Please allow camera permissions and try again.");
      setIsStarting(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const switchCamera = useCallback(async () => {
    if (!videoRef.current?.srcObject) return;
    const currentTrack = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
    const currentFacing = currentTrack.getSettings().facingMode;
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacing === "user" ? "environment" : "user", width: 1280, height: 720 },
      });
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraActive(true);
    } catch { setCameraError("Failed to switch camera."); }
  }, [stopCamera]);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  const handleConvertToSpeech = async () => {
    if (!displayTranslation) return;
    speak(displayTranslation);
    await addEntry({ text: displayTranslation, category: "social", source: "gesture" });
  };

  const handleCopy = () => {
    if (displayTranslation) navigator.clipboard.writeText(displayTranslation);
  };

  const handleExport = () => {
    if (translationHistory.length === 0) return;
    exportConversation(translationHistory);
  };

  // Two-way: send reply as large text + sign language guide
  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setShowReply(true);
    setReplySigns([]);
    speak(replyText);

    // Fetch sign language breakdown
    setIsLoadingSigns(true);
    try {
      const res = await fetch("/api/text-to-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText, signLanguage: preferredLang }),
      });
      if (res.ok) {
        const data = await res.json();
        setReplySigns(data.signs || []);
      }
    } catch {}
    setIsLoadingSigns(false);
  };

  const confidenceColor =
    confidence === "high" ? "bg-tertiary-container text-on-tertiary-container"
    : confidence === "medium" ? "bg-secondary-fixed text-on-secondary-fixed"
    : confidence === "low" ? "bg-error-container text-on-error-container"
    : "bg-surface-container-high text-on-surface-variant";

  return (
    <div className="flex-1 p-4 flex flex-col md:flex-row gap-4 overflow-hidden h-[calc(100vh-80px)]">
      {/* Video Viewfinder */}
      <section className="flex-[2] relative rounded-xl overflow-hidden bg-slate-900 group shadow-2xl min-h-[400px]">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
          autoPlay playsInline muted
        />

        {cameraActive ? (
          <>
            <div className="absolute inset-0 mesh-overlay pointer-events-none opacity-30" />
            {isProcessing && (
              <div className="absolute inset-0 border-4 border-primary/40 rounded-xl animate-pulse pointer-events-none" />
            )}

            {/* Hand Skeleton Overlay */}
            {hands.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1 1" preserveAspectRatio="xMidYMid slice">
                {hands.map((hand, hi) =>
                  <g key={hi}>
                    {hand.map((lm, i) => (
                      <circle key={`${hi}-${i}`} cx={lm.x} cy={lm.y} r="0.006" fill="rgba(96, 165, 250, 0.7)" />
                    ))}
                    {HAND_CONNECTIONS.map(([a, b], ci) => (
                      hand[a] && hand[b] && (
                        <line key={`${hi}-l-${ci}`} x1={hand[a].x} y1={hand[a].y} x2={hand[b].x} y2={hand[b].y}
                          stroke="rgba(96, 165, 250, 0.5)" strokeWidth="0.003" />
                      )
                    ))}
                  </g>
                )}
              </svg>
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
              <h3 className="text-2xl font-bold text-white mb-3">Sign Language Translator</h3>
              <p className="text-white/50 mb-6">Point your camera at someone using sign language. Gemma 3 Vision AI will detect and translate their gestures in real-time.</p>
            </div>
            <button onClick={startCamera} disabled={isStarting}
              className="hero-gradient text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-xl">
              <span className="material-symbols-outlined text-2xl">{isStarting ? "hourglass_empty" : "videocam"}</span>
              {isStarting ? "Starting Camera..." : "Start Translation"}
            </button>
            {cameraError && <p className="text-error text-sm text-center">{cameraError}</p>}

            {/* Sign Language Selector */}
            <div className="w-full max-w-xl mt-2 bg-white/5 rounded-xl p-5">
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Sign Language</p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {["ASL", "ISL", "BSL", "auto"].map((lang) => (
                  <button key={lang} onClick={() => setPreferredLang(lang)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${preferredLang === lang ? "bg-blue-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
                    {lang === "auto" ? "Auto Detect" : lang}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] text-white/40 leading-relaxed">
                <div className="flex gap-2"><span className="font-bold text-blue-400 min-w-[32px]">ASL</span><span>American Sign Language — US &amp; Canada</span></div>
                <div className="flex gap-2"><span className="font-bold text-orange-400 min-w-[32px]">ISL</span><span>Indian Sign Language — India</span></div>
                <div className="flex gap-2"><span className="font-bold text-green-400 min-w-[32px]">BSL</span><span>British Sign Language — UK</span></div>
                <div className="flex gap-2"><span className="font-bold text-white/50 min-w-[32px]">Auto</span><span>Let Gemma AI auto-detect</span></div>
              </div>

              {/* Capture Speed */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Capture Speed</p>
                  <span className="text-[10px] font-bold text-blue-400">{(captureRate / 1000).toFixed(1)}s</span>
                </div>
                <input type="range" min="1000" max="5000" step="500" value={captureRate}
                  onChange={(e) => setCaptureRate(Number(e.target.value))} className="w-full accent-blue-400 h-1" />
              </div>
            </div>
          </div>
        )}

        {/* Status Badges */}
        {cameraActive && (
          <div className="absolute top-6 left-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-on-surface uppercase tracking-widest">LIVE</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-container text-on-primary-container rounded-full shadow-sm">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span className="text-xs font-bold">{isOnline ? "Gemma 3 Vision" : "Offline Mode"}</span>
            </div>
            {handTrackingLoaded && handCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary-fixed text-on-tertiary-fixed rounded-full shadow-sm">
                <span className="material-symbols-outlined text-sm">pan_tool</span>
                <span className="text-xs font-bold">{handCount} hand{handCount > 1 ? "s" : ""}</span>
              </div>
            )}
            {!isOnline && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-error-container text-on-error-container rounded-full shadow-sm">
                <span className="material-symbols-outlined text-sm">cloud_off</span>
                <span className="text-xs font-bold">Offline</span>
              </div>
            )}
            {signLanguage && signLanguage !== "none" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary-container text-on-tertiary-container rounded-full shadow-sm">
                <span className="material-symbols-outlined text-sm">translate</span>
                <span className="text-xs font-bold uppercase">{signLanguage}</span>
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
            <button onClick={switchCamera}
              className="flex items-center gap-2 px-5 py-3 bg-surface-container-lowest text-on-surface rounded-full shadow-lg hover:bg-white transition-all active:scale-95">
              <span className="material-symbols-outlined">flip_camera_ios</span>
              <span className="text-sm font-semibold">Switch</span>
            </button>
            <button onClick={stopCamera}
              className="p-3 bg-error text-white rounded-full shadow-lg hover:opacity-90 transition-all active:scale-95">
              <span className="material-symbols-outlined">stop</span>
            </button>
          </div>
        )}

        {/* Two-way reply display — always available */}
        {showReply && replyText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="bg-black/90 backdrop-blur-md text-white rounded-2xl max-w-[90%] max-h-[80%] overflow-y-auto pointer-events-auto p-6">
              <p className="text-4xl font-bold text-center mb-4 leading-tight">{replyText}</p>

              {isLoadingSigns ? (
                <div className="flex items-center justify-center gap-2 text-white/60 py-4">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span className="text-sm">Generating sign guide...</span>
                </div>
              ) : replySigns.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 text-center">
                    How to sign this in {preferredLang}
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {replySigns.map((sign, i) => (
                      <div key={i} className="flex flex-col items-center bg-white/10 rounded-xl p-3 min-w-[80px] max-w-[120px]">
                        <span className="text-3xl mb-1">{sign.emoji}</span>
                        <span className="text-sm font-bold text-center">{sign.sign}</span>
                        <span className="text-[10px] text-white/50 text-center mt-1 leading-tight">{sign.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => { setShowReply(false); setReplySigns([]); }}
                className="block mx-auto mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Translation & Control Panel */}
      <section className="flex-1 flex flex-col gap-3 md:max-w-[380px] overflow-y-auto">
        {/* Live Translation Card */}
        <div className="bg-surface-container-low p-5 rounded-xl flex-1 flex flex-col ambient-shadow min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">
              {isOnline ? "Live Translation" : "Offline Mode"}
            </h2>
            <div className="flex items-center gap-2">
              {confidence && confidence !== "none" && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${confidenceColor}`}>
                  {confidence}
                </span>
              )}
              <span className="material-symbols-outlined text-slate-400 text-lg">translate</span>
            </div>
          </div>

          <div className="flex flex-col justify-center min-h-[80px]">
            {displayTranslation ? (
              <div>
                <p className="text-2xl font-light leading-snug text-slate-800">{displayTranslation}</p>
                {isOnline && signLanguage && signLanguage !== "none" && (
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">Detected: {signLanguage}</p>
                )}
                {!isOnline && offlineGesture && (
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">MediaPipe: {offlineGesture}</p>
                )}
              </div>
            ) : streamingText ? (
              <p className="text-xl font-light leading-snug text-slate-500 italic">
                {streamingText}<span className="animate-pulse">|</span>
              </p>
            ) : isProcessing ? (
              <span className="inline-block px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-lg text-sm font-medium italic animate-pulse self-start">
                analyzing gesture...
              </span>
            ) : (
              <p className="text-lg font-light text-on-surface-variant opacity-40 italic">
                {cameraActive ? "Point camera at someone signing..." : "Start camera to translate"}
              </p>
            )}
            {translationError && (
              <div className="mt-2 p-2 bg-error-container rounded-lg">
                <p className="text-xs text-on-error-container">{translationError}</p>
              </div>
            )}
          </div>

          {/* Translation History */}
          {translationHistory.length > 1 && (
            <div className="mt-3 pt-3 border-t border-outline-variant/20">
              <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Conversation</p>
              <div className="flex flex-col gap-1 max-h-[60px] overflow-y-auto">
                {translationHistory.slice(-3).reverse().map((entry, i) => (
                  <div key={entry.timestamp} className={`text-xs ${i === 0 ? "text-on-surface font-medium" : "text-on-surface-variant"}`}>
                    {entry.translation}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-auto pt-3 flex gap-2">
            <button onClick={handleConvertToSpeech} disabled={!displayTranslation || isSpeaking}
              className="flex-1 flex items-center justify-center gap-1 p-2 bg-surface-container-lowest rounded-lg hover:bg-primary-fixed transition-colors text-slate-600 hover:text-primary active:scale-95 disabled:opacity-40">
              <span className="material-symbols-outlined text-lg">volume_up</span>
              <span className="text-[9px] font-bold">PLAY</span>
            </button>
            <button onClick={clearAll}
              className="flex-1 flex items-center justify-center gap-1 p-2 bg-surface-container-lowest rounded-lg hover:bg-primary-fixed transition-colors text-slate-600 hover:text-primary active:scale-95">
              <span className="material-symbols-outlined text-lg">delete_sweep</span>
              <span className="text-[9px] font-bold">CLEAR</span>
            </button>
            <button onClick={handleCopy} disabled={!displayTranslation}
              className="flex-1 flex items-center justify-center gap-1 p-2 bg-surface-container-lowest rounded-lg hover:bg-primary-fixed transition-colors text-slate-600 hover:text-primary active:scale-95 disabled:opacity-40">
              <span className="material-symbols-outlined text-lg">content_copy</span>
              <span className="text-[9px] font-bold">COPY</span>
            </button>
            <button onClick={handleExport} disabled={translationHistory.length === 0}
              className="flex-1 flex items-center justify-center gap-1 p-2 bg-surface-container-lowest rounded-lg hover:bg-primary-fixed transition-colors text-slate-600 hover:text-primary active:scale-95 disabled:opacity-40">
              <span className="material-symbols-outlined text-lg">download</span>
              <span className="text-[9px] font-bold">EXPORT</span>
            </button>
          </div>
        </div>

        {/* Two-way Reply Input */}
        <div className="bg-surface-container-high/50 p-3 rounded-xl">
          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Reply (for deaf person to read)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
              placeholder="Type your reply..."
              className="flex-1 px-3 py-2 bg-surface-container-lowest rounded-lg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button onClick={handleSendReply} disabled={!replyText.trim()}
              className="px-3 py-2 hero-gradient text-white rounded-lg font-bold text-sm active:scale-95 disabled:opacity-50">
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </div>
        </div>

      </section>
    </div>
  );
}
