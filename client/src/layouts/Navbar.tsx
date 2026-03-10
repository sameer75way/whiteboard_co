import { styled } from '@mui/material/styles';
import { AppBar, Toolbar, IconButton, Menu, MenuItem, Typography, Avatar, Box } from '@mui/material';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/auth/authSlice';
import { baseApi } from '../services/api/baseApi';
import type { RootState } from '../store/index';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  zIndex: theme.zIndex.drawer + 1,
}));

const BrandTypography = styled(Typography)({
  flexGrow: 1,
  fontWeight: 700,
  letterSpacing: '-0.5px'
});

const UserSectionBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
});

const StyledIconButton = styled(IconButton)({
  padding: 0
});

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  width: 36,
  height: 36,
  fontSize: '1rem'
}));

const StyledMenu = styled(Menu)({
  marginTop: '8px'
});

const LogoutMenuItem = styled(MenuItem)(({ theme }) => ({
  color: theme.palette.error.main
}));

export const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
  };

  return (
    <StyledAppBar position="fixed">
      <Toolbar>
        <BrandTypography variant="h6">
          Whiteboard Co.
        </BrandTypography>
        
        {user && (
          <UserSectionBox>
            <Typography variant="body2" color="text.secondary">
              {user.name}
            </Typography>
            <StyledIconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <StyledAvatar>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </StyledAvatar>
            </StyledIconButton>
            <StyledMenu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <LogoutMenuItem onClick={handleLogout}>Logout</LogoutMenuItem>
            </StyledMenu>
          </UserSectionBox>
        )}
      </Toolbar>
    </StyledAppBar>
  );
};
