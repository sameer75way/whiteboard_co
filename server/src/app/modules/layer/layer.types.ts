export interface LayerCreateInput {
  name: string;
}

export interface LayerUpdateInput {
  name?: string;
  isVisible?: boolean;
  isLocked?: boolean;
}

export interface ReorderLayersInput {
  orderedLayerIds: string[];
}

export interface MoveElementToLayerInput {
  newLayerId: string;
}
