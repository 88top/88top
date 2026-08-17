export interface IBrowserItem {
  id: string;
  title: string;
  url: string;
  favicon: string;
  headers?: Record<string, any>;
}

export interface IBrowser {
  activeTab: string;
  tabs: IBrowserItem[];
  history: IBrowserItem[];
}

export const init: IBrowser = {
  activeTab: '',
  tabs: [],
  history: [],
};

export default init;
