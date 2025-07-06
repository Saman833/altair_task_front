'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
}

export default function Assistant() {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('ready');
    const [messages, setMessages] = useState<Message[]>([]);
    const [realTimeTranscript, setRealTimeTranscript] = useState('');
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const conversationRef = useRef<HTMLDivElement>(null);

    let realTimeTranscriptGlobal = "";
    let isTranscribing = false;

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
        realTimeTranscriptGlobal = text;
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
        audio.onended = () => console.log("🎵 Audio finished playing");
        
        audio.play().then(() => {
            console.log("✅ Audio playback started successfully");
        }).catch(error => {
            console.error("❌ Audio playback failed:", error);
        });
    };

    const initializeWebSocket = () => {
        socketRef.current = new WebSocket("ws://localhost:8006/ws/voice");
        
        socketRef.current.onopen = () => {
            console.log("WebSocket connected");
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
                } else if (data.type === "audio") {
                    console.log("🎵 Playing audio response");
                    playAudio(data.audio);
                } else if (data.type === "error") {
                    console.error("❌ WebSocket error:", data.message);
                    updateStatus("Error: " + data.message, "error");
                } else {
                    console.log("❓ Unknown message type:", data.type);
                }
            } catch (error) {
                console.error("❌ Error parsing WebSocket message:", error);
            }
        };
        
        socketRef.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            updateStatus("Connection error", "error");
        };
        
        socketRef.current.onclose = () => {
            console.log("WebSocket disconnected");
        };
    };

    const startSilenceDetection = () => {
        // Clear any existing timer
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }
        
        // Set timer for 3 seconds
        silenceTimerRef.current = setTimeout(() => {
            if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                console.log("🔇 3 seconds of silence detected, stopping recording");
                mediaRecorderRef.current.stop();
                setIsRecording(false);
                
                // Stop all tracks to release microphone
                if (mediaRecorderRef.current.stream) {
                    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                }
            }
        }, 3000);
    };

    const resetSilenceTimer = () => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }
        if (isRecording) {
            startSilenceDetection();
        }
    };

    const setupAudioDetection = () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
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
                        if (!isRecording) return;
                        
                        if (analyserRef.current) {
                            const array = new Uint8Array(analyserRef.current.frequencyBinCount);
                            analyserRef.current.getByteFrequencyData(array);
                            const arraySum = array.reduce((a, value) => a + value);
                            const average = arraySum / array.length;
                            
                            // If there's significant audio activity, reset the silence timer
                            if (average > 30) {
                                console.log("🎤 Speech detected, resetting silence timer");
                                resetSilenceTimer();
                            }
                        }
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
                    realTimeTranscriptGlobal = currentTranscript;
                    console.log("📝 Current transcript:", currentTranscript);
                }
            };
            
            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                // Restart recognition if it fails
                if (isRecording && recognitionRef.current) {
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
                // Restart recognition if still recording
                if (isRecording && recognitionRef.current) {
                    setTimeout(() => {
                        try {
                            recognitionRef.current.start();
                        } catch (e) {
                            console.error("Failed to restart recognition:", e);
                        }
                    }, 100);
                }
            };
        } else {
            console.log("Speech recognition not supported in this browser");
        }
    };

    const handleStartRecording = async () => {
        try {
            if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
                initializeWebSocket();
                await new Promise(resolve => {
                    if (socketRef.current) {
                        socketRef.current.onopen = resolve;
                    }
                });
            }
            
            // Start real-time speech recognition
            if (recognitionRef.current) {
                recognitionRef.current.start();
                realTimeTranscriptGlobal = "";
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            
            mediaRecorderRef.current.onstop = () => {
                // Stop speech recognition
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                }
                
                // Remove real-time transcript
                setRealTimeTranscript('');
                
                // Wait a moment for any final recognition results
                setTimeout(() => {
                    // Send final transcript if available, otherwise send audio
                    if (realTimeTranscriptGlobal && realTimeTranscriptGlobal.trim()) {
                        console.log("📤 Sending final transcript:", realTimeTranscriptGlobal);
                        const message = {
                            type: "final_transcript",
                            data: realTimeTranscriptGlobal.trim()
                        };
                        console.log("📤 Sending message:", message);
                        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                            socketRef.current.send(JSON.stringify(message));
                            
                            // Set a timeout to use mock response if no response received
                            setTimeout(() => {
                                if (status === "processing") {
                                    console.log("⏰ No response received from server, using mock response");
                                    sendMockResponse(realTimeTranscriptGlobal.trim());
                                }
                            }, 3000); // Wait 3 seconds for server response
                        } else {
                            console.log("❌ WebSocket not connected, using mock response");
                            sendMockResponse(realTimeTranscriptGlobal.trim());
                        }
                    } else {
                        console.log("📤 No transcript available, sending audio for processing");
                        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64Audio = (reader.result as string).split(',')[1];
                            const message = {
                                type: "final_audio",
                                data: base64Audio
                            };
                            console.log("📤 Sending audio message, data length:", base64Audio.length);
                            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                                socketRef.current.send(JSON.stringify(message));
                                
                                // Set a timeout to use mock response if no response received
                                setTimeout(() => {
                                    if (status === "processing") {
                                        console.log("⏰ No response received from server, using mock response");
                                        sendMockResponse("Audio input");
                                    }
                                }, 3000); // Wait 3 seconds for server response
                            } else {
                                console.log("❌ WebSocket not connected, using mock response");
                                sendMockResponse("Audio input");
                            }
                        };
                        reader.readAsDataURL(audioBlob);
                    }
                    
                    updateStatus("Processing...", "processing");
                }, 500); // Wait 500ms for final recognition results
            };
            
            mediaRecorderRef.current.start();
            updateStatus("Recording... Speak now! (will auto-stop after 3s silence)", "recording");
            setIsRecording(true);
            
            // Start silence detection
            startSilenceDetection();
            
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
            setIsRecording(false);
            
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
            
            // Pause audio detection
            if (audioContextRef.current && audioContextRef.current.state === 'running') {
                audioContextRef.current.suspend();
            }
        }
    };

    useEffect(() => {
        setupAudioDetection();
        initializeSpeechRecognition();
        initializeWebSocket();
        
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
        };
    }, []);

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
                            disabled={isRecording}
                            className="px-8 py-4 mx-2 text-lg font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            🎤 Start Recording
                        </button>
                        <button
                            onClick={handleStopRecording}
                            disabled={!isRecording}
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