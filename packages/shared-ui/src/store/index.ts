import { create } from 'zustand';

import { createRendererControlSlice } from './slices/rendererControlSlice';
import type { RendererControlSlice } from './slices/rendererControlSlice';

export type NexusStore = RendererControlSlice;

export const useNexusStore = create<NexusStore>()((set, get, api) => ({
    ...createRendererControlSlice(set, get, api),
}));

export * from './slices/rendererControlSlice';
