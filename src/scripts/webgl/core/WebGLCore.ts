import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { ScrollObserver } from './ScrollObserver';

/**
 * WebGLの中核となるクラス
 * Canvas要素の初期化、アニメーションループ、シーン管理を行う
 */
export class WebGLCore {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private sceneManager: SceneManager;
  private scrollObserver: ScrollObserver;
  private animationFrameId: number | null = null;

  // シングルトンインスタンス
  static instance: WebGLCore | null = null;

  constructor(canvas: HTMLCanvasElement) {
    // レンダラーの初期化
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // カメラの初期化
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5);

    // 時間管理
    this.clock = new THREE.Clock();

    // シーン管理
    this.sceneManager = new SceneManager(this.camera);

    // スクロール監視
    this.scrollObserver = new ScrollObserver(this.sceneManager);

    // イベントリスナー
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * レンダリングループの開始
   */
  public start(): void {
    this.clock.start();
    this.animate();
  }

  /**
   * レンダリングループの停止
   */
  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 特定のシーンをアクティブ化
   * @param sceneName アクティブ化するシーン名
   */
  public activateScene(sceneName: string): void {
    this.sceneManager.activateScene(sceneName);
  }

  /**
   * リサイズハンドラー
   */
  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * アニメーションループ
   */
  private animate(): void {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();

    // アクティブなシーンを更新
    this.sceneManager.update(deltaTime);

    // アクティブなシーンをレンダリング
    const currentScene = this.sceneManager.getCurrentScene();
    if (currentScene) {
      this.renderer.render(currentScene.scene, this.camera);
    }
  }

  /**
   * オープニング演出の開始
   */
  public startOpening(): void {
    this.sceneManager.activateScene('opening');
  }

  /**
   * メイン演出への遷移
   */
  public transitionToMain(): void {
    this.sceneManager.activateScene('main');
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): WebGLCore | null {
    return WebGLCore.instance;
  }
}

/**
 * WebGLの初期化
 * @param canvasElement キャンバス要素
 */
export function initWebGL(canvasElement: HTMLCanvasElement): WebGLCore {
  if (WebGLCore.instance) {
    // 既存のインスタンスがある場合は破棄
    destroyWebGL();
  }

  // 新しいインスタンスを作成
  WebGLCore.instance = new WebGLCore(canvasElement);
  WebGLCore.instance.start();

  return WebGLCore.instance;
}

/**
 * WebGLインスタンスの取得
 */
export function getWebGLInstance(): WebGLCore | null {
  return WebGLCore.getInstance();
}

/**
 * WebGLの破棄
 */
export function destroyWebGL(): void {
  const instance = WebGLCore.getInstance();
  if (instance) {
    instance.stop();
    WebGLCore.instance = null;
  }
}

/**
 * オープニング演出の開始
 */
export function startOpeningSequence(): void {
  const instance = getWebGLInstance();
  if (instance) {
    instance.startOpening();
  }
}

/**
 * メイン演出への遷移
 */
export function transitionToMain(): void {
  const instance = getWebGLInstance();
  if (instance) {
    instance.transitionToMain();
  }
}
