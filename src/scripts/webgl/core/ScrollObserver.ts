import { proxy } from 'valtio/vanilla';
import { SceneManager } from './SceneManager';
import { scrollStore } from '@stores/globalStore';

/**
 * スクロールトリガー定義インターフェース
 */
interface ScrollTrigger {
  componentId: string; // コンポーネントID (showroom, racemap など)
  triggerStart: number; // 発火開始位置 (0-1)
  triggerEnd: number; // 発火終了位置 (0-1)
  callback: (progress: number) => void; // 進捗に応じたコールバック
}

/**
 * スクロール監視クラス
 * スクロール位置に応じたイベント発火を管理
 */
export class ScrollObserver {
  private sceneManager: SceneManager;
  private triggers: ScrollTrigger[] = [];
  private componentsInfo: Map<string, { start: number; end: number }> =
    new Map();

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;

    // DOMの読み込みを確認してから初期化
    if (document.readyState === 'complete') {
      this.initialize();
    } else {
      window.addEventListener('load', () => this.initialize());
    }
  }

  /**
   * 初期化処理
   */
  private initialize(): void {
    // コンポーネント情報の初期化
    this.initComponentsInfo();

    // スクロールイベントの監視開始
    this.startObserving();
  }

  /**
   * コンポーネント情報の初期化
   * 各コンポーネントの開始・終了位置を設定
   */
  private initComponentsInfo(): void {
    // DOM要素の読み込みが完了してから実行する
    this.calculateComponentPositions();

    // リサイズ時に位置を再計算
    window.addEventListener('resize', () => {
      this.calculateComponentPositions();
    });

    // 定期的に位置を再計算（コンテンツが動的に変わる場合のため）
    setInterval(() => this.calculateComponentPositions(), 2000);
  }

  /**
   * DOM要素の実際の位置に基づいてコンポーネント情報を計算
   */
  private calculateComponentPositions(): void {
    // 監視対象のコンポーネント (新しいID構造に合わせる)
    const componentIds = ['showroom', 'racemap'];

    // コンテンツラッパー要素を取得
    const contentsWrapper = document.querySelector('.contents');
    if (!contentsWrapper) {
      console.warn('コンテンツラッパー要素が見つかりません');
      return;
    }

    // ドキュメント全体の高さ（スクロール可能な最大値）
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    // コンテンツラッパーの位置情報
    const wrapperRect = contentsWrapper.getBoundingClientRect();
    const wrapperTop = window.scrollY + wrapperRect.top;

    // 各コンポーネントを処理
    componentIds.forEach((id) => {
      // 新しいIDベースのセレクタを使用
      const element = document.querySelector(`#scene-${id}`);
      if (!element) {
        console.warn(`要素 #scene-${id} が見つかりません`);
        return;
      }

      // 要素の位置情報を取得
      const rect = element.getBoundingClientRect();

      // スクロール位置に対する要素の相対位置を計算
      const elementTop = window.scrollY + rect.top;
      const elementBottom = elementTop + rect.height;

      // ドキュメント全体に対する相対位置（0-1）
      const startPosition = Math.max(
        0,
        (elementTop - wrapperTop) / documentHeight
      );
      const endPosition = Math.min(
        1,
        (elementBottom - wrapperTop) / documentHeight
      );

      // コンポーネント情報を更新
      this.componentsInfo.set(id, {
        start: startPosition,
        end: endPosition
      });

      console.log(
        `コンポーネント ${id} の位置情報を更新: ${startPosition.toFixed(2)} ~ ${endPosition.toFixed(2)}`
      );
    });
  }

  /**
   * スクロールトリガーを追加
   * @param trigger スクロールトリガー情報
   */
  public addTrigger(trigger: ScrollTrigger): void {
    this.triggers.push(trigger);
  }

  /**
   * コンポーネント内の相対位置を全体のスクロール位置に変換
   * @param componentId コンポーネントID
   * @param relativePos コンポーネント内の相対位置 (0-1)
   */
  private mapRelativeToGlobal(
    componentId: string,
    relativePos: number
  ): number {
    const compInfo = this.componentsInfo.get(componentId);
    if (!compInfo) return relativePos;

    const { start, end } = compInfo;
    return start + (end - start) * relativePos;
  }

  /**
   * スクロール位置に基づいてトリガーをチェック
   * @param globalProgress 全体のスクロール位置 (0-1)
   */
  private checkTriggers(globalProgress: number): void {
    for (const trigger of this.triggers) {
      const { componentId, triggerStart, triggerEnd, callback } = trigger;

      // コンポーネント内の相対位置を全体のスクロール位置に変換
      const globalTriggerStart = this.mapRelativeToGlobal(
        componentId,
        triggerStart
      );
      const globalTriggerEnd = this.mapRelativeToGlobal(
        componentId,
        triggerEnd
      );

      // トリガー範囲内かチェック
      if (
        globalProgress >= globalTriggerStart &&
        globalProgress <= globalTriggerEnd
      ) {
        // 範囲内での進捗を計算 (0-1)
        const progress =
          (globalProgress - globalTriggerStart) /
          (globalTriggerEnd - globalTriggerStart);
        // コールバックを実行
        callback(Math.max(0, Math.min(1, progress)));
      }
    }
  }

  /**
   * スクロール監視開始
   */
  private startObserving(): void {
    // スクロールイベントを監視（Lenisがない場合の対応）
    window.addEventListener('scroll', this.handleScroll.bind(this));

    // Lenis（scrollStore）からスクロール情報を取得
    if (scrollStore && typeof scrollStore.subscribe === 'function') {
      scrollStore.subscribe((state) => {
        if (state && typeof state.scrollAmount === 'number') {
          // 全体のスクロール位置を取得
          const globalProgress = state.scrollAmount;

          // トリガーチェック
          this.checkTriggers(globalProgress);

          // 各シーンのスクロールハンドラーを呼び出し
          this.notifyScenes(globalProgress);
        }
      });
    }
  }

  /**
   * 通常のスクロールイベントハンドラ（Lenisがない場合のフォールバック）
   */
  private handleScroll(): void {
    // ドキュメント全体の高さ（スクロール可能な最大値）
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    // 現在のスクロール位置
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    // スクロール進捗（0-1）
    const globalProgress = Math.max(0, Math.min(1, scrollTop / documentHeight));

    // トリガーチェック
    this.checkTriggers(globalProgress);

    // 各シーンのスクロールハンドラーを呼び出し
    this.notifyScenes(globalProgress);
  }

  /**
   * 各シーンにスクロール位置を通知
   * @param globalProgress 全体のスクロール位置 (0-1)
   */
  private notifyScenes(globalProgress: number): void {
    // IntersectionObserverベースの実装と共存させるため、
    // シーンの切り替えではなく、各シーン内でのスクロール位置のみを通知する

    // 現在表示中のシーンを取得（SceneManagerから）
    const currentScene = this.sceneManager.getCurrentSceneName();
    if (!currentScene) return;

    // 現在のシーンの範囲情報を取得
    const sceneInfo = this.componentsInfo.get(currentScene);
    if (!sceneInfo) return;

    // DOM要素の現在の表示状態を取得
    const element = document.querySelector(`#scene-${currentScene}`);
    if (!element) return;

    // 要素の位置情報
    const rect = element.getBoundingClientRect();

    // 画面の高さ
    const viewportHeight = window.innerHeight;

    // 要素の可視範囲を計算
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(viewportHeight, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);

    // 要素のDOM上での実際の位置と高さに基づいた進捗状態を計算
    let relativeProgress;

    // 要素の実際の高さを取得
    const elementHeight = rect.height;
    // スクロール位置（要素の上端がビューポートの上端からどれだけ上にスクロールされたか）
    const scrolledPastElement = -rect.top;
    // 要素全体に対するスクロール進捗
    const elementScrollProgress =
      elementHeight > 0 ? scrolledPastElement / elementHeight : 0;

    if (currentScene !== 'racemap') {
      // 先頭以外場合：ページトップから次のDOM（racemap）が見え始めるまでを0-1の範囲とする

      // 次のDOM要素（racemap）を取得
      const nextElement = document.querySelector('#scene-racemap');

      if (!nextElement) {
        // 次の要素が見つからない場合は従来の計算方法を使用
        if (rect.top > 0) {
          relativeProgress = 0;
        } else if (rect.bottom < 0) {
          relativeProgress = 1;
        } else {
          relativeProgress = Math.max(0, Math.min(1, elementScrollProgress));
        }
      } else {
        // 次の要素の位置情報
        const nextRect = nextElement.getBoundingClientRect();

        // ページトップ（初期状態）の場合
        if (window.scrollY === 0) {
          relativeProgress = 0;
        }
        // 次の要素が画面内に入り始めた場合
        else if (nextRect.top <= viewportHeight) {
          relativeProgress = 1;
        }
        // それ以外（スクロール中）の場合
        else {
          // ドキュメント全体の高さ（スクロール可能な最大値）
          const documentHeight =
            document.documentElement.scrollHeight - window.innerHeight;

          // 次の要素がビューポートに表示されるスクロール位置を計算
          const nextElementScrollPosition =
            window.scrollY + nextRect.top - viewportHeight;

          // 進捗の計算（現在のスクロール位置 / 次の要素が表示されるスクロール位置）
          relativeProgress = Math.max(
            0,
            Math.min(1, window.scrollY / nextElementScrollPosition)
          );
        }
      }
    } else if (currentScene === 'racemap') {
      // racemapの場合：racemapが見え始めてから次の要素が見え始めるまでを0-1とする

      // 次のDOM要素を取得（次の要素がない場合はnull）
      // シーンIDを配列で保持し、現在のシーンの次のシーンを検索する
      const sceneIds = ['showroom', 'racemap', 'other']; // 必要に応じて追加
      const currentIndex = sceneIds.indexOf(currentScene);
      const nextSceneId =
        currentIndex >= 0 && currentIndex < sceneIds.length - 1
          ? sceneIds[currentIndex + 1]
          : null;

      const nextElement = nextSceneId
        ? document.querySelector(`#scene-${nextSceneId}`)
        : null;

      // racemapのビューポートに対する位置
      const elementTopToViewport = rect.top;
      const elementBottomToViewport = rect.bottom;

      if (elementTopToViewport >= viewportHeight) {
        // まだビューポートに入っていない
        relativeProgress = 0;
      } else if (nextElement) {
        // 次の要素がある場合
        const nextRect = nextElement.getBoundingClientRect();

        if (nextRect.top <= viewportHeight) {
          // 次の要素が見え始めた
          relativeProgress = 1;
        } else {
          // racemapが見え始めた位置でのスクロール値を計算
          // ビューポートの下端に要素の上端が来た時点（要素が見え始めた時点）
          const racemapVisibleScrollPosition =
            window.scrollY - (elementTopToViewport - viewportHeight);

          // 次の要素が見え始める位置でのスクロール値を計算
          const nextElementScrollPosition =
            window.scrollY + (nextRect.top - viewportHeight);

          // 進捗を計算（要素が見え始めた時点から次の要素が見え始めるまで）
          const progressRange =
            nextElementScrollPosition - racemapVisibleScrollPosition;
          if (progressRange <= 0) {
            relativeProgress = 0;
          } else {
            const currentProgress =
              window.scrollY - racemapVisibleScrollPosition;
            relativeProgress = Math.max(
              0,
              Math.min(1, currentProgress / progressRange)
            );
          }
        }
      } else {
        // 次の要素がない場合（最後の要素の場合）
        if (elementBottomToViewport <= 0) {
          // 要素が完全に画面外にスクロールされた
          relativeProgress = 1;
        } else if (
          elementTopToViewport > 0 &&
          elementTopToViewport < viewportHeight
        ) {
          // 要素が見え始めてから上端がビューポート上端に到達するまで
          // 見え始めてから上端がビューポート上端に到達するまでを0-0.3の範囲とする
          relativeProgress = Math.max(
            0,
            Math.min(0.3, 0.3 * (1 - elementTopToViewport / viewportHeight))
          );
        } else if (elementTopToViewport <= 0) {
          // 要素の上端がビューポート上端を超えた場合
          // 要素の下端がビューポート下端に到達するまでの進捗を計算（0.3-1.0の範囲）

          // 要素の上端がビューポート上端に到達した位置でのスクロール値
          const elementAtTopScrollPosition = Math.max(
            0,
            window.scrollY + elementTopToViewport
          );

          // 要素の下端がビューポート下端に到達する時点でのスクロール値
          const elementEndScrollPosition =
            elementAtTopScrollPosition +
            Math.max(0, elementHeight - viewportHeight);

          // 進捗を計算（0.3-1.0の範囲）
          const totalScrollDistance =
            elementEndScrollPosition - elementAtTopScrollPosition;
          if (totalScrollDistance <= 0) {
            relativeProgress = 0.3; // 最低進捗値
          } else {
            const currentProgress = window.scrollY - elementAtTopScrollPosition;
            // 0.3-1.0の範囲で進捗を計算
            const scaledProgress =
              0.3 + 0.7 * (currentProgress / totalScrollDistance);
            relativeProgress = Math.max(0.3, Math.min(1, scaledProgress));
          }
        } else {
          // 要素がまだ完全にビューポート内に入っていない
          relativeProgress = 0;
        }
      }
    } else {
      // その他のシーン（openingなど）のデフォルト計算
      relativeProgress = Math.max(0, Math.min(1, globalProgress));
    }

    // DOM要素の可視性と位置関係の追加情報を計算
    const scrollableHeight = Math.max(0, elementHeight - viewportHeight);
    const elementTopToViewport = rect.top;
    const elementBottomToViewport = rect.bottom;

    // シーン別のデバッグ情報
    let sceneDebugInfo = '';

    // showroomの場合、次の要素に関する情報を表示
    if (currentScene === 'showroom') {
      const nextElement = document.querySelector('#scene-racemap');
      if (nextElement) {
        const nextRect = nextElement.getBoundingClientRect();
        // 次の要素がビューポートに表示されるスクロール位置
        const nextElementScrollPosition =
          window.scrollY + nextRect.top - viewportHeight;

        sceneDebugInfo = `, 次要素: top=${nextRect.top.toFixed(0)}, 
        見えてる=${nextRect.top <= viewportHeight ? 'はい' : 'いいえ'}, 
        現在スクロール=${window.scrollY.toFixed(0)}, 
        次要素表示位置=${nextElementScrollPosition.toFixed(0)}, 
        進捗割合=${(window.scrollY / nextElementScrollPosition).toFixed(2)}`;
      }
    }
    // racemapの場合、進捗計算に関する詳細情報を表示
    else if (currentScene === 'racemap') {
      const sceneIds = ['showroom', 'racemap', 'other'];
      const currentIndex = sceneIds.indexOf(currentScene);
      const nextSceneId =
        currentIndex >= 0 && currentIndex < sceneIds.length - 1
          ? sceneIds[currentIndex + 1]
          : null;

      const nextElement = nextSceneId
        ? document.querySelector(`#scene-${nextSceneId}`)
        : null;

      if (nextElement) {
        const nextRect = nextElement.getBoundingClientRect();
        const racemapAtTopScrollPosition = Math.max(
          0,
          window.scrollY + elementTopToViewport
        );
        const nextElementScrollPosition =
          window.scrollY + (nextRect.top - viewportHeight);
        const progressRange =
          nextElementScrollPosition - racemapAtTopScrollPosition;
        const currentProgress = window.scrollY - racemapAtTopScrollPosition;
        const viewportPosition =
          elementTopToViewport > 0 ? '見え始め' : '上端通過';
        const phaseProgress =
          elementTopToViewport > 0
            ? (0.3 * (1 - elementTopToViewport / viewportHeight)).toFixed(2)
            : (0.3 + 0.7 * (currentProgress / progressRange)).toFixed(2);

        sceneDebugInfo = `, 次要素: ${nextSceneId}, top=${nextRect.top.toFixed(0)}, 
        見えてる=${nextRect.top <= viewportHeight ? 'はい' : 'いいえ'}, 
        表示位置=${viewportPosition},
        開始位置=${racemapAtTopScrollPosition.toFixed(0)}, 
        終了位置=${nextElementScrollPosition.toFixed(0)}, 
        範囲=${progressRange.toFixed(0)}, 
        現在進捗=${currentProgress.toFixed(0)},
        フェーズ進捗=${phaseProgress}`;
      } else {
        const elementAtTopScrollPosition = Math.max(
          0,
          window.scrollY + elementTopToViewport
        );
        const elementEndScrollPosition =
          elementAtTopScrollPosition +
          Math.max(0, elementHeight - viewportHeight);
        const totalScrollDistance =
          elementEndScrollPosition - elementAtTopScrollPosition;
        const currentProgress = window.scrollY - elementAtTopScrollPosition;
        const viewportPosition =
          elementTopToViewport > 0 ? '見え始め' : '上端通過';
        const phaseProgress =
          elementTopToViewport > 0
            ? (0.3 * (1 - elementTopToViewport / viewportHeight)).toFixed(2)
            : (0.3 + 0.7 * (currentProgress / totalScrollDistance)).toFixed(2);

        sceneDebugInfo = `, 次要素: なし, 
        要素下端=${elementBottomToViewport.toFixed(0)}, 
        viewport=${viewportHeight.toFixed(0)}, 
        表示位置=${viewportPosition},
        開始位置=${elementAtTopScrollPosition.toFixed(0)}, 
        終了位置=${elementEndScrollPosition.toFixed(0)}, 
        総距離=${totalScrollDistance.toFixed(0)}, 
        現在進捗=${currentProgress.toFixed(0)},
        フェーズ進捗=${phaseProgress}`;
      }
    }

    // デバッグ用の詳細ログ
    console.log(`シーン: ${currentScene}, 進捗: ${relativeProgress.toFixed(2)}, 
      位置: top=${rect.top.toFixed(0)}, bottom=${rect.bottom.toFixed(0)}, 
      可視: ${visibleHeight.toFixed(0)}/${rect.height.toFixed(0)}, 
      DOM高さ: ${elementHeight.toFixed(0)}, 
      スクロール量: ${scrolledPastElement.toFixed(0)}, 
      スクロール可能高さ: ${scrollableHeight.toFixed(0)}, 
      要素進捗: ${(elementScrollProgress * 100).toFixed(0)}%${sceneDebugInfo}`);

    // シーンにスクロール位置を通知（シーンの切り替えは行わず、スクロール位置のみ通知）
    this.sceneManager.updateSceneByScroll(relativeProgress, currentScene);
  }
}
