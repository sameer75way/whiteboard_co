let socketId: string | null = null;

export const setSocketId = (nextSocketId: string | null) => {
  socketId = nextSocketId;
};

export const getSocketId = () => socketId;
