import Grid from "@mui/material/Grid";
import { BoardCard } from "./BoardCard";

interface Board {
  _id: string;
  name: string;
  shareCode?: string;
  members: { user: string | { _id: string }; role: string }[];
}

interface Props {
  boards: Board[];
}

export const BoardGrid = ({ boards }: Props) => {

  return (

    <Grid container spacing={2}>

      {boards.map((board) => (

        <Grid
          key={board._id}
          size={{ xs: 12, sm: 6, md: 4 }}
        >
          <BoardCard
            id={board._id}
            name={board.name}
            shareCode={board.shareCode}
            members={board.members}
          />
        </Grid>

      ))}

    </Grid>

  );

};