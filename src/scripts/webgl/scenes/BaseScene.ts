import * as THREE from 'three';

/**
 * すべてのシーンの基底クラス
 * 共通の機能を提供する
 */
export abstract class BaseScene {
  public scene: THREE.Scene;
  protected camera: THREE.PerspectiveCamera;
  protected isActive: boolean = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.scene = new THREE.Scene();
    this.camera = camera;

    // シーンの初期化
    this.init();
  }

  /**
   * シーンの初期化
   * オーバーライドして実装
   */
  protected abstract init(): void;

  /**
   * シーンをアクティブ化
   */
  public activate(): void {
    this.isActive = true;
    this.onActivate();
  }

  /**
   * シーンを非アクティブ化
   */
  public deactivate(): void {
    this.isActive = false;
    this.onDeactivate();
  }

  /**
   * アクティブ化時の処理
   * オーバーライド可能
   */
  protected onActivate(): void {}

  /**
   * 非アクティブ化時の処理
   * オーバーライド可能
   */
  protected onDeactivate(): void {}

  /**
   * スクロール時の処理
   * @param progress スクロール進捗 (0-1)
   */
  public onScroll(progress: number): void {}

  /**
   * フレーム更新処理
   * @param deltaTime 前フレームからの経過時間
   */
  public update(deltaTime: number): void {}

  /**
   * リソースの破棄
   */
  public dispose(): void {
    // シーン内のオブジェクトのリソース解放
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => {
              this.disposeMaterial(material);
            });
          } else {
            this.disposeMaterial(object.material);
          }
        }
      }
    });
  }

  /**
   * マテリアルのリソース解放
   * @param material 破棄するマテリアル
   */
  private disposeMaterial(material: THREE.Material): void {
    // テクスチャの解放
    for (const key in material) {
      const value = (material as any)[key];
      if (value && value.isTexture) {
        value.dispose();
      }
    }

    material.dispose();
  }
}
