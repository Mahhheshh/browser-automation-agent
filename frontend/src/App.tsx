import { Menu, X } from 'lucide-react'
import './App.css'
import { ChatWindow } from "./components/ChatWindow"
import { useState, useEffect, useCallback } from 'react'
import { useWS, WSPayload } from './components/wsProvider'

function App() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [base64Image, setBase64Image] = useState<string>("");
  const { subscribe, unsubscribe } = useWS();

  const handleScreenshotMessage = useCallback((payload: WSPayload) => {
    if (payload.type !== 'screenshot') return;
    if (typeof payload.content === 'string' && payload.content.startsWith('data:image/png')) {
      setBase64Image(payload.content);
    } else {
      console.warn("Received screenshot payload, but data is not a valid base64 image string:", payload.data);
    }
  }, [setBase64Image]);

  useEffect(() => {
    subscribe(handleScreenshotMessage);

    return () => {
      unsubscribe(handleScreenshotMessage);
    };
  }, [subscribe, unsubscribe, handleScreenshotMessage]);

  return (
    <div className="flex h-screen bg-background">
      <div className="md:w-2/3 w-full flex flex-col">
        <header className="h-14 border-b px-4 flex items-center justify-between">
          <h1 className="text-sm font-semibold">Chat Window</h1>
          <div className="flex items-center gap-2">
            <Menu className="md:hidden cursor-pointer" onClick={() => setIsOpen(true)} />
          </div>
        </header>
        <ChatWindow />
      </div>

      <div className={`
            fixed top-0 right-0 h-full w-full 
            bg-background border-l z-50 shadow-lg 
            transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            md:static md:w-2/3 md:translate-x-0 md:shadow-none md:z-auto
          `}>
        <div className="h-14 border-b px-4 flex justify-between items-center">
          <h2 className="font-medium">Browser Window</h2>
          <X className="cursor-pointer md:hidden" onClick={() => setIsOpen(false)} />
        </div>
        <div className="p-4 overflow-y-auto mx-auto flex items-center justify-center">
          {base64Image ? (
            <div className="border border-gray-300 rounded-md shadow-md w-full max-w-screen-md">
              <div className="aspect-w-[1080] aspect-h-[1024]">
                <img
                  src={base64Image}
                  alt="Screenshot"
                  className="object-contain rounded-md"
                />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No screenshot available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App