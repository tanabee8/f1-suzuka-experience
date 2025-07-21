export interface Store {
  states: Record<string | number | symbol, any>;
  actions: Record<string | number | symbol, (...param: any) => any>;
  subscribe?: (callback: (state: any) => void) => () => void;
}

interface StatesType {
  [key: string | number | symbol]: any;
}

interface ActionsType {
  [key: string | number | symbol]: (...param: any) => any;
}
