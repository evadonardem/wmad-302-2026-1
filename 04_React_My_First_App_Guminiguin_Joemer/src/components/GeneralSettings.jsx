import { Settings } from "@mui/icons-material";
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from "@mui/material";

export default function GeneralSettings({ actions }) {
  return (
    <SpeedDial
      ariaLabel="General Settings SpeedDial"
      sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
      icon={<SpeedDialIcon icon={<Settings />} />}
    >
      {actions && actions.map((action, index) => (
        <SpeedDialAction
          key={index}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={() => {
            if (action.onClick) action.onClick();
          }}
        />
      ))}
    </SpeedDial>
  );
}