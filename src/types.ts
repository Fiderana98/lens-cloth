export interface ClothingItem {
  id: string;
  title: string;
  source: string;
  link: string;
  thumbnail: string;
}

export interface SearchLensResponse {
  success: boolean;
  engineUsed: 'serpapi_google_lens' | 'visual_ai_lens';
  clothingTypeDetected?: string;
  items: ClothingItem[];
  error?: string;
}
