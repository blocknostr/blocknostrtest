
import * as React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import SidebarNav from "./SidebarNav";
import { useAuth } from "@/hooks/useAuth";

const Sidebar = () => {
  const isMobile = useIsMobile();
  const { isLoggedIn } = useAuth();
  
  return (
    <aside
      className={cn(
        "border-r h-full py-4 bg-background",
        isMobile ? "w-full" : "w-64 fixed left-0 top-0 hidden md:block"
      )}
    >
      <div className="flex flex-col h-full px-4">
        {/* Theme-aware, thick wordmark with subtle white glow */}
        <div className="mb-6 flex items-center justify-center">
          <Link
            to="/"
            className={cn(
              "text-3xl",                   // larger size
              "font-extrabold",             // heavy weight
              "tracking-tight",             // tight kerning
              "hover:opacity-80 transition-opacity",
              // subtle white glow
              "filter drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]",
              // text color: black in light, white in dark
              "text-black dark:text-white"
            )}
          >
            BlockNostr
          </Link>
        </div>
        
        <SidebarNav isLoggedIn={isLoggedIn} />
      </div>
    </aside>
  );
};

export default Sidebar;
