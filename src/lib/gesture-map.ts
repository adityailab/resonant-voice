export const gestureToPhrase: Record<string, string> = {
  Thumb_Up: "Yes / I agree",
  Thumb_Down: "No / I disagree",
  Open_Palm: "Hello",
  Closed_Fist: "Stop",
  Victory: "Peace / I'm good",
  ILoveYou: "I love you",
  Pointing_Up: "Look / Attention",
};

export function getGesturePhrase(gesture: string): string | null {
  return gestureToPhrase[gesture] || null;
}
