import { Box, Typography, Chip, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Card } from "../../../components/ui/Card";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

import type { Board as BoardData } from "../../../types/board.types";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

interface UserBoardCardProps {
  user: AdminUser;
  boards: BoardData[];
}

const UserCard = styled(Card)({
  padding: "1.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  background: "rgba(30, 41, 59, 0.7)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
  }
});

const UserHeader = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
});

const BoardsList = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  marginTop: "auto",
});

const UserName = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

const UserEmail = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1),
}));

const BoardsSection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  paddingTop: theme.spacing(2),
  borderTop: "1px solid rgba(255,255,255,0.05)",
}));

const BoardsTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
  fontWeight: 600,
}));

const EmptyBoardsText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontStyle: "italic",
}));

const BoardListItem = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

const BoardName = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "60%",
}));

const RoleChip = styled(Chip)({
  fontSize: "0.65rem",
  height: "18px",
});

const MoreText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  marginTop: theme.spacing(0.5),
}));

export const UserBoardCard = ({ user, boards }: UserBoardCardProps) => {
  const userBoards = boards.filter((board) => 
    board.members.some((member) => {
      if (!member.user) return false;
      const memberId = typeof member.user === 'object' ? member.user._id : member.user;
      return memberId === user._id;
    })
  );

  return (
    <UserCard>
      <UserHeader>
        <Box>
          <UserName variant="h6">
            {user.name}
          </UserName>
          <UserEmail variant="body2">
            {user.email}
          </UserEmail>
        </Box>
        <Chip 
          label={user.role} 
          size="small" 
          color={user.role === "Admin" ? "error" : "primary"}
          variant="outlined"
        />
      </UserHeader>

      <BoardsSection>
        <BoardsTitle variant="subtitle2">
          Associated Boards ({userBoards.length})
        </BoardsTitle>
        
        {userBoards.length === 0 ? (
          <EmptyBoardsText variant="body2">
            No boards joined yet.
          </EmptyBoardsText>
        ) : (
          <BoardsList>
            {userBoards.slice(0, 3).map((board) => {
              const currentMember = board.members.find(m => {
                if (!m.user) return false;
                const memberId = typeof m.user === 'object' ? m.user._id : m.user;
                return memberId === user._id;
              });
              const role = currentMember?.role || "Viewer";
              return (
                <BoardListItem key={board._id}>
                  <BoardName noWrap variant="body2">
                    • {board.name}
                  </BoardName>
                  <Tooltip title={`Role: ${role}`} placement="left">
                    <RoleChip size="small" label={role} />
                  </Tooltip>
                </BoardListItem>
              );
            })}
            {userBoards.length > 3 && (
              <MoreText variant="caption">
                + {userBoards.length - 3} more...
              </MoreText>
            )}
          </BoardsList>
        )}
      </BoardsSection>
    </UserCard>
  );
};
