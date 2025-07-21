import type { Store } from '../types/store.d.ts';
import { proxy, subscribe } from 'valtio/vanilla';

interface ScrollStoreType {
  scrollAmount: number;
  scrollPercentage: number;
}

export const scrollStore = proxy<Store>({
  states: {
    scrollStore: {
      scrollAmount: 0,
      scrollPercentage: 0
    } as ScrollStoreType
  },
  actions: {
    setScrollAmount(amount: number) {
      scrollStore.states.scrollStore.scrollAmount = amount;
    },
    setScrollPercentage(percentage: number) {
      scrollStore.states.scrollStore.scrollPercentage = percentage;
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
