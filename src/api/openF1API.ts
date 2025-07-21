/**
 * OpenF1 API関連の操作を行うユーティリティ
 */

// 位置情報APIレスポンスの型定義
export interface LocationData {
  session_key: number;
  driver_number: string;
  date: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  speed: number;
  // 他に必要なフィールドがあれば追加
}

// チームラジオAPIレスポンスの型定義
export interface TeamRadioData {
  session_key: number;
  meeting_key: number;
  driver_number: string;
  date: string;
  recording_url?: string;
  message?: string;
}

/**
 * OpenF1 APIからF1車両の位置情報を取得
 * @returns 位置情報データ
 */
export async function fetchLocationData(): Promise<LocationData[]> {
  const url = 'https://api.openf1.org/v1/location';
  const params = new URLSearchParams({
    session_key: '10002', //鈴鹿予選
    driver_number: '1', //マックス・フェルスタッペン
    'date>': '2025-04-05T07:08:30.005000+00:00',
    'date<': '2025-04-05T07:10:30.005000+00:00'
  });

  try {
    const response = await fetch(`${url}?${params}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data as LocationData[];
  } catch (error) {
    console.error('OpenF1 API fetch error:', error);
    throw error;
  }
}

/**
 * OpenF1 APIからチームラジオデータを取得
 * @returns チームラジオデータ
 */
export async function fetchTeamRadioData(): Promise<TeamRadioData[]> {
  const url = 'https://api.openf1.org/v1/team_radio';
  const params = new URLSearchParams({
    session_key: '10002', //鈴鹿予選
    driver_number: '1' //マックス・フェルスタッペン
  });

  try {
    const response = await fetch(`${url}?${params}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data as TeamRadioData[];
  } catch (error) {
    console.error('OpenF1 Team Radio API fetch error:', error);
    throw error;
  }
}
