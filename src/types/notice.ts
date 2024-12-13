export interface Signature {
  type: 'text' | 'draw';
  value: string;
  name?: string;
  date: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  createdAt: number;
  updatedAt: number;
  views: number;
  keywords: string[];
  searchText: string;
  isPinned: boolean;
  startDate: string | null;
  endDate: string | null;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  signatures?: Signature[];  // 서명 필드 추가
  requireSignature?: boolean; // 서명 필수 여부
}