import { BoardModel } from "./board.model";
import { AppError } from "../../common/middlewares/errorHandler";
import crypto from "crypto";
import mongoose from "mongoose";
import { getIo } from "../../sockets/socket.server";
import { UserModel } from "../auth/auth.model";
import { ElementModel } from "../element/element.model";

interface BoardMemberPopulated {
  user: { _id: mongoose.Types.ObjectId; toString(): string; name?: string; email?: string };
  role: string;
  status: string;
}

interface JoinRequest {
  boardId: string;
  boardName: string;
  userId: string;
  userName: string;
  userEmail: string;
}

export const createBoard = async (userId: string, name: string) => {
  const shareCode = crypto.randomBytes(6).toString("hex");

  const board = await BoardModel.create({
    name,
    owner: new mongoose.Types.ObjectId(userId),
    members: [
      {
        user: new mongoose.Types.ObjectId(userId),
        role: "Owner",
        status: "Accepted"
      }
    ],
    shareCode
  });

  return board;
};

export const getUserBoards = async (userId: string) => {
  return BoardModel.find({
    members: {
      $elemMatch: {
        user: new mongoose.Types.ObjectId(userId),
        status: "Accepted"
      }
    }
  }).sort({ updatedAt: -1 });
};

export const getAllBoards = async () => {
  return BoardModel.find({}).populate("members.user", "name email").sort({ updatedAt: -1 });
};

export const getBoardById = async (boardId: string, userId: string, userRole?: string) => {
  const board = await BoardModel.findById(boardId).populate("members.user", "name email");

  if (!board) {
    throw new AppError("Board not found", 404);
  }

  if (userRole === "Admin") return board;

  const isMember = (board.members as BoardMemberPopulated[]).some((member) => {
    const memberId = member.user._id ? member.user._id.toString() : member.user.toString();
    return memberId === userId && member.status === "Accepted";
  });

  if (!isMember) {
    throw new AppError("Forbidden: You are not an accepted member of this board.", 403);
  }

  return board;
};

export const deleteBoard = async (boardId: string, userId: string, userRole?: string) => {
  const board = await BoardModel.findById(boardId);

  if (!board) {
    throw new AppError("Board not found", 404);
  }

  if (userRole !== "Admin" && board.owner.toString() !== userId) {
    throw new AppError("Only owner can delete board", 403);
  }

  await ElementModel.deleteMany({ boardId });
  await board.deleteOne();
};

export const joinBoardByShareCode = async (shareCode: string, userId: string) => {
  const board = await BoardModel.findOne({ shareCode });

  if (!board) {
    throw new AppError("Invalid share code", 404);
  }

  const alreadyMember = board.members.some((member) => member.user.toString() === userId);

  if (!alreadyMember) {
    board.members.push({
      user: new mongoose.Types.ObjectId(userId),
      role: "Viewer",
      status: "Pending",
      joinedAt: new Date()
    });
    await board.save();

    const io = getIo();
    const requestingUser = await UserModel.findById(userId).select("name email");
    if (requestingUser) {
      io.to(`user:${board.owner.toString()}`).emit("board:join_request", {
        boardId: board._id,
        boardName: board.name,
        userId: requestingUser._id,
        userName: requestingUser.name,
        userEmail: requestingUser.email
      });
    }
  }

  return board.populate("members.user", "name email");
};

export const getPendingJoinRequests = async (ownerId: string) => {
  const boards = await BoardModel.find({
    owner: new mongoose.Types.ObjectId(ownerId),
    "members.status": "Pending"
  }).populate("members.user", "name email");

  const requests: JoinRequest[] = [];

  boards.forEach((board) => {
    (board.members as BoardMemberPopulated[]).forEach((member) => {
      if (member.status === "Pending" && member.user) {
        requests.push({
          boardId: board._id.toString(),
          boardName: board.name,
          userId: member.user._id.toString(),
          userName: member.user.name ?? "",
          userEmail: member.user.email ?? ""
        });
      }
    });
  });

  return requests;
};

export const resolveJoinRequest = async (
  boardId: string,
  ownerId: string,
  targetUserId: string,
  action: "accept" | "reject",
  role?: "Collaborator" | "Viewer"
) => {
  const board = await BoardModel.findById(boardId);

  if (!board) throw new AppError("Board not found", 404);

  if (board.owner.toString() !== ownerId) {
    throw new AppError("Only the board owner can resolve join requests", 403);
  }

  const memberIndex = board.members.findIndex(
    (member) => member.user.toString() === targetUserId && member.status === "Pending"
  );

  if (memberIndex === -1) {
    throw new AppError("Pending request not found for this user", 404);
  }

  if (action === "accept") {
    board.members[memberIndex].status = "Accepted";
    if (role) board.members[memberIndex].role = role;
  } else {
    board.members.splice(memberIndex, 1);
  }

  await board.save();

  const io = getIo();
  io.to(`user:${targetUserId}`).emit("board:join_resolved", {
    boardId,
    status: action === "accept" ? "Accepted" : "Rejected"
  });

  return board.populate("members.user", "name email");
};

export const updateMemberRole = async (
  boardId: string,
  ownerId: string,
  targetUserId: string,
  newRole: "Collaborator" | "Viewer"
) => {
  const board = await BoardModel.findById(boardId);

  if (!board) {
    throw new AppError("Board not found", 404);
  }

  if (board.owner.toString() !== ownerId) {
    throw new AppError("Only the board owner can change roles", 403);
  }

  const member = board.members.find((m) => m.user.toString() === targetUserId);

  if (!member) {
    throw new AppError("User is not a member of this board", 404);
  }

  if (member.role === "Owner") {
    throw new AppError("Cannot change role of the board owner", 400);
  }

  member.role = newRole;
  await board.save();

  return board.populate("members.user", "name email");
};

export const removeMember = async (boardId: string, ownerId: string, targetUserId: string) => {
  const board = await BoardModel.findById(boardId);

  if (!board) {
    throw new AppError("Board not found", 404);
  }

  if (board.owner.toString() !== ownerId && ownerId !== targetUserId) {
    throw new AppError("Only the board owner can remove members, or you can leave the board yourself", 403);
  }

  const memberIndex = board.members.findIndex((member) => member.user.toString() === targetUserId);

  if (memberIndex === -1) {
    throw new AppError("User is not a member of this board", 404);
  }

  if (board.members[memberIndex].role === "Owner") {
    throw new AppError("Cannot remove the board owner", 400);
  }

  board.members.splice(memberIndex, 1);
  await board.save();

  const io = getIo();
  io.to(boardId).emit("board:removed", { boardId, userId: targetUserId });

  return board.populate("members.user", "name email");
};