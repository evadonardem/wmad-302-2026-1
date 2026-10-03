import { Settings } from "@mui/icons-material";
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from "@mui/material";

export default function GeneralSettings({ actions }) {
    // TODO 12 [Dynamic Actions Overlay]
    return (
        <SpeedDial
            ariaLabel="General settings"
            sx={{ position: 'absolute', bottom: 16, right: 16 }}
            icon={<SpeedDialIcon icon={<Settings />} />}
        >
            {actions.map((action) => (
                <SpeedDialAction
                    key={action.name}
                    icon={action.icon}
                    tooltipTitle={action.name}
                    onClick={action.onClick}
                />
            ))}
        </SpeedDial>
    );
}

