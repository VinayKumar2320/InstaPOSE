
export interface LightingAnalysis {
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  direction: string;
  suggestion: string;
}

export interface BackgroundAnalysis {
  clutterLevel: 'Clean' | 'Moderate' | 'Cluttered';
  suggestion: string;
}

export interface PoseSuggestion {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  steps: string[];
}

export interface AnalysisResult {
  environment: string;
  lighting: LightingAnalysis;
  background: BackgroundAnalysis;
  suggestedPose: PoseSuggestion;
}

export interface PoseFeedback {
  score: number;
  matchStatus: 'Perfect' | 'Good' | 'Needs Improvement';
  adjustments: string[];
}

export interface Point {
  x: number;
  y: number;
}

export interface PoseLandmarks {
  nose?: Point;
  leftShoulder?: Point;
  rightShoulder?: Point;
  leftElbow?: Point;
  rightElbow?: Point;
  leftWrist?: Point;
  rightWrist?: Point;
  leftHip?: Point;
  rightHip?: Point;
}

export interface GalleryImage {
  id: string;
  imageData: string; // Base64 string without prefix
  referenceImage?: string | null; // Base64 string of the AI reference
  score: number;
  timestamp: number;
}

export enum Gender {
  FEMALE = 'Female',
  MALE = 'Male',
  NEUTRAL = 'Neutral'
}

export enum PoseStyle {
  CASUAL = 'Casual Social',
  PROFESSIONAL = 'Professional/LinkedIn',
  CREATIVE = 'Creative/Artistic',
  STREET = 'Streetwear/Cool',
  GLAMOUR = 'Glamour/Model'
}
