import React, { useState } from "react";
import {
  ProSidebar,
  Menu,
  MenuItem,
  SidebarFooter,
  SidebarContent,
  SidebarHeader,
} from "react-pro-sidebar";
import { Link } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { useAuth0 } from "@auth0/auth0-react";
import Button from "@mui/material/Button";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import HomeIcon from "@mui/icons-material/Home";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SourceIcon from "@mui/icons-material/Source";

export const Sidebar: React.FC = () => {
  const { logout } = useAuth0();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <ProSidebar
      style={{
        boxShadow: "0 8px 16px 0 rgba(0, 0, 0, 0.25)",
      }}
      collapsed={collapsed}
    >
      <SidebarHeader
        style={{
          display: "flex",
          justifyContent: collapsed ? "flex-end" : "space-between",
          alignItems: "center",
        }}
      >
        <Header
          collapsed={collapsed}
          onClick={() => {
            setCollapsed(!collapsed);
          }}
        />
      </SidebarHeader>
      <SidebarContent>
        <Menu iconShape="square">
          <MenuItem icon={<HomeIcon />}>
            <Link to={"/"}>Home</Link>
          </MenuItem>
          <MenuItem icon={<AccountBalanceIcon />}>
            <Link to={"expenses"}>Expenses</Link>
          </MenuItem>
          <MenuItem icon={<SourceIcon />}>
            <Link to={"sources"}>Source</Link>
          </MenuItem>
        </Menu>
      </SidebarContent>
      <Logout collapsed={collapsed} onClick={logout} />
      <SidebarFooter style={{ textAlign: "center" }}></SidebarFooter>
    </ProSidebar>
  );
};

const Logout: React.FC<{ collapsed: boolean; onClick(): void }> = ({
  collapsed,
  onClick,
}) => {
  if (collapsed) {
    return <LogoutIcon onClick={() => onClick()} />;
  }
  return (
    <Button
      onClick={() => onClick()}
      variant="contained"
      endIcon={<LogoutIcon />}
      style={{ marginTop: "10px", marginBottom: "10px" }}
    >
      Log Out
    </Button>
  );
};

const Header: React.FC<{ collapsed: boolean; onClick(): void }> = ({
  collapsed,
  onClick,
}) => {
  if (collapsed) {
    return (
      <ArrowRightIcon
        style={{ width: "50px", height: "50px" }}
        fontSize="large"
        onClick={() => onClick()}
      />
    );
  }

  return (
    <>
      <div
        style={{
          padding: "24px",
          textTransform: "uppercase",
          fontWeight: "bold",
          fontSize: 14,
          letterSpacing: "1px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        Bizbuzim
      </div>
      <ArrowLeftIcon
        style={{ width: "50px", height: "50px" }}
        onClick={() => onClick()}
      />
    </>
  );
};
