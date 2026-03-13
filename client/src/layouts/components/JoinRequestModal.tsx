import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box, Typography } from "@mui/material";
import { useResolveJoinRequestMutation, useGetJoinRequestsQuery } from "../../services/api/boardApi";
import { useForm } from "react-hook-form";
import { FormSelect } from "../../components/ui/FormSelect";
import { styled } from "@mui/material/styles";

const RequestText = styled(DialogContentText)(({ theme }) => ({
  marginBottom: theme.spacing(2)
}));

const ActionRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(3)
}));

const SelectWrapper = styled(Box)({
  minWidth: 200
});

interface JoinRequestPayload {
  boardId: string;
  boardName: string;
  userId: string;
  userName: string;
  userEmail: string;
}

interface FormValues {
  role: "Collaborator" | "Viewer";
}

export const JoinRequestModal = () => {
  const [requests, setRequests] = useState<JoinRequestPayload[]>([]);
  const [resolveJoinRequest, { isLoading }] = useResolveJoinRequestMutation();
  const { data: joinRequestsData } = useGetJoinRequestsQuery(null, { pollingInterval: 15000 });

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { role: "Viewer" }
  });

  useEffect(() => {
    if (joinRequestsData?.data) {
      const timer = setTimeout(() => {
        setRequests(prev => {
          let changed = false;
          const newReqs = [...prev];
          joinRequestsData.data.forEach((incoming: JoinRequestPayload) => {
            if (!newReqs.some(r => r.boardId === incoming.boardId && r.userId === incoming.userId)) {
              newReqs.push(incoming);
              changed = true;
            }
          });
          return changed ? newReqs : prev;
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [joinRequestsData]);

  const handleResolve = async (data: FormValues, boardId: string, userId: string, action: "accept" | "reject") => {
    try {
      await resolveJoinRequest({ 
        boardId, 
        userId, 
        action, 
        role: action === "accept" ? data.role : undefined 
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
        <RequestText>
          <strong>{currentRequest.userName}</strong> ({currentRequest.userEmail}) wants to join your whiteboard <strong>"{currentRequest.boardName}"</strong>.
        </RequestText>
        
        <ActionRow>
          <Typography variant="body2" color="text.secondary">
            Assign Role:
          </Typography>
          <SelectWrapper>
            <FormSelect
              name="role"
              control={control}
              options={[
                { value: "Viewer", label: "Viewer (Read Only)" },
                { value: "Collaborator", label: "Editor (Can Draw)" }
              ]}
              isDisabled={isLoading}
            />
          </SelectWrapper>
        </ActionRow>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleSubmit((data) => handleResolve(data, currentRequest.boardId, currentRequest.userId, "reject"))} 
          color="error"
          disabled={isLoading}
        >
          Reject
        </Button>
        <Button 
          onClick={handleSubmit((data) => handleResolve(data, currentRequest.boardId, currentRequest.userId, "accept"))} 
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
