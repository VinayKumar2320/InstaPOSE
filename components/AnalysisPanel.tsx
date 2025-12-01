import React from 'react';
import { analyzeSceneAndSuggest } from "/Users/vinaykumar/Documents/Documents/Vinay Data/NYU Masters/pose recomm/InstaPoseAI-main/services/geminiService.ts";
// 🚨 FIX APPLIED HERE: Added PoseFeedback to the import
import { AnalysisResult, PoseFeedback } from "/Users/vinaykumar/Documents/Documents/Vinay Data/NYU Masters/pose recomm/InstaPoseAI-main/src/types.ts";
import { LightBulbIcon, PhotoIcon, SparklesIcon, MapPinIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  feedback: PoseFeedback | null;
  isLoading: boolean;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, feedback, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 animate-pulse w-full">
        <div className="h-4 bg-slate-600 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-2 bg-slate-700 rounded w-full"></div>
          <div className="h-2 bg-slate-700 rounded w-5/6"></div>
          <div className="h-2 bg-slate-700 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
      
      {/* 1. Feedback Card (Shows only if feedback exists) */}
      {feedback && (
         <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)] w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-green-400 flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" />
                    Pose Accuracy
                 </h3>
                 <span className={`text-2xl font-black ${
                     feedback.score >= 80 ? 'text-green-400' : 
                     feedback.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                 }`}>
                     {feedback.score}/100
                 </span>
             </div>
             
             <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                 <p className="text-xs font-bold text-slate-500 uppercase mb-2">Coach's Feedback</p>
                 <div className="space-y-2">
                    {feedback.adjustments.map((adj, i) => (
                        <div key={i} className="flex gap-3 text-sm text-slate-200">
                            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 shrink-0" />
                            <span>{adj}</span>
                        </div>
                    ))}
                 </div>
             </div>
         </div>
      )}

      {/* 2. Main Analysis Card */}
      <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-700 shadow-xl w-full text-sm sm:text-base transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 text-purple-400 font-semibold border-b border-slate-700 pb-2">
          <SparklesIcon className="w-5 h-5" />
          <span>AI Director's Cut</span>
        </div>

        <div className="space-y-5">
          
          {/* Environment & Background */}
          <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-2 text-blue-400 mb-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Location</span>
                  </div>
                  <p className="text-slate-200 font-medium truncate">{analysis.environment}</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-2 text-orange-400 mb-1">
                      <PhotoIcon className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Background</span>
                  </div>
                  <p className="text-slate-200 font-medium">{analysis.background.clutterLevel}</p>
              </div>
          </div>

          {/* Lighting Analysis */}
          <div className={`p-4 rounded-xl border ${
              analysis.lighting.quality === 'Excellent' ? 'bg-green-900/10 border-green-500/30' : 
              analysis.lighting.quality === 'Good' ? 'bg-blue-900/10 border-blue-500/30' :
              'bg-yellow-900/10 border-yellow-500/30'
          }`}>
              <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                      analysis.lighting.quality === 'Excellent' ? 'bg-green-500/20 text-green-400' : 
                      analysis.lighting.quality === 'Good' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                  }`}>
                      <LightBulbIcon className="w-5 h-5" />
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-200 text-sm">Lighting: {analysis.lighting.quality}</h4>
                      {analysis.lighting.direction && (
                          <p className="text-xs text-slate-400 mt-0.5">Source: {analysis.lighting.direction}</p>
                      )}
                      <p className="text-slate-300 text-sm mt-2 font-medium italic">
                          "{analysis.lighting.suggestion}"
                      </p>
                  </div>
              </div>
          </div>

          {/* Suggestion & Steps */}
          <div className="pt-2">
            <div className="flex justify-between items-start mb-2">
              <div>
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Recommended Pose</span>
                  <h3 className="text-xl font-bold text-white leading-tight mt-1">{analysis.suggestedPose.title}</h3>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                  analysis.suggestedPose.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                  analysis.suggestedPose.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
              }`}>
                  {analysis.suggestedPose.difficulty}
              </span>
            </div>
            
            <p className="text-slate-400 text-sm mb-4">{analysis.suggestedPose.description}</p>
            
            <div className="bg-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase">How to pose</span>
              {analysis.suggestedPose.steps && analysis.suggestedPose.steps.length > 0 ? (
                  analysis.suggestedPose.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3 text-sm text-slate-200">
                          <CheckCircleIcon className="w-5 h-5 text-purple-500 shrink-0" />
                          <span>{step}</span>
                      </div>
                  ))
              ) : (
                  <div className="text-slate-400 italic text-sm">Follow the reference image above.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;