import API from "./api";
import socket from "./socket";

let hospitalConnectHandler = null;

export const getSocket = () => socket;

export const connectHospitalSocket = (hospitalId) => {
    if (hospitalConnectHandler) {
        socket.off("connect", hospitalConnectHandler);
    }

    hospitalConnectHandler = () => {
        if (hospitalId) {
            socket.emit("join_hospital", { hospitalId });
        }
    };

    socket.on("connect", hospitalConnectHandler);

    if (!socket.connected) {
        socket.connect();
    } else {
        hospitalConnectHandler();
    }

    return socket;
};

export const disconnectSocket = () => {
    if (hospitalConnectHandler) {
        socket.off("connect", hospitalConnectHandler);
        hospitalConnectHandler = null;
    }
    if (socket.connected) {
        socket.disconnect();
    }
};

export const precheckEmergency = async (data) => {
    const res = await API.post(
        "/api/emergency/precheck",
        data
    );

    return res.data;
};

export const createEmergency = async (data) => {
    const res = await API.post(
        "/api/emergency",
        data
    );

    return res.data;
};

export const getEmergencyDetails = async (id) => {
    const res = await API.get(
        `/api/emergency/${id}`
    );

    return res.data;
};

export const cancelEmergencyByUser = async (
    id
) => {
    const res = await API.put(
        `/api/emergency/${id}/user-cancel`
    );

    return res.data;
};

export const uploadEvidence = async (
    requestId,
    imageUrl
) => {
    const res = await API.post(
        `/api/emergency/${requestId}/evidence`,
        {
            imageUrl,
        }
    );

    return res.data;
};