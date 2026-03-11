import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Select, MenuItem, Box, Typography } from "@mui/material";
import { useResolveJoinRequestMutation, useGetJoinRequestsQuery } from "../../services/api/boardApi";

interface JoinRequestPayload {
  boardId: string;
  boardName: string;
  userId: string;
  userName: string;
  userEmail: string;
}

export const JoinRequestModal = () => {
  const [requests, setRequests] = useState<JoinRequestPayload[]>([]);
  const [selectedRole, setSelectedRole] = useState<"Collaborator" | "Viewer">("Viewer");
  const [resolveJoinRequest, { isLoading }] = useResolveJoinRequestMutation();
  const { data: joinRequestsData } = useGetJoinRequestsQuery(null, { pollingInterval: 15000 });

  useEffect(() => {
    if (joinRequestsData?.data) {
      setRequests(prev => {
        const newReqs = [...prev];
        joinRequestsData.data.forEach((incoming: JoinRequestPayload) => {
          if (!newReqs.some(r => r.boardId === incoming.boardId && r.userId === incoming.userId)) {
            newReqs.push(incoming);
          }
        });
        return newReqs;
      });
    }
  }, [joinRequestsData]);

  useEffect(() => {
    if (joinRequestsData?.data) {
      setRequests((prev) => {
        const newReqs = [...prev];
        joinRequestsData.data.forEach((incoming: JoinRequestPayload) => {
          if (!newReqs.some(r => r.boardId === incoming.boardId && r.userId === incoming.userId)) {
            newReqs.push(incoming);
          }
        });
        return newReqs;
      });
    }
  }, [joinRequestsData]);

  const handleResolve = async (boardId: string, userId: string, action: "accept" | "reject") => {
    try {
      await resolveJoinRequest({ 
        boardId, 
        userId, 
        action, 
        role: action === "accept" ? selectedRole : undefined 
      }).unwrap();
      setRequests((prev) => prev.filter(req => req.boardId !== boardId || req.userId !== userId));
    } catch {
      return;
    }
  };

  if (requests.length === 0) return null;

  const currentRequest = requests[0];

  return (
    <Dialog open={true} maxWidth="sm" fullWidth>
      <DialogTitle>Join Request</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          <strong>{currentRequest.userName}</strong> ({currentRequest.userEmail}) wants to join your whiteboard <strong>"{currentRequest.boardName}"</strong>.
        </DialogContentText>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Assign Role:
          </Typography>
          <Select
            size="small"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as "Collaborator" | "Viewer")}
            disabled={isLoading}
          >
            <MenuItem value="Viewer">Viewer (Read Only)</MenuItem>
            <MenuItem value="Collaborator">Editor (Can Draw)</MenuItem>
          </Select>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => handleResolve(currentRequest.boardId, currentRequest.userId, "reject")} 
          color="error"
          disabled={isLoading}
        >
          Reject
        </Button>
        <Button 
          onClick={() => handleResolve(currentRequest.boardId, currentRequest.userId, "accept")} 
          variant="contained" 
          color="primary"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Accept Request"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
