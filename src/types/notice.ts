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
  startDate: string | undefined;
  endDate: string | undefined;
}