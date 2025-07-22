import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scrollStore } from '@stores/globalStore';

/**
 * 3Dモデルのローディングユーティリティ
 */
export class ModelLoader {
  private static dracoLoader: DRACOLoader;
  private static gltfLoader: GLTFLoader;

  /**
   * DRACOローダーの初期化
   */
  private static initDracoLoader(): void {
    if (!this.dracoLoader) {
      this.dracoLoader = new DRACOLoader();
      this.dracoLoader.setDecoderPath(
        'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'
      );
      this.dracoLoader.setDecoderConfig({ type: 'js' });
    }
  }

  /**
   * GLTFローダーの初期化
   */
  private static initGltfLoader(): void {
    if (!this.gltfLoader) {
      this.gltfLoader = new GLTFLoader();
      this.initDracoLoader();
      this.gltfLoader.setDRACOLoader(this.dracoLoader);
    }
  }

  /**
   * F1モデルをロードする
   * @returns Promise<THREE.Group> ロードされたモデル
   */
  public static async loadF1Model(): Promise<THREE.Group> {
    this.initGltfLoader();

    return new Promise((resolve, reject) => {
      const modelPath = '/model/f1_2026_audi_fom_webp-draco.glb';

      this.gltfLoader.load(
        modelPath,
        (gltf) => {
          const model = gltf.scene;

          // スケールと位置を適切に調整
          model.scale.set(1, 1, 1);
          model.position.set(0, 0, 0);

          // モデルのセットアップ（必要に応じて）
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              // 必要に応じてマテリアルやジオメトリを調整
            }
          });

          scrollStore.actions.setF1Model(model);

          resolve(model);
        },
        (progress) => {
          const percentComplete = (progress.loaded / progress.total) * 100;
          console.log(`モデルロード進捗: ${percentComplete.toFixed(1)}%`);
        },
        (error) => {
          console.error('モデルのロードに失敗しました:', error);
          reject(error);
        }
      );
    });
  }
}
