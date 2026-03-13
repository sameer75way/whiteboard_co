import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  Button,
  CircularProgress,
  Divider,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import { styled } from "@mui/material/styles";
import { useListSnapshotsQuery, useGetSnapshotQuery } from "../../../../services/api/snapshotApi";
import {
  setSnapshots,
  selectSnapshots,
  selectTotalSnapshots,
  setPreviewOpen,
  setPreviewSnapshot,
  type SnapshotListItem,
  type SnapshotDetail
} from "../../../../store/snapshot/snapshotSlice";
import { SnapshotRow } from "./SnapshotRow";

interface VersionHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
}

const DrawerContent = styled(Box)({
  width: 320,
  maxWidth: "100vw",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  background: "rgba(15, 23, 42, 0.98)"
});

const DrawerHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "24px 20px",
  background: "linear-gradient(to bottom, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 0) 100%)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  position: "sticky",
  top: 0,
  zIndex: 10
});

const SnapshotList = styled(Box)({
  flex: 1,
  overflowY: "auto",
  padding: "16px 12px"
});

const EmptyState = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "48px 24px",
  textAlign: "center",
  gap: "16px",
  opacity: 0.8
});

const LoadMoreBox = styled(Box)({
  display: "flex",
  justifyContent: "center",
  padding: "16px"
});

const FilterContainer = styled(Box)({
  padding: "16px 20px 8px 20px",
  display: "flex",
  justifyContent: "center"
});

const StyledDrawer = styled(Drawer)({
  zIndex: 1200,
  "& .MuiDrawer-paper": {
    background: "rgba(15, 23, 42, 0.98)",
    backdropFilter: "blur(16px)",
    top: "72px",
    height: "calc(100% - 72px)",
    borderTopLeftRadius: "8px"
  }
});

const CloseButton = styled(IconButton)({
  background: "rgba(255,255,255,0.05)",
  "&:hover": { background: "rgba(255,255,255,0.1)" }
});

const StyledToggleButtonGroup = styled(ToggleButtonGroup)({
  "& .MuiToggleButton-root": {
    color: "rgba(255,255,255,0.6)",
    borderColor: "rgba(255,255,255,0.1)",
    textTransform: "none",
    "&.Mui-selected": {
      color: "white",
      backgroundColor: "rgba(255,255,255,0.1)"
    }
  }
});

export const VersionHistoryPanel = ({
  open,
  onClose,
  boardId
}: VersionHistoryPanelProps) => {
  const dispatch = useDispatch();
  const snapshots = useSelector(selectSnapshots);
  const totalSnapshots = useSelector(selectTotalSnapshots);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<"all" | "auto" | "manual">("all");

  const { data, isLoading } = useListSnapshotsQuery(
    { boardId, page, limit: 20 },
    { skip: !open }
  );

  const [previewId, setPreviewId] = useState<string | null>(null);
  const { data: previewData } = useGetSnapshotQuery(
    { boardId, snapshotId: previewId ?? "" },
    { skip: !previewId }
  );

  useEffect(() => {
    if (data) {
      dispatch(setSnapshots({
        snapshots: data.snapshots,
        total: data.total,
        page: data.page
      }));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (previewData) {
      dispatch(setPreviewSnapshot(previewData as SnapshotDetail));
      dispatch(setPreviewOpen(true));
      setPreviewId(null);
    }
  }, [previewData, dispatch]);

  const handlePreview = (id: string) => {
    setPreviewId(id);
  };

  const hasMore = snapshots.length < totalSnapshots;

  const renderContent = () => {
    if (isLoading) {
      return (
        <EmptyState>
          <CircularProgress size={32} />
        </EmptyState>
      );
    }

    if (snapshots.length === 0) {
      return (
        <EmptyState>
          <AutoAwesomeOutlinedIcon htmlColor="rgba(255,255,255,0.2)" />
          <Box>
            <Typography variant="body1" color="rgba(255,255,255,0.9)" fontWeight={500} gutterBottom>
              No History Yet
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.5)">
              Changes are auto-saved every 30 seconds.
            </Typography>
          </Box>
        </EmptyState>
      );
    }

    const filteredSnapshots = snapshots.filter((snap: SnapshotListItem) => {
      if (filterType === "all") return true;
      return snap.type === filterType;
    });

    if (filteredSnapshots.length === 0) {
      return (
        <EmptyState>
          <AutoAwesomeOutlinedIcon htmlColor="rgba(255,255,255,0.2)" />
          <Typography variant="body1" color="rgba(255,255,255,0.9)" fontWeight={500}>
            No {filterType} saves found
          </Typography>
        </EmptyState>
      );
    }

    return (
      <>
        {filteredSnapshots.map((snap: SnapshotListItem) => (
          <SnapshotRow
            key={snap.id}
            snapshot={snap}
            boardId={boardId}
            onPreview={handlePreview}
          />
        ))}
        {hasMore && (
          <LoadMoreBox>
            <Button
              variant="text"
              size="small"
              onClick={() => setPage((p) => p + 1)}
            >
              Load more
            </Button>
          </LoadMoreBox>
        )}
      </>
    );
  };

  return (
    <StyledDrawer 
      anchor="right" 
      open={open} 
      onClose={onClose}
    >
      <DrawerContent>
        <DrawerHeader>
          <Box display="flex" alignItems="center" gap={1.5}>
            <HistoryIcon htmlColor="#a5b4fc" />
            <Typography variant="h6" color="rgba(255,255,255,0.95)" fontSize={18} fontWeight={600}>
              Version History
            </Typography>
          </Box>
          <CloseButton size="small">
            <CloseIcon fontSize="small" htmlColor="rgba(255,255,255,0.8)" onClick={onClose} />
          </CloseButton>
        </DrawerHeader>
        <Divider />
        <FilterContainer>
          <StyledToggleButtonGroup
            value={filterType}
            exclusive
            onChange={(_, newFilter) => {
              if (newFilter) setFilterType(newFilter);
            }}
            fullWidth
            size="small"
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="auto">Auto</ToggleButton>
            <ToggleButton value="manual">Manual</ToggleButton>
          </StyledToggleButtonGroup>
        </FilterContainer>
        <SnapshotList>
          {renderContent()}
        </SnapshotList>
      </DrawerContent>
    </StyledDrawer>
  );
};
