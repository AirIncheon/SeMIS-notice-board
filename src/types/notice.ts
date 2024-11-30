export interface Notice {
    id: string;
    title: string;
    content: string;
    category: string;
    date: string;
    createdAt: number;
    views: number;
    keywords?: string[];
    searchText?: string;
    isPinned?: boolean;        // 상단 고정 여부
    startDate?: string;        // 게시 시작일
    endDate?: string;         // 게시 종료일
}