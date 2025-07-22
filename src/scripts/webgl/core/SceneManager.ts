import * as THREE from 'three';
import { BaseScene } from '../scenes/BaseScene.ts';
import { OpeningScene } from '../scenes/OpeningScene.ts';
import { ShowRoomScene } from '../scenes/ShowRoomScene.ts';
import { RaceMapScene } from '../scenes/RaceMapScene.ts';

/**
 * シーン管理クラス
 * 各シーンのインスタンス化、切り替え、更新を担当
 */
export class SceneManager {
  private scenes: Map<string, BaseScene>;
  private currentSceneName: string | null = null;
  private camera: THREE.PerspectiveCamera;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.scenes = new Map();

    // シーンの初期化
    this.initScenes();
  }

  /**
   * 各シーンを初期化
   */
  private initScenes(): void {
    // オープニングシーン
    const openingScene = new OpeningScene(this.camera);
    this.scenes.set('opening', openingScene);

    // ShowRoomシーン
    const showRoomScene = new ShowRoomScene(this.camera);
    this.scenes.set('showroom', showRoomScene);

    // RaceMapシーン
    const raceMapScene = new RaceMapScene(this.camera);
    this.scenes.set('racemap', raceMapScene);

    // メインシーン（複数のシーンを統合したもの）
    // 初期状態ではオープニングをアクティブに
    this.activateScene('opening');
  }

  /**
   * 特定のシーンをアクティブ化
   * @param sceneName アクティブ化するシーン名
   */
  public activateScene(sceneName: string): void {
    console.log(`Activating scene: ${sceneName}`);
    if (!this.scenes.has(sceneName)) {
      console.warn(
        `Scene "${sceneName}" does not exist. Available scenes: ${Array.from(this.scenes.keys()).join(', ')}`
      );
      return;
    }

    // 現在のシーンがある場合は非アクティブ化
    if (this.currentSceneName) {
      const currentScene = this.scenes.get(this.currentSceneName);
      if (currentScene) {
        currentScene.deactivate();
      }
    }

    // 新しいシーンをアクティブ化
    const newScene = this.scenes.get(sceneName);
    if (newScene) {
      newScene.activate();
      this.currentSceneName = sceneName;
    }
  }

  /**
   * 現在アクティブなシーンを取得
   */
  public getCurrentScene(): BaseScene | null {
    if (!this.currentSceneName) return null;
    return this.scenes.get(this.currentSceneName) || null;
  }

  /**
   * 現在アクティブなシーン名を取得
   */
  public getCurrentSceneName(): string | null {
    return this.currentSceneName;
  }

  /**
   * 指定したシーンを取得
   * @param sceneName シーン名
   */
  public getScene(sceneName: string): BaseScene | null {
    return this.scenes.get(sceneName) || null;
  }

  /**
   * スクロール位置に基づいてシーン更新
   * @param scrollProgress スクロール進捗 (0-1)
   * @param sceneName 更新するシーン名
   */
  public updateSceneByScroll(scrollProgress: number, sceneName: string): void {
    const scene = this.scenes.get(sceneName);
    console.log(
      `Updating scene "${sceneName}" with scroll progress: ${scrollProgress}`
    );
    if (scene) {
      scene.onScroll(scrollProgress);
    }
  }

  /**
   * 全シーンの更新
   * @param deltaTime 前フレームからの経過時間
   */
  public update(deltaTime: number): void {
    if (this.currentSceneName) {
      const currentScene = this.scenes.get(this.currentSceneName);
      if (currentScene) {
        currentScene.update(deltaTime);
      }
    }
  }
}
