import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../../../services/socket/socketClient";
import {
  useGetBoardsQuery,
  useCreateBoardMutation,
  useJoinBoardMutation,
  useGetAllBoardsQuery,
} from "../../../services/api/boardApi";
import { baseApi } from "../../../services/api/baseApi";
import type { RootState } from "../../../store/index";

interface BoardMember {
  user: string | { _id?: string; id?: string };
  status: "Pending" | "Accepted";
  role: string;
}

interface AlertInfo {
  open: boolean;
  message: string;
  severity: "error" | "success";
}

export const useDashboardLogic = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isAdmin = currentUser?.role === "Admin";

  const { data, isLoading: isRegularLoading } = useGetBoardsQuery(null);
  const { data: allBoardsData, isLoading: isAdminLoading } = useGetAllBoardsQuery(undefined, { skip: !isAdmin });

  const [createBoard] = useCreateBoardMutation();
  const [joinBoard] = useJoinBoardMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    open: false,
    message: "",
    severity: "error"
  });

  const [waitingApprovalOpen, setWaitingApprovalOpen] = useState(false);
  const [waitingBoardId, setWaitingBoardId] = useState<string | null>(null);

  const boards = useMemo(() => {
    if (isAdmin) return allBoardsData?.data || [];
    return data?.data || [];
  }, [data, allBoardsData, isAdmin]);

  const isLoading = isAdmin ? isAdminLoading : isRegularLoading;

  const handleCreateBoard = useCallback(async (name: string) => {
    try {
      const res = await createBoard({ name }).unwrap();
      const board = res.data;
      navigate(`/board/${board._id}`);
      setCreateOpen(false);
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      setAlertInfo({
        open: true,
        message: message ?? "Failed to create board. Name must be at least 2 characters.",
        severity: "error"
      });
    }
  }, [createBoard, navigate]);

  const handleJoinBoard = useCallback(async (shareCode: string) => {
    try {
      const res = await joinBoard({ shareCode }).unwrap();
      const board = res.data;
      setJoinOpen(false);

      const myId = currentUser?.id;
      const currentMember = board.members.find((member: BoardMember) => {
        const memberId = typeof member.user === "string"
          ? member.user
          : (member.user?._id ?? member.user?.id ?? "");
        return memberId === myId;
      });

      if (currentMember?.status === "Pending") {
        setWaitingBoardId(board._id);
        setWaitingApprovalOpen(true);
      } else if (currentMember?.status === "Accepted") {
        navigate(`/board/${board._id}`);
      } else {
        setAlertInfo({ open: true, message: "Join request sent! Waiting for owner approval.", severity: "success" });
      }
    } catch {
      setAlertInfo({ open: true, message: "Invalid share code. Please try again.", severity: "error" });
    }
  }, [joinBoard, navigate, currentUser]);

  useEffect(() => {
    const handleJoinResolved = (payload: { boardId: string; status: "Accepted" | "Rejected" }) => {
      if (waitingApprovalOpen && payload.boardId === waitingBoardId) {
        setWaitingApprovalOpen(false);
        setWaitingBoardId(null);

        if (payload.status === "Accepted") {
          dispatch(baseApi.util.invalidateTags(["Board"]));
          navigate(`/board/${payload.boardId}`);
        } else {
          setAlertInfo({ open: true, message: "Your join request was rejected by the owner.", severity: "error" });
        }
      }
    };

    socket.on("board:join_resolved", handleJoinResolved);
    return () => {
      socket.off("board:join_resolved", handleJoinResolved);
    };
  }, [waitingApprovalOpen, waitingBoardId, navigate, dispatch]);

  const handleCloseAlert = () => {
    setAlertInfo((prev) => ({ ...prev, open: false }));
  };

  return {
    boards,
    isLoading,
    isAdmin,
    createOpen,
    joinOpen,
    alertInfo,
    waitingApprovalOpen,
    setCreateOpen,
    setJoinOpen,
    setWaitingApprovalOpen,
    handleCreateBoard,
    handleJoinBoard,
    handleCloseAlert
  };
};
