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
          <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
            {user.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
            {user.email}
          </Typography>
        </Box>
        <Chip 
          label={user.role} 
          size="small" 
          color={user.role === "Admin" ? "error" : "primary"}
          variant="outlined"
        />
      </UserHeader>

      <Box sx={{ mt: 1, pt: 2, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <Typography variant="subtitle2" sx={{ color: "text.primary", mb: 1, fontWeight: 600 }}>
          Associated Boards ({userBoards.length})
        </Typography>
        
        {userBoards.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
            No boards joined yet.
          </Typography>
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
                <Box key={board._id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography noWrap variant="body2" sx={{ color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "60%" }}>
                    • {board.name}
                  </Typography>
                  <Tooltip title={`Role: ${role}`} placement="left">
                    <Chip size="small" label={role} sx={{ fontSize: "0.65rem", height: "18px" }} />
                  </Tooltip>
                </Box>
              );
            })}
            {userBoards.length > 3 && (
              <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5 }}>
                + {userBoards.length - 3} more...
              </Typography>
            )}
          </BoardsList>
        )}
      </Box>
    </UserCard>
  );
};
