import { styled } from '@mui/material/styles';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/index';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    borderRight: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
  },
}));

const NavigationList = styled(List)({
  paddingTop: '16px',
  paddingLeft: '8px',
  paddingRight: '8px'
});

const NavigationListItem = styled(ListItem)({
  marginBottom: '4px'
});

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: '8px',
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
  },
}));

const StyledListItemIcon = styled(ListItemIcon)<{ selected?: boolean }>(({ theme, selected }) => ({
  minWidth: 40,
  color: selected ? 'inherit' : theme.palette.text.secondary
}));

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Recent Boards', icon: <HistoryIcon />, path: '/history' },
  ];

  if (user?.role === 'Admin') {
    menuItems.push({ text: 'Manage Users', icon: <ManageAccountsIcon />, path: '/admin/users' });
  }

  return (
    <StyledDrawer variant="permanent" anchor="left">
      <Toolbar /> 
      <NavigationList>
        {menuItems.map((item) => (
          <NavigationListItem key={item.text} disablePadding>
            <StyledListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <StyledListItemIcon selected={location.pathname === item.path}>
                {item.icon}
              </StyledListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontSize: '0.9rem',
                  fontWeight: location.pathname === item.path ? 600 : 500 
                }} 
              />
            </StyledListItemButton>
          </NavigationListItem>
        ))}
      </NavigationList>
    </StyledDrawer>
  );
};
