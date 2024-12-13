// src/config/boardTypes.ts

// 게시판 타입 정의
export enum BoardType {
  NOTICE = 'NOTICE',       // 공지사항형
  COMMUNITY = 'COMMUNITY', // 일반 커뮤니티형
  ANONYMOUS = 'ANONYMOUS', // 익명형
}

// 서명 옵션 타입 정의
export interface SignatureOptions {
  required: boolean;           // 서명 필수 여부
  allowDrawing: boolean;      // 마우스 서명 허용
  signatureDate: boolean;     // 서명 날짜 표시
  multipleSignatures: boolean; // 여러 명의 서명 허용
}

// 게시판 기능 설정 타입 정의
export interface BoardTypeConfig {
  type: BoardType;
  features: {
    adminOnly: boolean;      // 관리자만 글쓰기 가능
    allowComments: boolean;  // 댓글 기능
    allowAnonymous: boolean; // 익명 허용
    allowEdit: boolean;      // 수정 허용
    allowDelete: boolean;    // 삭제 허용
    showAuthor: boolean;     // 작성자 표시
    allowFiles: boolean;     // 파일 첨부 허용
    signature?: SignatureOptions;  // 서명 옵션
  };
}