export interface GestureResult {
  gesture: string;
  confidence: number;
  landmarks: HandLandmark[];
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}
