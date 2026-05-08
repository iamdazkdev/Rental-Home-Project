import { Outlet } from "react-router-dom";
import { SocketProvider } from "../../context/SocketContext";
import GlobalNotification from "../common/GlobalNotification";

const RootLayout = () => {
    return (
        <>
            <GlobalNotification />
            <SocketProvider>
                <Outlet />
            </SocketProvider>
        </>
    );
};

export default RootLayout;
