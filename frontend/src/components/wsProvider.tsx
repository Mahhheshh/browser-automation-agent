import React, {
    createContext,
    useState,
    useEffect,
    useContext,
    useRef,
    useCallback,
    useMemo,
  } from 'react';
  
  export interface WSPayload {
      type: string;
      content?: string;
      name?: string;
      message?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
  }
  
  type MessageHandler = (payload: WSPayload) => void;
  
  interface WSContextProps {
      isConnected: boolean;
      sendMessage: (message: string) => void;
      subscribe: (handler: MessageHandler) => void;
      unsubscribe: (handler: MessageHandler) => void;
  }
  
  const WSContext = createContext<WSContextProps>({
      isConnected: false,
      sendMessage: () => {
          console.warn('WebSocket provider not initialized or connection not open.');
      },
      subscribe: () => {
          console.warn('WebSocket provider not initialized.');
      },
      unsubscribe: () => {
          console.warn('WebSocket provider not initialized.');
      },
  });
  
  interface WSProviderProps {
      children: React.ReactNode;
      url?: string;
      reconnectInterval?: number;
  }
  
  const WSProvider: React.FC<WSProviderProps> = ({
      children,
      url = 'ws://localhost:8080',
      reconnectInterval = 3000,
  }) => {
      const wsRef = useRef<WebSocket | null>(null);
      const [isConnected, setIsConnected] = useState(false);
      const isMountedRef = useRef(true);
      const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
      const messageHandlersRef = useRef<Set<MessageHandler>>(new Set());
  
      const subscribe = useCallback((handler: MessageHandler) => {
          messageHandlersRef.current.add(handler);
      }, []);
  
      const unsubscribe = useCallback((handler: MessageHandler) => {
          messageHandlersRef.current.delete(handler);
      }, []);
  
      const sendMessage = useCallback((message: string) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(message);
          } else {
              console.warn('WebSocket is not connected or ready.');
          }
      }, []);
  
      useEffect(() => {
          isMountedRef.current = true;
  
          const connectWebSocket = () => {
              if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
                  console.log('WebSocket already open or connecting.');
                  return;
              }
  
              if (wsRef.current) {
                   wsRef.current.onopen = null;
                   wsRef.current.onmessage = null;
                   wsRef.current.onclose = null;
                   wsRef.current.onerror = null;
                   wsRef.current.close();
              }
  
              console.log(`Attempting to connect to ${url}...`);
              const newWs = new WebSocket(url);
              wsRef.current = newWs;
  
              newWs.onopen = () => {
                  if (!isMountedRef.current) return;
                  console.log(`Connected to WebSocket server: ${url}`);
                  setIsConnected(true);
                  if (reconnectTimeoutRef.current) {
                      clearTimeout(reconnectTimeoutRef.current);
                      reconnectTimeoutRef.current = null;
                  }
              };
  
              newWs.onclose = (event) => {
                  if (!isMountedRef.current) return;
                  console.log(`Disconnected from WebSocket server: ${url}. Code: ${event.code}, Reason: ${event.reason}`);
                  setIsConnected(false);
                  wsRef.current = null;
  
                  if (event.code !== 1000) {
                     console.log(`Scheduling reconnect in ${reconnectInterval}ms...`);
                     reconnectTimeoutRef.current = setTimeout(connectWebSocket, reconnectInterval);
                  }
              };
  
              newWs.onerror = (error) => {
                  if (!isMountedRef.current) return;
                  console.error('WebSocket error:', error);
              };
  
              newWs.onmessage = (event: MessageEvent) => {
                  if (!isMountedRef.current) return;
                  try {
                      const payload: WSPayload = JSON.parse(event.data);
                      messageHandlersRef.current.forEach(handler => {
                          try {
                              handler(payload);
                          } catch (handlerError) {
                              console.error("Error in WebSocket message handler:", handlerError);
                          }
                      });
                  } catch (parseError) {
                      console.error("Failed to parse WebSocket message:", parseError, "Raw data:", event.data);
                  }
              };
          };
  
          connectWebSocket();
  
          return () => {
              console.log('Cleaning up WebSocket connection...');
              isMountedRef.current = false;
  
              if (reconnectTimeoutRef.current) {
                  clearTimeout(reconnectTimeoutRef.current);
                  reconnectTimeoutRef.current = null;
                  console.log('Cleared pending reconnect timeout.');
              }
  
              if (wsRef.current) {
                   wsRef.current.onopen = null;
                   wsRef.current.onmessage = null;
                   wsRef.current.onclose = null;
                   wsRef.current.onerror = null;
  
                   if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
                        console.log('Closing WebSocket connection (unmount).');
                        wsRef.current.close(1000, "Client component unmounted");
                   } else {
                        console.log(`WebSocket already in state ${wsRef.current.readyState}, no explicit close needed.`);
                   }
                   wsRef.current = null;
              }
              setIsConnected(false);
          };
      }, [url, reconnectInterval]);
  
      const contextValue = useMemo(() => ({
          isConnected,
          sendMessage,
          subscribe,
          unsubscribe,
      }), [isConnected, sendMessage, subscribe, unsubscribe]);
  
      return (
          <WSContext.Provider value={contextValue}>
              {children}
          </WSContext.Provider>
      );
  };
  
  const useWS = () => useContext(WSContext);
  
  // eslint-disable-next-line react-refresh/only-export-components
  export { WSProvider, useWS };
