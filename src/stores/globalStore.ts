import type { Store } from '../types/store.d.ts';
import { proxy } from 'valtio/vanilla';

interface scrollStoreType {
  scrollAmount: number;
  scrollPercentage: number;
}

export const scrollStore = proxy<Store>({
  states: {
    scrollStore: {
      scrollAmount: 0,
      scrollPercentage: 0
    } as scrollStoreType
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
