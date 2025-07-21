import type { Store } from '../types/store.d.ts';
import { proxy, subscribe } from 'valtio/vanilla';
import type { LocationData, TeamRadioData } from '../api/openF1API';
import * as THREE from 'three';

interface ScrollStoreType {
  scrollAmount: number;
  scrollPercentage: number;
}

interface F1DataStoreType {
  locationData: LocationData[] | null;
  teamRadioData: TeamRadioData[] | null;
  f1Model: THREE.Group | null;
  isLoading: boolean;
  loadingProgress: {
    locationApi: boolean;
    teamRadioApi: boolean;
    model: boolean;
  };
}

export const scrollStore = proxy<Store>({
  states: {
    scrollStore: {
      scrollAmount: 0,
      scrollPercentage: 0
    } as ScrollStoreType,
    f1DataStore: {
      locationData: null,
      teamRadioData: null,
      f1Model: null,
      isLoading: true,
      loadingProgress: {
        locationApi: false,
        teamRadioApi: false,
        model: false
      }
    } as F1DataStoreType
  },
  actions: {
    setScrollAmount(amount: number) {
      scrollStore.states.scrollStore.scrollAmount = amount;
    },
    setScrollPercentage(percentage: number) {
      scrollStore.states.scrollStore.scrollPercentage = percentage;
    },
    // F1データ関連のアクション
    setLocationData(data: LocationData[]) {
      scrollStore.states.f1DataStore.locationData = data;
      scrollStore.states.f1DataStore.loadingProgress.locationApi = true;
      this.checkLoadingComplete();
    },
    setTeamRadioData(data: TeamRadioData[]) {
      scrollStore.states.f1DataStore.teamRadioData = data;
      scrollStore.states.f1DataStore.loadingProgress.teamRadioApi = true;
      this.checkLoadingComplete();
    },
    setF1Model(model: THREE.Group) {
      scrollStore.states.f1DataStore.f1Model = model;
      scrollStore.states.f1DataStore.loadingProgress.model = true;
      this.checkLoadingComplete();
    },
    checkLoadingComplete() {
      const { locationApi, teamRadioApi, model } =
        scrollStore.states.f1DataStore.loadingProgress;
      if (locationApi && teamRadioApi && model) {
        scrollStore.states.f1DataStore.isLoading = false;
      }
    }
  }
});

// 購読用のヘルパー関数を追加
scrollStore.subscribe = (
  callback: (state: { scrollAmount: number; scrollPercentage: number }) => void
) => {
  return subscribe(scrollStore.states.scrollStore, () => {
    callback({
      scrollAmount: scrollStore.states.scrollStore.scrollAmount,
      scrollPercentage: scrollStore.states.scrollStore.scrollPercentage
    });
  });
};
