import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { gsap } from 'gsap';

/**
 * RaceMap部分の演出を担当するシーン
 */
export class RaceMapScene extends BaseScene {
  private track: THREE.Group | null = null;
  private car: THREE.Mesh | null = null;
  private trackPath: THREE.Vector3[] = [];

  constructor(camera: THREE.PerspectiveCamera) {
    super(camera);
  }

  /**
   * シーンの初期化
   */
  protected init(): void {
    // 背景色の設定
    this.scene.background = new THREE.Color(0x050505);

    // ライトの追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);

    // トラックの作成（鈴鹿サーキットを模した簡易版）
    this.createTrack();
  }

  /**
   * 簡易的なトラックの作成
   */
  private createTrack(): void {
    this.track = new THREE.Group();

    // 鈴鹿サーキットを模した形状のパス
    // 実際のコースデータに置き換えるべき
    const trackShape = new THREE.Shape();
    trackShape.moveTo(0, 0);
    trackShape.bezierCurveTo(2, 0, 2, 2, 0, 2);
    trackShape.bezierCurveTo(-3, 2, -3, -2, 0, -2);
    trackShape.bezierCurveTo(4, -2, 4, -6, 0, -6);
    trackShape.bezierCurveTo(-5, -6, -5, 0, 0, 0);

    const trackGeometry = new THREE.ExtrudeGeometry(trackShape, {
      depth: 0.1,
      bevelEnabled: false
    });

    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    });

    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.rotation.x = -Math.PI / 2;
    track.position.y = -0.05;

    this.track = new THREE.Group();
    this.track.add(track);

    // トラック内側のライン
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const linePoints = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = 5 * Math.sin(t * Math.PI * 2);
      const z = 5 * Math.cos(t * Math.PI * 2);
      linePoints.push(new THREE.Vector3(x * 0.8, 0, z * 0.8));
    }

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.track.add(line);

    this.scene.add(this.track);
  }

  /**
   * 車の作成
   */

  /**
   * アクティブ化時の処理
   */
  protected onActivate(): void {
    // カメラの初期位置設定
    this.camera.position.set(0, 8, 0);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * スクロール時の処理
   * @param progress スクロール進捗 (0-1)
   */
  public onScroll(progress: number): void {
    console.log(`Scroll progress: ${progress}`);
  }

  /**
   * フレーム更新処理
   * @param deltaTime 前フレームからの経過時間
   */
  public update(deltaTime: number): void {
    // トラックの自動回転（スクロール操作がない時）
    if (this.track && !this.isActive) {
      this.track.rotation.y += deltaTime * 0.1;
    }
  }
}
