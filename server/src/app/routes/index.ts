import { Router } from "express";

import { authRoutes } from "../modules/auth/auth.routes";
import { boardRoutes } from "../modules/board/board.routes";
import { elementRoutes } from "../modules/element/element.routes";
import { syncRoutes } from "../modules/sync/sync.routes";
import { layerRoutes } from "../modules/layer/layer.routes";
import { snapshotRoutes } from "../modules/snapshot/snapshot.routes";
import { commentRoutes } from "../modules/comment/comment.routes";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/boards", boardRoutes);
routes.use("/boards/:boardId/layers", layerRoutes);
routes.use("/boards/:boardId/snapshots", snapshotRoutes);
routes.use("/elements", elementRoutes);
routes.use("/elements", commentRoutes);
routes.use("/sync", syncRoutes);