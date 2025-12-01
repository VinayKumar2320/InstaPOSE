
import React, { useState, useRef, useCallback, useEffect } from 'react';
import CameraView from './components/CameraView';
import AnalysisPanel from './components/AnalysisPanel';
import GalleryPanel from './components/GalleryPanel';
import { AnalysisResult, PoseFeedback, Gender, PoseStyle, PoseLandmarks, GalleryImage } from './types';
import { analyzeSceneAndSuggest, generatePoseReference, evaluatePoseMatch, extractPoseLandmarks } from './services/geminiService';
import { CameraIcon, ArrowPathIcon, UserIcon, SparklesIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [poseFeedback, setPoseFeedback] = useState<PoseFeedback | null>(null);
  const [generatedPoseImage, setGeneratedPoseImage] = useState<string | null>(null);
  const [poseLandmarks, setPoseLandmarks] = useState<PoseLandmarks | null>(null);
  
  // Initialize gallery from local storage if available
  const [gallery, setGallery] = useState<GalleryImage[]>(() => {
    try {
      const saved = localStorage.getItem('instapose_gallery');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load gallery", e);
      return [];
    }
  });
  
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.FEMALE);
  const [selectedStyle, setSelectedStyle] = useState<PoseStyle>(PoseStyle.CASUAL);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveMessage, setAutoSaveMessage] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const cameraRef = useRef<{ capture: () => void }>(null);
  const captureIntent = useRef<'analyze' | 'grade' | 'save'>('analyze');

  // Persist gallery changes to local storage
  useEffect(() => {
    try {
      localStorage.setItem('instapose_gallery', JSON.stringify(gallery));
    } catch (e) {
      console.error("Failed to save gallery", e);
    }
  }, [gallery]);

  const handleCaptureFrame = useCallback(async (base64Image: string) => {
    setError(null);
    setAutoSaveMessage(null);

    if (captureIntent.current === 'analyze') {
      try {
        setIsAnalyzing(true);
        setPoseFeedback(null); // Reset previous feedback
        setPoseLandmarks(null);
        
        // 1. Analyze Context with Vibe
        const result = await analyzeSceneAndSuggest(base64Image, selectedGender, selectedStyle);
        setAnalysisResult(result);

        // 2. Generate Reference Image
        const poseImageBase64 = await generatePoseReference(result.suggestedPose.description, selectedGender, selectedStyle);
        setGeneratedPoseImage(poseImageBase64);

        // 3. Extract Landmarks from the Generated Image
        const landmarks = await extractPoseLandmarks(poseImageBase64);
        setPoseLandmarks(landmarks);

      } catch (err) {
        console.error(err);
        setError("AI was unable to generate a suggestion. Please try again.");
      } finally {
        setIsAnalyzing(false);
      }
    } else if (captureIntent.current === 'grade') {
      try {
        if (!analysisResult) return;
        setIsGrading(true);
        
        const feedback = await evaluatePoseMatch(base64Image, analysisResult.suggestedPose.description);
        setPoseFeedback(feedback);
        
        // Removed auto-save logic. Waiting for manual capture.

      } catch (err) {
        console.error(err);
        setError("Could not grade pose. Try again.");
      } finally {
        setIsGrading(false);
      }
    } else if (captureIntent.current === 'save') {
       // Manual save logic
       const newImage: GalleryImage = {
         id: Date.now().toString(),
         imageData: base64Image,
         referenceImage: generatedPoseImage, // Save the reference pose as well
         score: poseFeedback?.score || 0,
         timestamp: Date.now()
       };
       
       // Trigger Flash Effect
       setFlash(true);
       setTimeout(() => setFlash(false), 200);

       // Update Gallery (Keep max 20 images to avoid localStorage limits)
       setGallery(prev => {
         const updated = [newImage, ...prev];
         return updated.slice(0, 20);
       });
       
       setAutoSaveMessage("Photo saved to Gallery!");
       
       // Clear message after 3 seconds
       setTimeout(() => setAutoSaveMessage(null), 3000);
    }
  }, [selectedGender, selectedStyle, analysisResult, poseFeedback, generatedPoseImage]);

  const triggerAnalysis = () => {
    captureIntent.current = 'analyze';
    if (cameraRef.current) {
      cameraRef.current.capture();
    }
  };

  const triggerGrading = () => {
    captureIntent.current = 'grade';
    if (cameraRef.current) {
      cameraRef.current.capture();
    }
  };

  const triggerSave = () => {
    captureIntent.current = 'save';
    if (cameraRef.current) {
        cameraRef.current.capture();
    }
  };

  const reset = () => {
    setAnalysisResult(null);
    setGeneratedPoseImage(null);
    setPoseLandmarks(null);
    setPoseFeedback(null);
    setError(null);
    setAutoSaveMessage(null);
  };

  const deleteFromGallery = (id: string) => {
    setGallery(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12 selection:bg-purple-500 selection:text-white">
      {/* Header */}
      <header className="pt-8 pb-6 px-4 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
          InstaPose AI
        </h1>
        <p className="text-slate-400 max-w-md mx-auto text-sm">
          Your personal AI photographer. Analyzes lighting, background, and suggests the perfect pose.
        </p>
      </header>

      <main className="max-w-md mx-auto px-4 flex flex-col gap-6">
        
        {/* Controls Container - Only show when not in "Active Session" mode to save space, or keep compact */}
        {!analysisResult && (
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 space-y-4">
            
            {/* Gender Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model</label>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(Object.values(Gender) as Gender[]).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setSelectedGender(gender)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedGender === gender 
                        ? 'bg-purple-600 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vibe & Style</label>
              <div className="relative">
                <SparklesIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <select 
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value as PoseStyle)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                >
                  {Object.values(PoseStyle).map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Camera Viewport Wrapper with Flash Overlay */}
        <div className="w-full relative rounded-3xl overflow-hidden">
          {/* Flash Effect Overlay */}
          <div className={`absolute inset-0 z-50 bg-white pointer-events-none transition-opacity duration-150 ease-out ${flash ? 'opacity-80' : 'opacity-0'}`} />

          {/* Success Toast */}
          {autoSaveMessage && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
               <CheckBadgeIcon className="w-5 h-5" />
               <span className="text-sm font-bold">{autoSaveMessage}</span>
             </div>
          )}
          
          <CameraView 
            ref={cameraRef}
            onCaptureFrame={handleCaptureFrame}
            overlayImage={generatedPoseImage}
            landmarks={poseLandmarks}
            isAnalyzing={isAnalyzing || isGrading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {!analysisResult ? (
            <button
              onClick={triggerAnalysis}
              disabled={isAnalyzing}
              className={`
                flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(168,85,247,0.4)]
                transition-all transform hover:scale-105 active:scale-95 w-full justify-center
                ${isAnalyzing 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-purple-500/50'
                }
              `}
            >
              {isAnalyzing ? (
                <>
                  <ArrowPathIcon className="w-6 h-6 animate-spin" />
                  Analyzing Scene...
                </>
              ) : (
                <>
                  <CameraIcon className="w-6 h-6" />
                  Suggest Pose
                </>
              )}
            </button>
          ) : (
            <div className="flex flex-col gap-3 w-full">
              {/* Primary Actions */}
              <div className="flex gap-3">
                 {/* Capture Button Logic: Only Show if Score > 50 */}
                 {poseFeedback && poseFeedback.score > 50 ? (
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={triggerSave}
                            className="flex-[2] py-3 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2 bg-white text-black hover:bg-gray-200 active:scale-95 shadow-white/20 animate-in fade-in zoom-in duration-300"
                        >
                            <CameraIcon className="w-5 h-5" />
                            Capture Photo
                        </button>
                         <button 
                            onClick={triggerGrading}
                            disabled={isGrading}
                            className="flex-1 py-3 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2 bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                        </button>
                    </div>
                 ) : (
                    <button 
                        onClick={triggerGrading}
                        disabled={isGrading}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2
                            ${isGrading 
                            ? 'bg-slate-700 text-slate-400' 
                            : 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20'
                            }`}
                    >
                        {isGrading ? (
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        ) : (
                            <CheckBadgeIcon className="w-5 h-5" />
                        )}
                        {isGrading ? 'Grading...' : 'Check Alignment'}
                    </button>
                 )}
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-3">
                 <button
                  onClick={reset}
                  className="flex-1 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold transition-colors flex justify-center items-center gap-2 text-sm"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  New Pose
                </button>
                <button 
                  onClick={triggerAnalysis}
                  disabled={isAnalyzing}
                  className="flex-1 bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/30 text-purple-200 py-3 rounded-xl font-semibold transition-colors flex justify-center items-center gap-2 text-sm"
                >
                   <UserIcon className="w-4 h-4" />
                   Regenerate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-center text-sm">
            {error}
          </div>
        )}

        {/* Analysis Results & Feedback */}
        <AnalysisPanel 
          analysis={analysisResult} 
          feedback={poseFeedback}
          isLoading={isAnalyzing} 
        />
        
        {/* Gallery */}
        <GalleryPanel 
          images={gallery} 
          onDelete={deleteFromGallery} 
        />
        
      </main>
      
      <footer className="mt-12 text-center text-slate-600 text-xs pb-4">
        <p>Powered by Gemini 2.5 Flash & Vision</p>
      </footer>
    </div>
  );
};

export default App;
