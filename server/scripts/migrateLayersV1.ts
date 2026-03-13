

import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || "";

if (!MONGO_URI) {
  console.error("MONGO_URI is not set. Aborting migration.");
  process.exit(1);
}

const boardSchema = new mongoose.Schema({
  layers: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { strict: false });

const BoardMigrationModel = mongoose.model("Board", boardSchema);

const elementSchema = new mongoose.Schema({
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board" },
  layerId: { type: String, default: "" }
}, { strict: false });

const ElementMigrationModel = mongoose.model("Element", elementSchema);

const migrate = async () => {
  console.log("[Migration] Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("[Migration] Connected.");

  const boards = await BoardMigrationModel.find({});
  console.log(`[Migration] Found ${boards.length} boards.`);

  let boardsUpdated = 0;
  let elementsUpdated = 0;

  for (const board of boards) {
    const boardDoc = board as unknown as { layers?: { id: string }[] };
    const boardLayers = boardDoc.layers;
    const hasLayers = boardLayers && boardLayers.length > 0;

    let defaultLayerId: string;

    if (hasLayers) {
      defaultLayerId = boardLayers[0].id as string;
      console.log(`[Migration] Board ${board._id} already has layers — skipping layer creation.`);
    } else {
      defaultLayerId = crypto.randomUUID();
      await BoardMigrationModel.updateOne(
        { _id: board._id },
        {
          $set: {
            layers: [
              {
                id: defaultLayerId,
                name: "Layer 1",
                order: 0,
                isVisible: true,
                isLocked: false
              }
            ]
          }
        }
      );
      boardsUpdated++;
      console.log(`[Migration] Board ${board._id} — created default layer.`);
    }

    const result = await ElementMigrationModel.updateMany(
      {
        boardId: board._id,
        $or: [{ layerId: { $exists: false } }, { layerId: "" }, { layerId: null }]
      },
      { $set: { layerId: defaultLayerId } }
    );

    if (result.modifiedCount > 0) {
      elementsUpdated += result.modifiedCount;
      console.log(`[Migration] Board ${board._id} — updated ${result.modifiedCount} elements.`);
    }
  }

  console.log(`[Migration] Done. ${boardsUpdated} boards updated, ${elementsUpdated} elements updated.`);
  await mongoose.disconnect();
  process.exit(0);
};

migrate().catch((err) => {
  console.error("[Migration] Fatal error:", err);
  process.exit(1);
});
