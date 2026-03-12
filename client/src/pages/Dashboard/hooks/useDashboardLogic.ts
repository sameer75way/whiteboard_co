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

import { getErrorMessage } from "../../../lib/utils/typeGuards";

interface JoinBoardResponse {
  data: {
    _id: string;
    members: { user: string | { _id?: string; id?: string }; status: string; role: string }[];
  }
}

interface CreateBoardResponse {
  data: {
    _id: string;
    name: string;
  }
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
      const res = await createBoard({ name }).unwrap() as CreateBoardResponse;
      const board = res.data;
      navigate(`/board/${board._id}`);
      setCreateOpen(false);
    } catch (error) {
      setAlertInfo({
        open: true,
        message: getErrorMessage(error),
        severity: "error"
      });
    }
  }, [createBoard, navigate]);

  const handleJoinBoard = useCallback(async (shareCode: string) => {
    try {
      const res = await joinBoard({ shareCode }).unwrap() as JoinBoardResponse;
      const board = res.data;
      setJoinOpen(false);

      const myId = currentUser?.id;
      const currentMember = board.members.find((member) => {
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
    } catch (error) {
      setAlertInfo({ open: true, message: getErrorMessage(error), severity: "error" });
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

    const handleMembersUpdated = () => {
      dispatch(baseApi.util.invalidateTags(["Board"]));
    };

    const handleBoardRemoved = (payload: { userId: string }) => {
      if (payload.userId === currentUser?.id) {
        dispatch(baseApi.util.invalidateTags(["Board"]));
      }
    };

    const handleBoardDeleted = () => {
      dispatch(baseApi.util.invalidateTags(["Board"]));
    };

    socket.on("board:join_resolved", handleJoinResolved);
    socket.on("board:members_updated", handleMembersUpdated);
    socket.on("board:removed", handleBoardRemoved);
    socket.on("board:deleted", handleBoardDeleted);

    return () => {
      socket.off("board:join_resolved", handleJoinResolved);
      socket.off("board:members_updated", handleMembersUpdated);
      socket.off("board:removed", handleBoardRemoved);
      socket.off("board:deleted", handleBoardDeleted);
    };
  }, [waitingApprovalOpen, waitingBoardId, navigate, dispatch, currentUser?.id]);

  const handleCloseAlert = () => {
    setAlertInfo((prev: AlertInfo) => ({ ...prev, open: false }));
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
