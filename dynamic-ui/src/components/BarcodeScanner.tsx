import React, { useRef, useState, useCallback, useEffect } from 'react';
import { scanBarcode, ProductInfo } from '../lib/scanner-service';

export const BarcodeScanner = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [product, setProduct] = useState<ProductInfo | null>(null);
    const [error, setError] = useState<string>('');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const scanIntervalRef = useRef<number | undefined>(undefined);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingTime, setProcessingTime] = useState<number>(0);
    const processingTimerRef = useRef<number | undefined>(undefined);
    const [dragActive, setDragActive] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (scanIntervalRef.current) {
                window.clearInterval(scanIntervalRef.current);
            }
            if (processingTimerRef.current) {
                window.clearInterval(processingTimerRef.current);
            }
            stopScanning();
        };
    }, []);

    const stopScanning = useCallback(() => {
        if (scanIntervalRef.current) {
            window.clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = undefined;
        }
        if (processingTimerRef.current) {
            window.clearInterval(processingTimerRef.current);
            processingTimerRef.current = undefined;
            setProcessingTime(0);
        }
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.load(); // Reset the video element
        }
        setIsScanning(false);
        setIsProcessing(false);
    }, [stream]);

    const startProcessingTimer = useCallback(() => {
        // Clear any existing timer
        if (processingTimerRef.current) {
            window.clearInterval(processingTimerRef.current);
        }
        
        // Reset the timer
        setProcessingTime(0);
        
        // Start a new timer that updates every second
        processingTimerRef.current = window.setInterval(() => {
            setProcessingTime(prev => prev + 1);
        }, 1000);
    }, []);

    const stopProcessingTimer = useCallback(() => {
        if (processingTimerRef.current) {
            window.clearInterval(processingTimerRef.current);
            processingTimerRef.current = undefined;
            setProcessingTime(0);
        }
    }, []);

    const captureImage = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !isScanning || isProcessing) {
            console.log('Skipping capture - video:', !!videoRef.current, 'canvas:', !!canvasRef.current, 'isScanning:', isScanning, 'isProcessing:', isProcessing);
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Check if video is actually playing and has valid dimensions
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.log('Video dimensions not ready:', video.videoWidth, video.videoHeight);
            return;
        }

        setIsProcessing(true);
        startProcessingTimer();
        
        try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to create blob from canvas'));
                }, 'image/jpeg', 0.95);
            });

            console.log('Sending image for barcode scanning...');
            const result = await scanBarcode(blob);
            console.log('Scan result:', result);
            
            if (result.error) {
                setError(result.error);
                // Don't stop scanning on error, just show the error message
            } else {
                setProduct(result);
                stopScanning();
                setError(''); // Clear any previous errors on success
            }
        } catch (err) {
            console.error('Error scanning barcode:', err);
            setError('Failed to scan barcode. Still trying...');
        } finally {
            stopProcessingTimer();
            setIsProcessing(false);
        }
    }, [isScanning, stopScanning, isProcessing, startProcessingTimer, stopProcessingTimer]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            await handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }
        setError('');
        setIsProcessing(true);
        startProcessingTimer();
        
        try {
            const result = await scanBarcode(file);
            if (result.error) {
                setError(result.error);
                setProduct(null);
            } else {
                setProduct(result);
                setError(''); // Clear any previous errors on success
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process image');
            setProduct(null);
        } finally {
            stopProcessingTimer();
            setIsProcessing(false);
        }
    };

    // Effect to handle video element initialization
    useEffect(() => {
        if (isScanning && stream && videoRef.current) {
            console.log('Initializing video element with stream...');
            videoRef.current.srcObject = stream;

            const handleVideoError = (e: Event) => {
                console.error('Video playback error:', e);
                setError('Video playback error occurred');
                stopScanning();
            };

            videoRef.current.addEventListener('error', handleVideoError);
            
            const startVideoPlayback = async () => {
                try {
                    await videoRef.current?.play();
                    console.log('Video playback started successfully');
                    
                    // Clear any existing interval
                    if (scanIntervalRef.current) {
                        window.clearInterval(scanIntervalRef.current);
                    }
                    
                    // Start scanning every 500ms
                    scanIntervalRef.current = window.setInterval(captureImage, 500);
                } catch (err) {
                    console.error('Failed to start video playback:', err);
                    setError('Failed to start video playback');
                    stopScanning();
                }
            };

            startVideoPlayback();

            return () => {
                if (videoRef.current) {
                    videoRef.current.removeEventListener('error', handleVideoError);
                }
                if (scanIntervalRef.current) {
                    window.clearInterval(scanIntervalRef.current);
                }
            };
        }
    }, [isScanning, stream, stopScanning, captureImage]);

    const startScanning = useCallback(async () => {
        try {
            if (stream) {
                stopScanning(); // Clean up any existing stream
            }
            
            console.log('Requesting camera access...');
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            const videoTracks = mediaStream.getVideoTracks();
            if (videoTracks.length === 0) {
                throw new Error('No video tracks available');
            }

            // Add track ended listener
            videoTracks[0].addEventListener('ended', () => {
                console.log('Video track ended');
                stopScanning();
            });

            console.log('Video track obtained:', videoTracks[0].label);
            setStream(mediaStream);
            setIsScanning(true);
            setError('');
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Failed to access camera. Please ensure permissions are granted.');
            setIsScanning(false);
        }
    }, [stopScanning]);

    // Format time for display
    const formatTime = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-4">
            <div className="w-full space-y-4">
                {/* File Upload Section */}
                <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center 
                        ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} 
                        ${isProcessing ? 'opacity-50' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileInput}
                        accept="image/*"
                        className="hidden"
                    />
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-gray-600">Drag and drop an image here, or</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-blue-500 hover:text-blue-600 font-medium"
                                disabled={isProcessing}
                            >
                                browse
                            </button>
                        </div>
                        {isProcessing && (
                            <div className="flex flex-col items-center mt-4">
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                    <span className="text-blue-500">Processing image... ({formatTime(processingTime)})</span>
                                </div>
                                {processingTime > 15 && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        This is taking longer than usual. The image might be large or the server could be busy.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-gray-500">- OR -</p>
                </div>

                {/* Existing Camera Section */}
                <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ height: '480px' }}>
                    <div className="absolute inset-0">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full"
                            style={{
                                objectFit: 'contain',
                                display: isScanning ? 'block' : 'none'
                            }}
                        />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                    
                    {isScanning ? (
                        <>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className={`w-64 h-64 border-2 ${isProcessing ? 'border-yellow-400' : 'border-white'} rounded-lg transition-colors duration-200`}>
                                    {isProcessing && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mb-2"></div>
                                            {processingTime > 0 && (
                                                <span className="text-white text-shadow text-sm">{formatTime(processingTime)}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={stopScanning}
                                className="absolute bottom-4 right-4 z-10 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                            >
                                Stop Camera
                            </button>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <button
                                onClick={startScanning}
                                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Start Camera
                            </button>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                        <p>{error}</p>
                        {error.includes('timed out') && (
                            <div className="mt-2 text-sm">
                                <p>Try these troubleshooting steps:</p>
                                <ul className="list-disc pl-5 mt-1">
                                    <li>Use a smaller or clearer image</li>
                                    <li>Check your internet connection</li>
                                    <li>Try again in a few moments</li>
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {product && (
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold text-gray-900">{product.name || 'Unknown Product'}</h3>
                        <p className="text-gray-600 mt-2">{product.description || 'No description available'}</p>
                        {product.ingredients && (
                            <div className="mt-4">
                                <h4 className="text-lg font-medium text-gray-900">Ingredients:</h4>
                                <p className="text-gray-600 mt-1">{product.ingredients}</p>
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-500">Barcode: {product.barcode || 'Unknown'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BarcodeScanner;