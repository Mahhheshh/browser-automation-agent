import React, { createContext, useState, useEffect, useContext } from 'react';

interface WSContextProps {
    ws: WebSocket | null;
    isConnected: boolean;
    sendMessage: (message: string) => void;
}

const WSContext = createContext<WSContextProps>({
    ws: null,
    isConnected: false,
    sendMessage: () => { },
});

interface WSProviderProps {
    children: React.ReactNode;
}

const WSProvider: React.FC<WSProviderProps> = ({ children }) => {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const connectWebSocket = () => {
            const newWs = new WebSocket('ws://localhost:8080');

            newWs.onopen = () => {
                console.log('Connected to WebSocket server');
                setIsConnected(true);
            };

            newWs.onclose = () => {
                console.log('Disconnected from WebSocket server');
                setIsConnected(false);
                setTimeout(connectWebSocket, 3000);
            };

            newWs.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };

            setWs(newWs);
        };

        if (!ws || !isConnected) {
            connectWebSocket();
        }

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, []);

    const sendMessage = (message: string) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        } else {
            console.log('WebSocket is not connected.');
        }
    };

    return (
        <WSContext.Provider value={{ ws, isConnected, sendMessage }}>
            {children}
        </WSContext.Provider>
    );
};

const useWS = () => useContext(WSContext);

// eslint-disable-next-line react-refresh/only-export-components
export { WSProvider, useWS };
