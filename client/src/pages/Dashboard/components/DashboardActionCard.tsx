import { Typography, Box, styled } from "@mui/material";
import { Card } from "../../../components/ui/Card";

interface DashboardActionCardProps {
  onClick: () => void;
  icon: React.ReactNode;
  text: string;
  type: "create" | "join";
}

const StyledCard = styled(Card)<{ actiontype: "create" | "join" }>(({ actiontype }) => ({
  padding: "2rem",
  textAlign: "center",
  flex: 1,
  minWidth: 250,
  background: actiontype === "create" ? "rgba(99, 102, 241, 0.05)" : "rgba(16, 185, 129, 0.05)",
  border: actiontype === "create" ? "2px dashed rgba(129, 140, 248, 0.3)" : "2px dashed rgba(16, 185, 129, 0.3)",
  cursor: "pointer",
  transition: "all 0.3s ease",
  "&:hover": {
    background: actiontype === "create" ? "rgba(99, 102, 241, 0.1)" : "rgba(16, 185, 129, 0.1)",
    borderColor: actiontype === "create" ? "rgba(129, 140, 248, 0.6)" : "rgba(16, 185, 129, 0.6)",
    transform: "translateY(-2px)"
  }
}));

const CardContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px"
});

const StyledIconWrapper = styled('span')<{ actiontype: "create" | "join" }>(({ actiontype }) => ({
  color: actiontype === "create" ? "#818cf8" : "#10b981",
  display: "flex",
  alignItems: "center"
}));

const StyledTypography = styled(Typography)<{ actiontype: "create" | "join" }>(({ actiontype }) => ({
  color: actiontype === "create" ? "#818cf8" : "#10b981",
  fontWeight: 600
}));

export const DashboardActionCard = ({ onClick, icon, text, type }: DashboardActionCardProps) => {
  return (
    <StyledCard onClick={onClick} actiontype={type}>
      <CardContent>
        <StyledIconWrapper actiontype={type}>{icon}</StyledIconWrapper>
        <StyledTypography variant="h6" actiontype={type}>
          {text}
        </StyledTypography>
      </CardContent>
    </StyledCard>
  );
};
