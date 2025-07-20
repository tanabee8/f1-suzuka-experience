// Global TypeScript declarations

// プロジェクト固有の型をここで定義
export interface F1Data {
  name: string;
  position: number;
  team: string;
  points: number;
}

// 環境変数の型定義
declare namespace App {
  interface Env {
    PUBLIC_API_URL: string;
  }
}
