import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { UserBoardCard } from "./UserBoardCard";
import type { AdminUser } from "./UserBoardCard";
import type { Board as BoardData } from "../../../types/board.types";

interface Props {
  users: AdminUser[];
  boards: BoardData[];
}

const GridContainer = styled(Box)({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: "24px",
  width: "100%",
  marginTop: "24px"
});

export const UserList = ({ users, boards }: Props) => {
  return (
    <GridContainer>
      {users.map((user) => (
        <UserBoardCard key={user._id} user={user} boards={boards} />
      ))}
    </GridContainer>
  );
};
