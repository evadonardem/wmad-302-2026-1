import { Settings } from "@mui/icons-material";
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from "@mui/material";

export default function GeneralSettings({ actions }) {
    // TODO 12 [Dynamic Actions Overlay]: Implement the component structure below:
    // a. Return a SpeedDial component anchored to the absolute position: bottom 16, right 16
    // b. Map through the 'actions' prop array to render a nested SpeedDialAction for each individual item
    // c. Configure each action's unique key, icon asset, tooltip title template properties, and custom onClick callback parameters
    return (
        
        <SpeedDial
      sx={{ position: 'absolute', bottom: 16, right: 16 }}
      icon={<SpeedDialIcon icon={<Settings />} />}
      ariaLabel="settings-speed-dial"
    >
      {actions.map((action, index) => (
        <SpeedDialAction
          key={index}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={action.onClick}
        />
      ))}
    </SpeedDial>
    
    );
}
