import { useCallback, useEffect, useRef, useState } from "react";

const INPUT_SAMPLE_RATE = 16000;
const DEFAULT_WS_URL = "ws://localhost:8080/ws/live";

const parseSampleRate = (mimeType, fallback = 24000) => {
  if (!mimeType || typeof mimeType !== "string") {
    return fallback;
  }

  const match = mimeType.match(/rate=(\d+)/i);
  if (!match) {
    return fallback;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const floatTo16BitPCM = (float32Array) => {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i += 1) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
};

const downsampleBuffer = (buffer, inputSampleRate, outputSampleRate) => {
  if (outputSampleRate >= inputSampleRate) {
    return buffer;
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
      accum += buffer[i];
      count += 1;
    }

    result[offsetResult] = accum / count;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
};

const int16ToBase64 = (int16Array) => {
  let binary = "";
  const bytes = new Uint8Array(int16Array.buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const base64ToUint8Array = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
};

const pcm16ToFloat32 = (pcmBytes) => {
  const int16 = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, Math.floor(pcmBytes.byteLength / 2));
  const float32 = new Float32Array(int16.length);

  for (let i = 0; i < int16.length; i += 1) {
    float32[i] = int16[i] / 0x8000;
  }

  return float32;
};

const resolveWsUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_LIVE_WS_URL;
  if (fromEnv) {
    return fromEnv;
  }

  if (typeof window === "undefined") {
    return DEFAULT_WS_URL;
  }

  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocalhost) {
    return DEFAULT_WS_URL;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:8080/ws/live`;
};

export default function useLiveVoiceChat({
  onText,
  onUserTranscript,
  onState,
  onError,
}) {
  const [isSupported, setIsSupported] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [error, setError] = useState(null);
  const sessionActiveRef = useRef(false);

  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const processorRef = useRef(null);
  const recognitionRef = useRef(null);
  const userFinalTranscriptRef = useRef("");
  const userInterimTranscriptRef = useRef("");
  const lastCommittedTranscriptRef = useRef("");
  const lastCommittedAtRef = useRef(0);
  const lastLiveEmitRef = useRef({ text: "", at: 0 });

  const playbackContextRef = useRef(null);
  const nextPlayTimeRef = useRef(0);

  const silenceTimeoutSentRef = useRef(false);
  const lastVoiceDetectedAtRef = useRef(0);

  const emitState = useCallback((state) => {
    onState?.(state);
  }, [onState]);

  const emitUserTranscript = useCallback((isFinal = false) => {
    const text = `${userFinalTranscriptRef.current} ${userInterimTranscriptRef.current}`.trim();
    if (!text) {
      return;
    }

    const normalized = text.toLowerCase();
    const now = Date.now();

    if (!isFinal) {
      const recentSameLiveEmit =
        normalized === lastLiveEmitRef.current.text &&
        now - lastLiveEmitRef.current.at < 350;

      const recentSameAsCommitted =
        normalized === lastCommittedTranscriptRef.current &&
        now - lastCommittedAtRef.current < 3000;

      if (recentSameLiveEmit || recentSameAsCommitted) {
        return;
      }

      lastLiveEmitRef.current = { text: normalized, at: now };
    }

    onUserTranscript?.({
      text,
      isFinal,
    });
  }, [onUserTranscript]);

  const clearTranscriptBuffers = useCallback(() => {
    userFinalTranscriptRef.current = "";
    userInterimTranscriptRef.current = "";
  }, []);

  const isDuplicateRecentCommit = useCallback((text) => {
    const normalized = String(text || "").trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    const isDuplicate =
      normalized === lastCommittedTranscriptRef.current &&
      Date.now() - lastCommittedAtRef.current < 3000;

    if (!isDuplicate) {
      lastCommittedTranscriptRef.current = normalized;
      lastCommittedAtRef.current = Date.now();
    }

    return isDuplicate;
  }, []);

  const commitUserTranscript = useCallback(() => {
    const text = `${userFinalTranscriptRef.current} ${userInterimTranscriptRef.current}`.trim();
    if (!text) {
      return;
    }

    if (isDuplicateRecentCommit(text)) {
      clearTranscriptBuffers();
      return;
    }

    onUserTranscript?.({
      text,
      isFinal: true,
    });

    clearTranscriptBuffers();
  }, [clearTranscriptBuffers, isDuplicateRecentCommit, onUserTranscript]);

  const stopSpeechRecognition = useCallback((commit = true) => {
    if (commit) {
      commitUserTranscript();
    } else {
      clearTranscriptBuffers();
    }

    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;

    try {
      recognition.stop();
    } catch {
      // no-op
    }

    recognitionRef.current = null;
  }, [clearTranscriptBuffers, commitUserTranscript]);

  const startSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    stopSpeechRecognition(false);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const resultText = event.results[i]?.[0]?.transcript || "";
        if (!resultText) {
          continue;
        }

        if (event.results[i].isFinal) {
          finalChunk += `${resultText} `;
        } else {
          interimChunk += resultText;
        }
      }

      if (finalChunk.trim()) {
        const merged = `${userFinalTranscriptRef.current} ${finalChunk}`.trim();
        userFinalTranscriptRef.current = merged;
      }

      userInterimTranscriptRef.current = interimChunk.trim();

      // Emit live updates only for interim content. Final-only events are committed
      // by silence/end-turn handling to avoid duplicate bubbles.
      if (userInterimTranscriptRef.current) {
        emitUserTranscript(false);
      }
    };

    recognition.onerror = () => {
      // Keep voice chat running even if browser transcript fails.
    };

    recognition.onend = () => {
      if (!sessionActiveRef.current || recognitionRef.current !== recognition) {
        return;
      }

      try {
        recognition.start();
      } catch {
        // no-op
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
    }
  }, [emitUserTranscript, stopSpeechRecognition]);

  const cleanupCapture = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaSourceRef.current) {
      mediaSourceRef.current.disconnect();
      mediaSourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const cleanupPlayback = useCallback(() => {
    if (playbackContextRef.current) {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
      nextPlayTimeRef.current = 0;
    }
  }, []);

  const hardReset = useCallback(() => {
    stopSpeechRecognition(true);
    cleanupCapture();
    cleanupPlayback();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnecting(false);
    setIsSessionActive(false);
    sessionActiveRef.current = false;
  }, [cleanupCapture, cleanupPlayback, stopSpeechRecognition]);

  const sendWs = useCallback((payload) => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    socket.send(JSON.stringify(payload));
    return true;
  }, []);

  const playAudioChunk = useCallback(async ({ audio, mimeType }) => {
    if (!audio) {
      return;
    }

    if (!playbackContextRef.current) {
      playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      nextPlayTimeRef.current = playbackContextRef.current.currentTime;
    }

    const ctx = playbackContextRef.current;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const sampleRate = parseSampleRate(mimeType, 24000);
    const pcmBytes = base64ToUint8Array(audio);
    const floatData = pcm16ToFloat32(pcmBytes);

    const audioBuffer = ctx.createBuffer(1, floatData.length, sampleRate);
    audioBuffer.getChannelData(0).set(floatData);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(nextPlayTimeRef.current, now + 0.01);
    source.start(startAt);

    nextPlayTimeRef.current = startAt + audioBuffer.duration;
  }, []);

  const startCapture = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
      },
    });

    mediaStreamRef.current = stream;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    mediaSourceRef.current = source;

    const processor = audioContext.createScriptProcessor(1024, 1, 1);
    processorRef.current = processor;

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (event) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !sessionActiveRef.current) {
        return;
      }

      const inputData = event.inputBuffer.getChannelData(0);
      const downsampled = downsampleBuffer(inputData, audioContext.sampleRate, INPUT_SAMPLE_RATE);
      const pcm16 = floatTo16BitPCM(downsampled);
      const base64Audio = int16ToBase64(pcm16);

      let sumSquares = 0;
      for (let i = 0; i < downsampled.length; i += 1) {
        sumSquares += downsampled[i] * downsampled[i];
      }

      const rms = Math.sqrt(sumSquares / downsampled.length);
      const now = Date.now();

      if (rms > 0.015) {
        lastVoiceDetectedAtRef.current = now;
        silenceTimeoutSentRef.current = false;
      }

      if (!silenceTimeoutSentRef.current && lastVoiceDetectedAtRef.current > 0 && now - lastVoiceDetectedAtRef.current > 700) {
        commitUserTranscript();
        sendWs({ type: "end_turn" });
        silenceTimeoutSentRef.current = true;
      }

      sendWs({
        type: "audio_chunk",
        audio: base64Audio,
        mimeType: "audio/pcm;rate=16000",
      });
    };
  }, [commitUserTranscript, sendWs]);

  const stopSession = useCallback(() => {
    sendWs({ type: "stop_session" });
    hardReset();
    emitState("stopped");
  }, [emitState, hardReset, sendWs]);

  const startSession = useCallback(async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      setIsSupported(false);
      return;
    }

    if (!window.WebSocket || !navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
      setError("Live audio chat is not supported in this browser.");
      return;
    }

    setError(null);
    setIsConnecting(true);
    lastCommittedTranscriptRef.current = "";
    lastCommittedAtRef.current = 0;
    emitState("connecting");

    try {
      const wsUrl = resolveWsUrl();
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        sendWs({
          type: "start_session",
          responseModalities: ["AUDIO"],
        });
      };

      socket.onmessage = async (event) => {
        let parsed;

        try {
          parsed = JSON.parse(event.data);
        } catch {
          return;
        }

        if (parsed.type === "session_started") {
          setIsConnecting(false);
          setIsSessionActive(true);
          sessionActiveRef.current = true;
          emitState("active");

          try {
            await startCapture();
            startSpeechRecognition();
          } catch (captureError) {
            const message = captureError?.message || "Microphone access is required for live audio chat.";
            setError(message);
            onError?.(message);
            sendWs({ type: "stop_session" });
            setIsSessionActive(false);
            sessionActiveRef.current = false;
            cleanupCapture();
            cleanupPlayback();
            stopSpeechRecognition(false);
          }

          return;
        }

        if (parsed.type === "gemini_text" && parsed.text) {
          onText?.(parsed.text);
          return;
        }

        if (parsed.type === "gemini_audio" && parsed.audio) {
          await playAudioChunk({
            audio: parsed.audio,
            mimeType: parsed.mimeType,
          });
          return;
        }

        if (parsed.type === "gemini_live_error" || parsed.type === "error") {
          const message = parsed.message || "Live voice error";
          setError(message);
          onError?.(message);
          return;
        }

        if (parsed.type === "gemini_turn_complete") {
          emitState("turn_complete");
          return;
        }

        if (parsed.type === "session_stopped" || parsed.type === "gemini_live_closed") {
          setIsConnecting(false);
          setIsSessionActive(false);
          sessionActiveRef.current = false;
          cleanupCapture();
          cleanupPlayback();
          stopSpeechRecognition(true);
          emitState("stopped");
        }
      };

      socket.onerror = () => {
        const message = "Failed to connect live voice websocket.";
        setError(message);
        setIsConnecting(false);
        setIsSessionActive(false);
        sessionActiveRef.current = false;
        onError?.(message);
      };

      socket.onclose = () => {
        setIsConnecting(false);
        setIsSessionActive(false);
        sessionActiveRef.current = false;
        cleanupCapture();
        cleanupPlayback();
        stopSpeechRecognition(true);
        emitState("closed");
      };
    } catch (err) {
      const message = err?.message || "Unable to start live audio chat";
      setError(message);
      setIsConnecting(false);
      setIsSessionActive(false);
      sessionActiveRef.current = false;
      onError?.(message);
    }
  }, [cleanupCapture, cleanupPlayback, emitState, onError, onText, playAudioChunk, sendWs, startCapture, startSpeechRecognition, stopSpeechRecognition]);

  useEffect(() => {
    return () => {
      hardReset();
    };
  }, [hardReset]);

  return {
    isSupported,
    isConnecting,
    isSessionActive,
    error,
    startSession,
    stopSession,
  };
}
