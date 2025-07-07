'use client';

import { useState, useEffect, useRef } from 'react';

// Type declaration for environment variables (matching project pattern)
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            readonly NEXT_PUBLIC_API_URL?: string;
        }
    }
}

interface Message {
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
}

export default function Assistant() {
    const [isRecording, setIsRecording] = useState(false);
    const isRecordingRef = useRef<boolean>(false);
    const recordingStartingRef = useRef<boolean>(false);
    const [status, setStatus] = useState('ready');
    const [messages, setMessages] = useState<Message[]>([]);
    const [realTimeTranscript, setRealTimeTranscript] = useState('');
    const [backendUrl, setBackendUrl] = useState<string>('');
    const messageCounterRef = useRef<number>(0);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const recognitionRef = useRef<any>(null);
    const recognitionRunningRef = useRef<boolean>(false);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const conversationRef = useRef<HTMLDivElement>(null);
    
    // Using refs so their values persist across renders and are reliably updated inside callbacks
    const realTimeTranscriptRef = useRef<string>("");
    const lastTranscriptChangeRef = useRef<number>(0);
    const requestSentRef = useRef<boolean>(false);
    const conversationActiveRef = useRef<boolean>(false);
    const lastAssistantTextRef = useRef<string>("");
    const ttsPlayingRef = useRef<boolean>(false);
    // Set of words from recent assistant replies for echo detection
    const assistantWordSetRef = useRef<Set<string>>(new Set());

    // Helper to normalise text for simple echo comparison
    const normalizeText = (txt: string) => txt.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();

    const addAssistantText = (text: string) => {
        const words = normalizeText(text).split(' ').filter(Boolean);
        const set = assistantWordSetRef.current;
        words.forEach(w => set.add(w));
        // Keep only last ~200 words to bound memory (reduced from 300)
        if (set.size > 200) {
            assistantWordSetRef.current = new Set(Array.from(set).slice(-200));
        }
    };

    const looksLikeEcho = (userTxt: string) => {
        const userWords = normalizeText(userTxt).split(' ').filter(Boolean);
        if (userWords.length < 5) return false; // Require at least 5 words for echo detection (less sensitive)
        const shared = userWords.filter(w => assistantWordSetRef.current.has(w)).length;
        return shared / userWords.length >= 0.9; // Increased to 90% for less sensitivity
    };

    const updateStatus = (message: string, className: string) => {
        setStatus(className);
    };

    const addMessage = (text: string, sender: 'user' | 'assistant') => {
        const newMessage: Message = {
            text,
            sender,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const sendMockResponse = (userMessage: string) => {
        console.log("🤖 Sending mock response for:", userMessage);
        
        // Simulate AI response
        const responses = [
            "Hello! I can hear you clearly. How can I help you today?",
            "I heard you say: '" + userMessage + "'. What would you like to know?",
            "Thanks for your message. I'm here to assist you with any questions you have.",
            "I understand you said: '" + userMessage + "'. Let me help you with that.",
            "Great! I'm listening and ready to help. What would you like to discuss?"
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        // Add the response after a short delay to simulate processing
        setTimeout(() => {
            addMessage("AI: " + randomResponse, "assistant");
            updateStatus("Ready to start conversation", "ready");
        }, 1000);
    };

    const updateRealTimeTranscript = (text: string) => {
        // Remove any existing real-time transcript
        setRealTimeTranscript(text);
        realTimeTranscriptRef.current = text;
    };

    const scrollToBottom = () => {
        if (conversationRef.current) {
            conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, realTimeTranscript]);

    // Removed queueRestart function - using pure half-duplex mode instead

    const playAudio = (audioBase64: string) => {
        console.log("🎵 Received audio data, length:", audioBase64.length);
        
        // Stop mic to avoid capturing TTS
        if (isRecordingRef.current) {
            console.log("🔇 Temporarily stopping mic during TTS playback");
            handleStopRecording();
        }
        ttsPlayingRef.current = true;

        const audioData = atob(audioBase64);
        const audioArray = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
            audioArray[i] = audioData.charCodeAt(i);
        }
        
        console.log("🔊 Audio array created, size:", audioArray.length);
        
        const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onloadstart = () => console.log("🎵 Audio loading started");
        audio.oncanplay = () => console.log("🎵 Audio can play");
        audio.onplay = () => console.log("🎵 Audio playing started");
        audio.onerror = (e) => console.error("❌ Audio error:", e);
        audio.onended = () => {
            console.log("🎵 Audio finished playing");
            ttsPlayingRef.current = false;

            // Restart recording after TTS - this is the ONLY place recording restarts after TTS
            if (conversationActiveRef.current && !isRecordingRef.current && !recordingStartingRef.current) {
                setTimeout(() => {
                    if (conversationActiveRef.current && !isRecordingRef.current && !recordingStartingRef.current) {
                        console.log("🔄 Restarting mic after TTS playback");
                        handleStartRecording();
                    }
                }, 1000); // Increased delay to ensure echo tail completely fades
            }
        };
        
        audio.play().then(() => {
            console.log("✅ Audio playback started successfully");
        }).catch(error => {
            console.error("❌ Audio playback failed:", error);
        });
    };

    const getBackendUrl = () => {
        // Use the same approach as other files in the project
        const backendUrl = process.env.NEXT_PUBLIC_API_URL;
        
        if (backendUrl) {
            console.log("🔗 Using NEXT_PUBLIC_API_URL:", backendUrl);
            setBackendUrl(backendUrl);
            return backendUrl;
        } else {
            // Fallback to localhost (same as other files)
            const localhostUrl = "http://localhost:8006";
            console.log("🔗 Using localhost fallback URL:", localhostUrl);
            setBackendUrl(localhostUrl);
            return localhostUrl;
        }
    };

    const getWebSocketUrl = () => {
        const baseUrl = getBackendUrl();
        // Convert HTTP URL to WebSocket URL
        let wsUrl = baseUrl;
        
        // Handle different URL formats
        if (baseUrl.startsWith('http://')) {
            wsUrl = baseUrl.replace('http://', 'ws://');
        } else if (baseUrl.startsWith('https://')) {
            wsUrl = baseUrl.replace('https://', 'wss://');
        } else if (!baseUrl.startsWith('ws://') && !baseUrl.startsWith('wss://')) {
            // If no protocol specified, assume http
            wsUrl = `ws://${baseUrl}`;
        }
        
        const fullWsUrl = `${wsUrl}/conversational-ai/ws/voice`;
        console.log("🔌 Constructed WebSocket URL:", fullWsUrl);
        return fullWsUrl;
    };

    const checkBackendStatus = async () => {
        try {
            const baseUrl = getBackendUrl();
            console.log("🔍 Checking backend status at:", `${baseUrl}/conversational-ai/`);
            
            const response = await fetch(`${baseUrl}/conversational-ai/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(5000), // 5 second timeout
            });
            
            if (!response.ok) {
                console.error("❌ Backend status check failed:", response.status, response.statusText);
                return null;
            }
            
            const data = await response.json();
            console.log("🔍 Backend status:", data);
            
            // Check ElevenLabs status specifically
            if (data.status) {
                console.log("🔍 ElevenLabs status:", data.status.elevenlabs_available);
                console.log("🔍 ElevenLabs key:", data.status.elevenlabs_key);
                if (data.status.elevenlabs_available !== "✅ Available") {
                    console.warn("⚠️ ElevenLabs not available - audio won't work");
                }
            }
            
            return data.status;
        } catch (error) {
            console.error("❌ Failed to check backend status:", error);
            return null;
        }
    };

    const initializeWebSocket = () => {
        if (socketRef.current) {
            socketRef.current.close();
        }
        
        try {
            const wsUrl = getWebSocketUrl();
            console.log("🔌 Connecting to WebSocket:", wsUrl);
            socketRef.current = new WebSocket(wsUrl);
        } catch (error) {
            console.error("❌ Failed to create WebSocket connection:", error);
            updateStatus("Error: Failed to connect to backend", "error");
            return;
        }
        
        // Add connection timeout
        const connectionTimeout = setTimeout(() => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING) {
                console.error("❌ WebSocket connection timeout");
                updateStatus("Error: Backend connection timeout", "error");
                socketRef.current.close();
            }
        }, 10000); // 10 second timeout
        
        socketRef.current.onopen = () => {
            clearTimeout(connectionTimeout);
            console.log("✅ WebSocket connected successfully");
            updateStatus("Ready to start conversation", "ready");
        };
        
        socketRef.current.onmessage = (event) => {
            messageCounterRef.current += 1;
            console.log(`📨 WebSocket message #${messageCounterRef.current} received:`, event.data);
            console.log("📨 Raw message length:", event.data.length);
            console.log("📨 Message starts with:", event.data.substring(0, 50) + "...");
            
            try {
                const data = JSON.parse(event.data);
                console.log("📨 Parsed WebSocket data:", data);
                console.log("📨 Message type:", data.type);
                console.log("📨 Available keys:", Object.keys(data));
                console.log("📨 Message timestamp:", new Date().toISOString());
                
                if (data.type === "transcription") {
                    console.log("📝 Adding transcription message:", data.text);
                    addMessage("You: " + data.text, "user");
                } else if (data.type === "realtime_transcription") {
                    console.log("📝 Updating real-time transcript:", data.text);
                    updateRealTimeTranscript(data.text);
                } else if (data.type === "response") {
                    console.log("🤖 Adding AI response:", data.text);
                    console.log("🤖 Response data keys:", Object.keys(data));
                    addMessage("AI: " + data.text, "assistant");
                    updateStatus("Ready to start conversation", "ready");
                    lastAssistantTextRef.current = data.text || "";
                    addAssistantText(data.text || "");
                    
                    // Check if audio should be coming separately
                    console.log("🤖 Waiting for audio response...");
                    
                    // Set a timeout to detect if audio is missing
                    setTimeout(() => {
                        if (!ttsPlayingRef.current) {
                            console.log("⚠️ No audio received after text response - backend may not be generating audio");
                        }
                    }, 2000);
                } else if (data.type === "audio") {
                    console.log("🎵 Playing audio response");
                    console.log("🎵 Audio data length:", data.audio?.length || "undefined");
                    console.log("🎵 Audio data preview:", data.audio?.substring(0, 50) + "...");
                    if (data.audio && data.audio.length > 100) {
                        console.log("✅ Audio data looks valid, playing...");
                        playAudio(data.audio);
                    } else {
                        console.error("❌ Audio data is missing, empty, or too short");
                        console.error("❌ Audio data:", data.audio);
                    }
                } else if (data.type === "error") {
                    console.error("❌ WebSocket error:", data.message);
                    updateStatus("Error: " + data.message, "error");
                } else {
                    console.log("❓ Unknown message type:", data.type, "Full data:", data);
                }
            } catch (error) {
                console.error("❌ Error parsing WebSocket message:", error);
            }
        };
        
        socketRef.current.onerror = (error) => {
            console.error("❌ WebSocket error:", error);
            updateStatus("Connection error", "error");
        };
        
        socketRef.current.onclose = (event) => {
            console.log("🔌 WebSocket disconnected, code:", event.code, "reason:", event.reason);
            if (event.code === 1001) {
                console.log("⚠️ WebSocket closed by client (1001)");
            } else if (event.code === 1006) {
                console.log("⚠️ WebSocket closed abnormally (1006)");
            } else if (event.code === 4000) {
                console.log("⚠️ WebSocket closed by server - OpenAI API key not configured");
                updateStatus("Error: OpenAI API key not configured", "error");
            } else if (event.code === 4001) {
                console.log("⚠️ WebSocket closed by server - ElevenLabs not available");
                updateStatus("Error: ElevenLabs service not available", "error");
            }
        };
    };

    const startSilenceDetection = () => {
        // Clear any existing timer
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }
        
        // Set timer for 1.5 seconds (more responsive)
        silenceTimerRef.current = setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                // Check if transcript has been stable for 1.5 seconds
                const timeSinceLastChange = Date.now() - lastTranscriptChangeRef.current;
                console.log("⏰ Silence timer fired - time since last change:", timeSinceLastChange, "ms");
                
                if (timeSinceLastChange >= 1500) {
                    console.log("🔇 1.5 seconds of silence detected (no transcript changes), stopping recording");
                    console.log("📝 Final transcript before stopping:", realTimeTranscriptRef.current);
                    console.log("🛑 Calling mediaRecorder.stop() from silence timer");
                    
                    // Stop recording
                    mediaRecorderRef.current.stop();
                    updateRecordingState(false);
                    
                    // Stop speech recognition
                    if (recognitionRef.current) {
                        recognitionRef.current.stop();
                    }
                    
                    // Stop all tracks to release microphone
                    if (mediaRecorderRef.current.stream) {
                        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                    }
                    
                    // Clear the timer
                    silenceTimerRef.current = null;
                } else {
                    console.log("⏰ Transcript changed recently, continuing recording...");
                    // Restart the timer
                    startSilenceDetection();
                }
            } else {
                console.log("⏰ Silence timer fired but not recording anymore");
            }
        }, 1500);
        
        console.log("⏰ Silence detection timer started (1.5 seconds)");
    };

    const resetSilenceTimer = () => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            startSilenceDetection();
        }
    };

    const setupAudioDetection = () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            })
                .then(stream => {
                    audioContextRef.current = new AudioContext();
                    analyserRef.current = audioContextRef.current.createAnalyser();
                    microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
                    scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(2048, 1, 1);
                    
                    analyserRef.current.smoothingTimeConstant = 0.8;
                    analyserRef.current.fftSize = 1024;
                    
                    microphoneRef.current.connect(analyserRef.current);
                    analyserRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(audioContextRef.current.destination);
                    
                    scriptProcessorRef.current.onaudioprocess = function() {
                        // Disabled audio analysis as it's too sensitive to background noise
                        // Only using speech recognition for silence detection now
                        return;
                    };
                })
                .catch(err => console.log("Audio activity detection not available:", err));
        }
    };

    const initializeSpeechRecognition = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';
            
            recognitionRef.current.onstart = () => {
                recognitionRunningRef.current = true;
                console.log("🎤 Real-time speech recognition started");
            };
            
            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';
                let confidenceSum = 0;
                let confidenceCount = 0;
                
                // Accumulate all results
                for (let i = 0; i < event.results.length; i++) {
                    const res = event.results[i];
                    const transcript = res[0].transcript;
                    const conf = res[0].confidence ?? 0.9; // if confidence missing assume high
                    confidenceSum += conf;
                    confidenceCount += 1;
                    if (res.isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }
                const avgConfidence = confidenceCount ? confidenceSum / confidenceCount : 1;
                
                // Update real-time transcript with accumulated text
                if (finalTranscript || interimTranscript) {
                    const currentTranscript = finalTranscript + interimTranscript;

                    // Filter out noise: require >=2 words OR avg conf >=0.4 (less sensitive)
                    const wordsArr = normalizeText(currentTranscript).split(' ').filter(Boolean);
                    if (containsEmoji(currentTranscript) || alphabeticRatio(currentTranscript) < 0.4) {
                        console.log("🛑 Dropping transcript due to emoji or low alphabetic ratio");
                        return;
                    }

                    if (wordsArr.length < 2 && avgConfidence < 0.4) {
                        // Ignore very short, low confidence snippets (less strict)
                        console.log("🛑 Dropping transcript due to low confidence/short length");
                        return;
                    }

                    // Additional filter: ignore transcripts that are too similar to recent assistant text
                    if (looksLikeEcho(currentTranscript)) {
                        console.log("🛑 Dropping transcript due to echo detection");
                        return;
                    }

                    updateRealTimeTranscript(currentTranscript);
                    realTimeTranscriptRef.current = currentTranscript;
                    console.log("📝 Current transcript:", currentTranscript);
                    
                    // Only reset silence timer if there's meaningful speech (not just audio noise)
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording" && currentTranscript.trim().length > 0) {
                        // Check if the transcript has actually changed meaningfully
                        const words = currentTranscript.trim().split(/\s+/);
                        if (words.length > 0 && words[words.length - 1].length > 2) {
                            console.log("🎤 Meaningful speech detected, resetting silence timer");
                            lastTranscriptChangeRef.current = Date.now();
                            resetSilenceTimer();
                        }
                    }
                }
            };
            
            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                // Restart recognition if it fails
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording" && recognitionRef.current) {
                    setTimeout(() => {
                        try {
                            recognitionRef.current.start();
                        } catch (e) {
                            console.error("Failed to restart recognition:", e);
                        }
                    }, 100);
                }
            };
            
            recognitionRef.current.onend = () => {
                console.log("🎤 Real-time speech recognition ended");
                recognitionRunningRef.current = false;
                
                // Check if we should stop recording due to silence
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                    const timeSinceLastChange = Date.now() - lastTranscriptChangeRef.current;
                    console.log("⏰ Time since last transcript change:", timeSinceLastChange, "ms");
                    
                    if (timeSinceLastChange >= 1500) { // 1.5 seconds since last meaningful speech
                        console.log("🔇 Speech recognition ended after silence, stopping recording");
                        console.log("🛑 Calling mediaRecorder.stop() from onend handler");
                        
                        // Stop recording
                        mediaRecorderRef.current.stop();
                        updateRecordingState(false);
                        
                        // Stop all tracks to release microphone
                        if (mediaRecorderRef.current.stream) {
                            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                        }
                        
                        // Clear silence timer
                        if (silenceTimerRef.current) {
                            clearTimeout(silenceTimerRef.current);
                            silenceTimerRef.current = null;
                        }
                        
                        return; // Don't restart recognition
                    }
                    
                    // Otherwise, restart recognition if still recording
                    console.log("🔄 Restarting speech recognition (not enough silence time)");
                    setTimeout(() => {
                        try {
                            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording" && recognitionRef.current) {
                                recognitionRef.current.start();
                            }
                        } catch (e) {
                            console.error("Failed to restart recognition:", e);
                        }
                    }, 100);
                } else {
                    console.log("🎤 Speech recognition ended but not recording anymore");
                }
            };
        } else {
            console.log("Speech recognition not supported in this browser");
        }
    };

    const updateRecordingState = (val: boolean) => {
        isRecordingRef.current = val;
        setIsRecording(val);
    };

    const handleStartRecording = async () => {
        if (isRecordingRef.current || recordingStartingRef.current) {
            console.log("⏩ Recording already active or starting – start request ignored");
            return;
        }
        recordingStartingRef.current = true;
        // Mark conversation as active (for the *first* user click)
        conversationActiveRef.current = true;
        try {
            // Ensure WebSocket is connected
            if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
                console.log("🔌 Initializing WebSocket connection...");
                initializeWebSocket();
                
                // Wait for WebSocket to connect
                await new Promise((resolve, reject) => {
                    if (socketRef.current) {
                        const timeout = setTimeout(() => {
                            reject(new Error("WebSocket connection timeout"));
                        }, 5000);
                        
                        socketRef.current.onopen = () => {
                            clearTimeout(timeout);
                            console.log("✅ WebSocket connected for recording");
                            resolve(true);
                        };
                        
                        socketRef.current.onerror = (error) => {
                            clearTimeout(timeout);
                            reject(error);
                        };
                    } else {
                        reject(new Error("WebSocket not initialized"));
                    }
                });
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            let mimeType = "audio/webm;codecs=opus";
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = "audio/webm";
            }
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = "audio/ogg;codecs=opus";
            }
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
            console.log("🎙️ MediaRecorder created with mimeType:", mimeType);
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            // Important: start recording FIRST to ensure we have audio before recognition begins
            // Provide a 1-second timeslice so ondataavailable fires regularly, even in silence.
            mediaRecorderRef.current.start(1000);

            // Now start real-time speech recognition
            if (recognitionRef.current) {
                recognitionRef.current.start();
                realTimeTranscriptRef.current = "";
                lastTranscriptChangeRef.current = Date.now();
                requestSentRef.current = false;
                console.log("🔄 Reset request tracking for new recording session");
            }
            
            mediaRecorderRef.current.onstop = () => {
                console.log("🎤 Recording stopped, processing results...");
                
                // ensure starting flag reset in case stop happened before start completed
                recordingStartingRef.current = false;
                
                // Stop speech recognition
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                }
                
                // Remove real-time transcript
                setRealTimeTranscript('');
                
                // Wait a moment for any final recognition results
                setTimeout(() => {
                    // Send final transcript if available, otherwise send audio
                    if (realTimeTranscriptRef.current && realTimeTranscriptRef.current.trim()) {
                        // Robust echo filter using word-overlap heuristic
                        const currentTxt = realTimeTranscriptRef.current;
                        if (containsEmoji(currentTxt) || alphabeticRatio(currentTxt) < 0.4) {
                            console.log("🛑 Dropping final transcript due to emoji or low alphabetic ratio");
                            updateStatus("Waiting for speech...", "waiting");
                            return;
                        }

                        if (looksLikeEcho(currentTxt)) {
                            console.log("🛑 Echo detected – transcript dropped");
                            updateStatus("Waiting for speech...", "waiting");
                            return;
                        }

                        if (requestSentRef.current) {
                            console.log("🚫 Duplicate send prevented (transcript path)");
                            return;
                        }
                        console.log("📤 Sending final transcript:", currentTxt);
                        const message = {
                            type: "final_transcript",
                            data: currentTxt.trim()
                        };
                        requestSentRef.current = true;
                        console.log("📤 Sending message:", message);
                        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                            try {
                                console.log("📤 Sending message to WebSocket:", message);
                                console.log("📤 WebSocket state before sending:", socketRef.current.readyState);
                                socketRef.current.send(JSON.stringify(message));
                                console.log("📤 Message sent successfully");
                                
                                // Set a timeout to use mock response if no response received
                                setTimeout(() => {
                                    if (status === "processing") {
                                        console.log("⏰ No response received from server after 3s, using mock response");
                                        sendMockResponse(currentTxt.trim());
                                    }
                                }, 3000); // Wait 3 seconds for server response
                            } catch (error) {
                                console.error("❌ Error sending WebSocket message:", error);
                                console.log("🔄 Attempting to reconnect WebSocket...");
                                initializeWebSocket();
                                sendMockResponse(currentTxt.trim());
                            }
                        } else {
                            console.log("❌ WebSocket not connected (state:", socketRef.current?.readyState, "), using mock response");
                            console.log("🔄 Attempting to reconnect WebSocket...");
                            initializeWebSocket();
                            sendMockResponse(currentTxt.trim());
                        }
                    } else {
                        console.log("📤 No transcript available, sending audio for processing");
                        if (requestSentRef.current) {
                            console.log("🚫 Duplicate send prevented (audio path)");
                            return;
                        }
                        if (audioChunksRef.current.length === 0) {
                            console.log("⚠️ No audio chunks recorded; user probably stayed silent.");
                            updateStatus("Waiting for speech...", "waiting");
                            return;
                        }
                        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64Audio = (reader.result as string).split(',')[1];
                            const message = {
                                type: "final_audio",
                                data: base64Audio
                            };
                            requestSentRef.current = true;
                            console.log("📤 Sending audio message, data length:", base64Audio.length);
                            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                                try {
                                    console.log("📤 Sending audio message to WebSocket, data length:", base64Audio.length);
                                    console.log("📤 WebSocket state before sending audio:", socketRef.current.readyState);
                                    socketRef.current.send(JSON.stringify(message));
                                    console.log("📤 Audio message sent successfully");
                                    
                                    // Set a timeout to use mock response if no response received
                                    setTimeout(() => {
                                        if (status === "processing") {
                                            console.log("⏰ No response received from server after 3s, using mock response");
                                            sendMockResponse("Audio input");
                                        }
                                    }, 3000); // Wait 3 seconds for server response
                                } catch (error) {
                                    console.error("❌ Error sending WebSocket audio message:", error);
                                    console.log("🔄 Attempting to reconnect WebSocket...");
                                    initializeWebSocket();
                                    sendMockResponse("Audio input");
                                }
                            } else {
                                console.log("❌ WebSocket not connected (state:", socketRef.current?.readyState, "), using mock response");
                                console.log("🔄 Attempting to reconnect WebSocket...");
                                initializeWebSocket();
                                sendMockResponse("Audio input");
                            }
                        };
                        reader.readAsDataURL(audioBlob);
                    }
                    
                    updateStatus("Processing...", "processing");
                }, 500); // Wait 500ms for final recognition results

                // Half-duplex: mic restarts only after TTS finishes (audio.onended)
            };
            
            // Start silence detection
            startSilenceDetection();
            
            // Add a backup timer (10 seconds max recording time)
            setTimeout(() => {
                if (isRecordingRef.current && mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                    console.log("⏰ Backup timer: Maximum recording time reached, stopping recording");
                    mediaRecorderRef.current.stop();
                    updateRecordingState(false);
                    
                    if (mediaRecorderRef.current.stream) {
                        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                    }
                }
            }, 10000);
            
            // Enable audio detection for this recording session
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            
        } catch (error) {
            updateStatus("Error: " + (error as Error).message, "error");
            console.error("Recording error:", error);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            updateRecordingState(false);
            
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
            
            // Pause audio detection
            if (audioContextRef.current && audioContextRef.current.state === 'running') {
                audioContextRef.current.suspend();
            }
        }
        conversationActiveRef.current = false;
    };

    useEffect(() => {
        setupAudioDetection();
        initializeSpeechRecognition();
        
        // Test backend connection on component mount
        const testBackendConnection = async () => {
            console.log("🔍 Testing backend connection...");
            const status = await checkBackendStatus();
            if (status) {
                console.log("✅ Backend is accessible");
                initializeWebSocket();
            } else {
                console.log("⚠️ Backend not accessible, will try WebSocket anyway");
                initializeWebSocket();
            }
        };
        
        testBackendConnection();
        
        return () => {
            console.log("🧹 Cleaning up WebSocket and timers...");
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    console.log("Speech recognition already stopped");
                }
            }
            conversationActiveRef.current = false;
        };
    }, []);

    const containsEmoji = (txt: string) => /[\u{1F300}-\u{1FAFF}]/u.test(txt);

    const alphabeticRatio = (txt: string) => {
        const letters = txt.replace(/[^a-z]/gi, '');
        return letters.length / Math.max(1, txt.length);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
                        ElevenLabs Conversational AI
                    </h1>
                    
                    <div className="text-center mb-8">
                        <button
                            onClick={handleStartRecording}
                            disabled={isRecording || conversationActiveRef.current}
                            className="px-8 py-4 mx-2 text-lg font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            🎤 Start Recording
                        </button>
                        <button
                            onClick={handleStopRecording}
                            disabled={!isRecording && !conversationActiveRef.current && !recordingStartingRef.current}
                            className="px-8 py-4 mx-2 text-lg font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:cursor-not-allowed transition-colors"
                        >
                            🛑 Stop Recording
                        </button>
                    </div>
                    
                    <div className={`
                        text-center p-4 rounded-lg mb-6 text-lg font-medium
                        ${status === 'ready' ? 'bg-green-100 text-green-800' : ''}
                        ${status === 'waiting' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${status === 'processing' ? 'bg-blue-100 text-blue-800' : ''}
                        ${status === 'error' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                        {status === 'ready' && 'Ready to start conversation'}
                        {status === 'waiting' && 'Waiting for speech...'}
                        {status === 'processing' && 'Processing...'}
                        {status === 'error' && 'Error occurred'}
                    </div>
                    
                    {backendUrl && (
                        <div className="text-center mb-4 text-sm text-gray-600">
                            🔗 Backend: {backendUrl}
                        </div>
                    )}
                    
                    {realTimeTranscript && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <h3 className="text-lg font-semibold text-blue-800 mb-2">Real-time Transcript:</h3>
                            <p className="text-blue-700">{realTimeTranscript}</p>
                        </div>
                    )}
                    
                    <div 
                        ref={conversationRef}
                        className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto"
                    >
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                                <p className="text-lg">No messages yet. Start recording to begin the conversation!</p>
                            </div>
                        ) : (
                            messages.map((message, index) => (
                                <div 
                                    key={index} 
                                    className={`mb-4 flex ${
                                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    <div className={`max-w-xs lg:max-w-md p-4 rounded-2xl shadow-sm ${
                                        message.sender === 'user' 
                                            ? 'bg-blue-500 text-white' 
                                            : 'bg-white border border-gray-200 text-gray-800'
                                    }`}>
                                        <div className="text-sm font-medium mb-1 opacity-80">
                                            {message.sender === 'user' ? 'You' : 'Assistant'}
                                        </div>
                                        <div className="text-sm leading-relaxed">
                                            {message.text}
                                        </div>
                                        <div className={`text-xs mt-2 ${
                                            message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                                        }`}>
                                            {message.timestamp.toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}