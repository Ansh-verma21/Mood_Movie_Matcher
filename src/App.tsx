import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, RefreshCcw } from 'lucide-react';
import { movieRecommendations } from './movieData';
import { Movie } from './types';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expression, setExpression] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Movie[]>([]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        setIsLoading(false);
        startVideo();
      } catch (error) {
        console.error('Error loading models:', error);
        setError('Failed to load face detection models. Please refresh the page.');
        setIsLoading(false);
      }
    };

    loadModels();

    // Cleanup function to stop video stream
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const handleVideoPlay = () => {
    let detectionInterval: number;

    const detectExpressions = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      try {
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections) {
          const dominantExpression = Object.entries(detections.expressions)
            .reduce((prev, current) => (prev[1] > current[1] ? prev : current))[0];

          setExpression(dominantExpression);
          setRecommendations(movieRecommendations[dominantExpression] || []);
        }
      } catch (error) {
        console.error('Error detecting expressions:', error);
      }
    };

    detectionInterval = setInterval(detectExpressions, 1000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(detectionInterval);
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">
            Mood Movie Matcher
          </h1>
          <p className="text-indigo-700">
            Let your expression guide you to your next favorite movie
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onPlay={handleVideoPlay}
                className="w-full rounded-lg"
              />
              <canvas ref={canvasRef} className="absolute top-0 left-0" />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <RefreshCcw className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <p className="text-white text-center px-4">{error}</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold text-indigo-900">
                Detected Mood: <span className="capitalize">{expression || 'None'}</span>
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-900 mb-4">
              Recommended Movies
            </h2>
            {recommendations.length > 0 ? (
              recommendations.map((movie, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
                >
                  <img
                    src={movie.imageUrl}
                    alt={movie.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-indigo-900 mb-2">
                      {movie.title}
                    </h3>
                    <p className="text-sm text-indigo-600 mb-2">{movie.genre}</p>
                    <p className="text-gray-600">{movie.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <Camera className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Show your face to the camera to get movie recommendations!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;