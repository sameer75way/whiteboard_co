import type { CanvasElement } from "../../common/types/element.types";
import type { ILayer } from "../layer/layer.model";
import type { IComment } from "../comment/comment.model";

export interface SnapshotListItem {
  id: string;
  boardId: string;
  type: "auto" | "manual" | "restore";
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface SnapshotDetail extends SnapshotListItem {
  state: {
    elements: CanvasElement[];
    layers: ILayer[];
    comments: IComment[];
  };
}

export interface CreateSnapshotInput {
  boardId: string;
  type: "auto" | "manual" | "restore";
  name: string;
  state: {
    elements: CanvasElement[];
    layers: ILayer[];
    comments: IComment[];
  };
  createdBy: string;
}

export interface RestoreResult {
  newSnapshotId: string;
  restoredElements: CanvasElement[];
  restoredLayers: ILayer[];
}

export interface PaginatedSnapshots {
  snapshots: SnapshotListItem[];
  total: number;
  page: number;
  totalPages: number;
}
