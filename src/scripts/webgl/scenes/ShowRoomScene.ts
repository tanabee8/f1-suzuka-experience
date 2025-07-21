import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { gsap } from 'gsap';

/**
 * ShowRoom部分の演出を担当するシーン
 */
export class ShowRoomScene extends BaseScene {
  private car: THREE.Group | null = null;
  private initialCameraPosition: THREE.Vector3;
  private targetCameraPosition: THREE.Vector3;

  constructor(camera: THREE.PerspectiveCamera) {
    super(camera);
    // カメラの初期位置と目標位置を保存
    this.initialCameraPosition = new THREE.Vector3(0, 1, 5);
    this.targetCameraPosition = new THREE.Vector3(3, 0, 2);
  }

  /**
   * シーンの初期化
   */
  protected init(): void {
    // 背景色の設定
    this.scene.background = new THREE.Color(0x111111);

    // ライトの追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(5, 10, 5);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.2;
    this.scene.add(spotLight);

    // 床の追加
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    this.scene.add(floor);

    // 仮の車モデル（後で実際のモデルに置き換え）
    this.createTempCarModel();
  }

  /**
   * 仮の車モデルを作成
   */
  private createTempCarModel(): void {
    this.car = new THREE.Group();

    // 車体
    const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    this.car.add(body);

    // タイヤ
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 32);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

    const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(-1, 0.4, 1);
    this.car.add(wheel1);

    const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel2.rotation.z = Math.PI / 2;
    wheel2.position.set(1, 0.4, 1);
    this.car.add(wheel2);

    const wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel3.rotation.z = Math.PI / 2;
    wheel3.position.set(-1, 0.4, -1);
    this.car.add(wheel3);

    const wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel4.rotation.z = Math.PI / 2;
    wheel4.position.set(1, 0.4, -1);
    this.car.add(wheel4);

    // 初期状態では回転させておく
    this.car.rotation.y = -Math.PI / 4;

    this.scene.add(this.car);
  }

  /**
   * アクティブ化時の処理
   */
  protected onActivate(): void {
    // カメラの初期位置設定
    this.camera.position.copy(this.initialCameraPosition);
    this.camera.lookAt(0, 0, 0);

    // 車の初期アニメーション
    if (this.car) {
      gsap.from(this.car.position, {
        y: -5,
        duration: 1.5,
        ease: 'power2.out'
      });

      gsap.from(this.car.rotation, {
        y: -Math.PI * 2,
        duration: 2,
        ease: 'power2.out'
      });
    }
  }

  /**
   * スクロール時の処理
   * @param progress スクロール進捗 (0-1)
   */
  public onScroll(progress: number): void {
    // スクロールに応じてカメラ位置をアニメーション
    if (progress < 0.5) {
      // 0-50%: 車の周りを回転
      const angle = progress * Math.PI * 2;
      const distance = 5 - progress * 3;

      this.camera.position.x = Math.sin(angle) * distance;
      this.camera.position.z = Math.cos(angle) * distance;
      this.camera.position.y = 1 + progress * 0.5;
      this.camera.lookAt(0, 0.5, 0);
    } else {
      // 50-100%: カメラを目標位置に近づける
      const t = (progress - 0.5) * 2; // 0-1に正規化

      // 現在の位置から目標位置へ線形補間
      this.camera.position.lerpVectors(
        new THREE.Vector3(
          this.camera.position.x,
          this.camera.position.y,
          this.camera.position.z
        ),
        this.targetCameraPosition,
        t * 0.1
      );
      this.camera.lookAt(0, 0.5, 0);
    }

    // 車の回転（10%から30%の間で1回転）
    if (this.car) {
      if (progress >= 0.1 && progress <= 0.3) {
        const rotationProgress = (progress - 0.1) / 0.2; // 0-1に正規化
        this.car.rotation.y = -Math.PI / 4 + rotationProgress * Math.PI * 2;
      } else if (progress > 0.3) {
        this.car.rotation.y = -Math.PI / 4 + Math.PI * 2;
      }
    }
  }

  /**
   * フレーム更新処理
   * @param deltaTime 前フレームからの経過時間
   */
  public update(deltaTime: number): void {
    // 車の自動回転（スクロール操作がない時）
    if (this.car && !this.isActive) {
      this.car.rotation.y += deltaTime * 0.1;
    }
  }
}
