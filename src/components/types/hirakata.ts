// types/hirakata.ts
export interface HiraKata {
  id: number;
  character: string;
  romanji: string;
  unicode: string;
  createdAt: string;
}

export interface FlashcardData {
  type: 'hiragana' | 'katakana';
  items: HiraKata[];
}