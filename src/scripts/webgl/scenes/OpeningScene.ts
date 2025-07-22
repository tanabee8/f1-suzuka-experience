import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { gsap } from 'gsap';
import { scrollStore } from '../../../stores/globalStore';

/**
 * オープニング演出を担当するシーン
 */
export class OpeningScene extends BaseScene {
  private cube: THREE.Mesh | null = null;
  private isExiting: boolean = false;
  private exitAnimationComplete: boolean = false;
  private onExitComplete: (() => void) | null = null;

  constructor(camera: THREE.PerspectiveCamera) {
    super(camera);

    // オープニング終了イベントのリスナー登録
    document.addEventListener(
      'opening-end-animation',
      this.startExitAnimation.bind(this)
    );
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
   * オープニング終了アニメーションを開始
   */
  private startExitAnimation(): void {
    if (this.isExiting) return; // すでに終了中なら何もしない

    this.isExiting = true;
    console.log('オープニングシーン終了アニメーション開始');

    // カメラを遠ざけるアニメーション
    gsap.to(this.camera.position, {
      z: 20,
      duration: 2,
      ease: 'power2.inOut',
      onComplete: () => {
        this.exitAnimationComplete = true;
        console.log('オープニングシーン終了アニメーション完了');

        // シーン変更を有効にする
        scrollStore.actions.setOpeningTransitionComplete(true);

        // コールバックがあれば実行
        if (this.onExitComplete) {
          this.onExitComplete();
        }
      }
    });

    // キューブを回転させながら小さくするアニメーション
    if (this.cube) {
      gsap.to(this.cube.rotation, {
        x: Math.PI * 4,
        y: Math.PI * 4,
        duration: 2,
        ease: 'power2.inOut'
      });

      gsap.to(this.cube.scale, {
        x: 0.1,
        y: 0.1,
        z: 0.1,
        duration: 2,
        ease: 'power2.inOut'
      });
    }
  }

  /**
   * 終了アニメーション完了後のコールバックを設定
   * @param callback 実行するコールバック関数
   */
  public setOnExitComplete(callback: () => void): void {
    this.onExitComplete = callback;
    // すでにアニメーションが完了している場合は即時実行
    if (this.exitAnimationComplete) {
      callback();
    }
  }

  /**
   * フレーム更新処理
   * @param deltaTime 前フレームからの経過時間
   */
  public update(deltaTime: number): void {
    if (this.cube && !this.isExiting) {
      this.cube.rotation.x += deltaTime * 0.5;
      this.cube.rotation.y += deltaTime * 0.2;
    }
  }
}
