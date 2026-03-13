import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box, Typography } from "@mui/material";
import { useResolveJoinRequestMutation, useGetJoinRequestsQuery } from "../../services/api/boardApi";
import { useForm } from "react-hook-form";
import { FormSelect } from "../../components/ui/FormSelect";
import { styled } from "@mui/material/styles";

const StyledDialog = styled(Dialog)({
  '& .MuiPaper-root': {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(24px)',
    backgroundImage: 'none',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    boxShadow: '0 24px 50px -12px rgba(0, 0, 0, 0.5)',
  }
});

const StyledDialogTitle = styled(DialogTitle)({
  margin: 0,
  padding: '24px 32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  '& .MuiTypography-root': {
    fontWeight: 700,
    background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  }
});

const StyledDialogContent = styled(DialogContent)({
  padding: '24px 32px',
  backgroundColor: 'transparent',
});

const RequestText = styled(DialogContentText)({
  marginBottom: '16px',
  color: 'rgba(248, 250, 252, 0.8)',
  lineHeight: 1.6,
});

const ActionRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginTop: '24px',
  padding: '16px',
  borderRadius: '16px',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
});

const SelectWrapper = styled(Box)({
  minWidth: 200
});

const StyledDialogActions = styled(DialogActions)({
  padding: '24px 32px',
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  gap: '12px'
});

const AcceptButton = styled(Button)({
  borderRadius: '12px',
  padding: '10px 24px',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
});

const RejectButton = styled(Button)({
  borderRadius: '12px',
  padding: '10px 24px',
  fontWeight: 600,
  textTransform: 'none',
  opacity: 0.8,
  '&:hover': { opacity: 1 }
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
    <StyledDialog open={true} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        <Typography variant="h6">Join Request</Typography>
      </StyledDialogTitle>
      <StyledDialogContent>
        <RequestText>
          <strong>{currentRequest.userName}</strong> ({currentRequest.userEmail}) wants to join your whiteboard <strong>"{currentRequest.boardName}"</strong>.
        </RequestText>
        
        <ActionRow>
          <Typography variant="body2" color="rgba(248, 250, 252, 0.5)" fontWeight={500}>
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
      </StyledDialogContent>
      <StyledDialogActions>
        <RejectButton 
          onClick={handleSubmit((data) => handleResolve(data, currentRequest.boardId, currentRequest.userId, "reject"))} 
          color="error"
          disabled={isLoading}
        >
          Reject
        </RejectButton>
        <AcceptButton 
          onClick={handleSubmit((data) => handleResolve(data, currentRequest.boardId, currentRequest.userId, "accept"))} 
          variant="contained" 
          color="primary"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Accept Request"}
        </AcceptButton>
      </StyledDialogActions>
    </StyledDialog>
  );
};
