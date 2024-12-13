// src/config/boards.ts
import { BoardType, BoardTypeConfig } from './boardTypes';

export interface BoardConfig {
  id: string;              // 게시판 고유 ID
  name: string;            // 게시판 이름
  path: string;            // 게시판 경로
  adminPath: string;       // 관리자 페이지 경로
  type: BoardType;         // 게시판 타입
  category: string[];      // 카테고리 목록
  maxFileSize?: number;    // 최대 파일 크기 (MB)
  adminPassword?: string;  // 관리자 비밀번호
  signature?: {            // 서명 설정
    required: boolean;
    allowDrawing: boolean;
    signatureDate: boolean;
    multipleSignatures: boolean;
  };
}

// 게시판 설정 목록
export const BOARD_CONFIG: BoardConfig[] = [
  {
    id: 'notice',
    name: '공지사항',
    path: '/notice',
    adminPath: '/notice/admin',
    type: BoardType.NOTICE,
    category: ['일반', '중요', '이벤트'],
    maxFileSize: 30,
    adminPassword: 'admin1234',
    signature: {
      required: true,
      allowDrawing: true,
      signatureDate: true,
      multipleSignatures: true
    }
  }
];