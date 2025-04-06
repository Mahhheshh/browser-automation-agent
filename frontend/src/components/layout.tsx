import { useState } from "react";
import {
  Menu,
  X
} from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen bg-background">
      <div className="md:w-1/4 w-full flex flex-col">
        <header className="h-14 border-b px-4 flex items-center justify-between">
          <h1 className="text-sm font-semibold">Conversactions</h1>
          <div className="flex items-center gap-2">
            <Menu className="md:hidden" onClick={() => setIsOpen(true)} />
          </div>
        </header>
        {children}
      </div>

      <div className={`w-3/4 border-l transition-transform duration-300 transform ${isOpen ? 'translate-x-0 w-full' : 'translate-x-full'} md:translate-x-0 fixed top-0 right-0 h-full bg-background z-50 shadow-lg md:static md:shadow-none md:block`}>
        <div className="h-14 border-b px-4 flex justify-between items-center">
          <h2 className="font-medium">Action Window</h2>
          <X className={`cursor-pointer ${isOpen ? 'block' : 'hidden'}`} onClick={() => setIsOpen(false)} />
        </div>
        <div className="p-4">
        </div>
      </div>
    </div>
  );
}
