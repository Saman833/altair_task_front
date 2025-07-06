'use client';

import { useState, useEffect, useRef } from 'react';

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
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const recognitionRef = useRef<any>(null);
    const recognitionRunningRef = useRef<boolean>(false);
    const startQueuedRef = useRef<boolean>(false);
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

    const playAudio = (audioBase64: string) => {
        console.log("🎵 Received audio data, length:", audioBase64.length);
        
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
        };
        
        audio.play().then(() => {
            console.log("✅ Audio playback started successfully");
        }).catch(error => {
            console.error("❌ Audio playback failed:", error);
        });
    };

    const initializeWebSocket = () => {
        if (socketRef.current) {
            socketRef.current.close();
        }
        
        socketRef.current = new WebSocket("ws://localhost:8006/ws/voice");
        
        socketRef.current.onopen = () => {
            console.log("✅ WebSocket connected successfully");
            updateStatus("Ready to start conversation", "ready");
        };
        
        socketRef.current.onmessage = (event) => {
            console.log("📨 WebSocket message received:", event.data);
            try {
                const data = JSON.parse(event.data);
                console.log("📨 Parsed WebSocket data:", data);
                
                if (data.type === "transcription") {
                    console.log("📝 Adding transcription message:", data.text);
                    addMessage("You: " + data.text, "user");
                } else if (data.type === "realtime_transcription") {
                    console.log("📝 Updating real-time transcript:", data.text);
                    updateRealTimeTranscript(data.text);
                } else if (data.type === "response") {
                    console.log("🤖 Adding AI response:", data.text);
                    addMessage("AI: " + data.text, "assistant");
                    updateStatus("Ready to start conversation", "ready");
                    lastAssistantTextRef.current = data.text || "";
                } else if (data.type === "audio") {
                    console.log("🎵 Playing audio response");
                    playAudio(data.audio);
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
                console.log("⚠️ WebSocket closed by server - API keys not configured");
                updateStatus("Error: Backend API keys not configured", "error");
            }
        };
    };

    const startSilenceDetection = () => {
        // Clear any existing timer
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }
        
        // Set timer for 3 seconds
        silenceTimerRef.current = setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                // Check if transcript has been stable for 3 seconds
                const timeSinceLastChange = Date.now() - lastTranscriptChangeRef.current;
                console.log("⏰ Silence timer fired - time since last change:", timeSinceLastChange, "ms");
                
                if (timeSinceLastChange >= 3000) {
                    console.log("🔇 3 seconds of silence detected (no transcript changes), stopping recording");
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
                    
                    // Fallback: If onstop doesn't fire, manually send the message
                    setTimeout(() => {
                        if (requestSentRef.current) {
                            console.log("🚫 Duplicate send prevented (fallback path)");
                            return;
                        }
                        if (realTimeTranscriptRef.current && realTimeTranscriptRef.current.trim()) {
                            console.log("📤 Fallback: Sending message to backend");
                            const message = {
                                type: "final_transcript",
                                data: realTimeTranscriptRef.current.trim()
                            };
                            requestSentRef.current = true;
                            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                                try {
                                    socketRef.current.send(JSON.stringify(message));
                                    console.log("📤 Fallback message sent successfully");
                                } catch (error) {
                                    console.error("❌ Error sending fallback message:", error);
                                    sendMockResponse(realTimeTranscriptRef.current.trim());
                                }
                            } else {
                                console.log("❌ WebSocket not connected for fallback, using mock response");
                                sendMockResponse(realTimeTranscriptRef.current.trim());
                            }
                        }
                    }, 1000); // Wait 1 second for onstop to fire, then use fallback
                } else {
                    console.log("⏰ Transcript changed recently, continuing recording...");
                    // Restart the timer
                    startSilenceDetection();
                }
            } else {
                console.log("⏰ Silence timer fired but not recording anymore");
            }
        }, 3000);
        
        console.log("⏰ Silence detection timer started (3 seconds)");
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
                
                // Accumulate all results
                for (let i = 0; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                // Update real-time transcript with accumulated text
                if (finalTranscript || interimTranscript) {
                    const currentTranscript = finalTranscript + interimTranscript;
                    updateRealTimeTranscript(currentTranscript);
                    realTimeTranscriptRef.current = currentTranscript;
                    console.log("📝 Current transcript:", currentTranscript);
                    
                    // Only reset silence timer if there's meaningful speech (not just audio noise)
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording" && currentTranscript.trim().length > 0) {
                        // Check if the transcript has actually changed meaningfully
                        const words = currentTranscript.trim().split(/\s+/);
                        if (words.length > 0 && words[words.length - 1].length > 1) {
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
                // If a restart was queued, start it now
                if (startQueuedRef.current && conversationActiveRef.current && !isRecordingRef.current && !recordingStartingRef.current) {
                    console.log("🔄 [onend] Queued recording will start after 1 s delay");
                    startQueuedRef.current = false;
                    setTimeout(() => {
                        if (conversationActiveRef.current && !isRecordingRef.current && !recordingStartingRef.current) {
                            handleStartRecording();
                        }
                    }, 1000);
                    return;
                }
                
                // Check if we should stop recording due to silence
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                    const timeSinceLastChange = Date.now() - lastTranscriptChangeRef.current;
                    console.log("⏰ Time since last transcript change:", timeSinceLastChange, "ms");
                    
                    if (timeSinceLastChange >= 2000) { // If 2+ seconds since last meaningful speech
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
                        // Echo-filter: drop transcript that starts with assistant's last reply
                        const cleanUser = normalizeText(realTimeTranscriptRef.current);
                        const cleanBot  = normalizeText(lastAssistantTextRef.current);
                        if (cleanBot && cleanUser.startsWith(cleanBot)) {
                            console.log("🛑 Ignoring echo of assistant speech");
                            updateStatus("Waiting for speech...", "waiting");
                            if (conversationActiveRef.current && !isRecordingRef.current && !recordingStartingRef.current) {
                                setTimeout(() => {
                                    if (conversationActiveRef.current && !isRecordingRef.current && !recordingStartingRef.current) {
                                        handleStartRecording();
                                    }
                                }, 800);
                            }
                            return;
                        }

                        if (requestSentRef.current) {
                            console.log("🚫 Duplicate send prevented (transcript path)");
                            return;
                        }
                        console.log("📤 Sending final transcript:", realTimeTranscriptRef.current);
                        const message = {
                            type: "final_transcript",
                            data: realTimeTranscriptRef.current.trim()
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
                                        sendMockResponse(realTimeTranscriptRef.current.trim());
                                    }
                                }, 3000); // Wait 3 seconds for server response
                            } catch (error) {
                                console.error("❌ Error sending WebSocket message:", error);
                                console.log("🔄 Attempting to reconnect WebSocket...");
                                initializeWebSocket();
                                sendMockResponse(realTimeTranscriptRef.current.trim());
                            }
                        } else {
                            console.log("❌ WebSocket not connected (state:", socketRef.current?.readyState, "), using mock response");
                            console.log("🔄 Attempting to reconnect WebSocket...");
                            initializeWebSocket();
                            sendMockResponse(realTimeTranscriptRef.current.trim());
                        }
                    } else {
                        console.log("📤 No transcript available, sending audio for processing");
                        if (requestSentRef.current) {
                            console.log("🚫 Duplicate send prevented (audio path)");
                            return;
                        }
                        if (audioChunksRef.current.length === 0) {
                            console.log("⚠️ No audio chunks recorded; user probably stayed silent.");
                            // Do NOT queue another restart immediately; wait 1s then restart to avoid tight loops
                            updateStatus("Waiting for speech...", "waiting");
                            setTimeout(() => {
                                if (conversationActiveRef.current && !isRecordingRef.current && !recordingStartingRef.current) {
                                    handleStartRecording();
                                }
                            }, 1000);
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

                // Queue next recording after recognition fully ends
                if (conversationActiveRef.current) {
                    console.log("⏳ Queuing next recording until recognition ends");
                    startQueuedRef.current = true;
                    // Safety fallback: if recognition isn't running, start after short delay
                    setTimeout(() => {
                        if (startQueuedRef.current && !recognitionRunningRef.current && conversationActiveRef.current && !isRecordingRef.current && !recordingStartingRef.current) {
                            console.log("⚠️ Recognition not running, starting queued recording via fallback after delay");
                            startQueuedRef.current = false;
                            handleStartRecording();
                        }
                    }, 1000);
                }
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
        initializeWebSocket();
        
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

    // Helper to normalise text for echo comparison
    const normalizeText = (txt: string) => txt.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
                        🤖 ElevenLabs Conversational AI
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
                            className="px-8 py-4 mx-2 text-lg font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            🛑 Stop Recording
                        </button>
                    </div>
                    
                    <div className={`p-4 mb-6 rounded-lg text-center font-bold ${
                        status === 'ready' ? 'bg-green-100 text-green-800' :
                        status === 'recording' ? 'bg-yellow-100 text-yellow-800' :
                        status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {status === 'ready' && 'Ready to start conversation'}
                        {status === 'recording' && 'Recording... Speak now! (will auto-stop after 3s silence)'}
                        {status === 'processing' && 'Processing...'}
                        {status === 'error' && 'Error occurred'}
                    </div>
                    
                    <div 
                        ref={conversationRef}
                        className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50"
                    >
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`mb-3 p-3 rounded-lg ${
                                    message.sender === 'user' 
                                        ? 'bg-blue-100 text-right ml-12' 
                                        : 'bg-purple-100 text-left mr-12'
                                }`}
                            >
                                {message.text}
                            </div>
                        ))}
                        {realTimeTranscript && (
                            <div className="mb-3 p-3 rounded-lg bg-blue-100 text-right ml-12 opacity-70 italic">
                                You: {realTimeTranscript} ...
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-blue-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">ℹ️ How to use:</h3>
                        <div className="space-y-2 text-gray-700">
                            <p>1. Click "Start Recording" to begin</p>
                            <p>2. Allow microphone access when prompted</p>
                            <p>3. Speak your message (will auto-stop after 3s silence)</p>
                            <p>4. The AI will respond with both text and voice</p>
                            <p>5. Say "reset" to start a new conversation</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 