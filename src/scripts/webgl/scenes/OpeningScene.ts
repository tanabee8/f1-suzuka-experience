import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { gsap } from 'gsap';

/**
 * オープニング演出を担当するシーン
 */
export class OpeningScene extends BaseScene {
  private cube: THREE.Mesh | null = null;

  constructor(camera: THREE.PerspectiveCamera) {
    super(camera);
  }

  /**
   * シーンの初期化
   */
  protected init(): void {
    // 背景色の設定
    this.scene.background = new THREE.Color(0x000000);

    // ライトの追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // テスト用のキューブを追加（後で実際のモデルに置き換え）
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);
  }

  /**
   * アクティブ化時の処理
   */
  protected onActivate(): void {
    // カメラのアニメーション
    gsap.to(this.camera.position, {
      z: 3,
      duration: 2,
      ease: 'power2.inOut'
    });

    // キューブのアニメーション
    if (this.cube) {
      gsap.to(this.cube.rotation, {
        x: Math.PI * 2,
        y: Math.PI * 2,
        duration: 2,
        ease: 'power2.inOut'
      });
    }
  }

  /**
   * フレーム更新処理
   * @param deltaTime 前フレームからの経過時間
   */
  public update(deltaTime: number): void {
    if (this.cube) {
      this.cube.rotation.x += deltaTime * 0.5;
      this.cube.rotation.y += deltaTime * 0.2;
    }
  }
}
