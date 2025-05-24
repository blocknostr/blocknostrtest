import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import WorldChatHeader, { WORLD_CHAT_CHANNELS, ChatChannel } from "./WorldChatHeader";
import ChatInput from "./ChatInput";
import { useWorldChat } from "./hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, AlertCircle, RefreshCw, LogIn, Wallet, Shield, Eye, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatNostrService } from "@/lib/nostr/chat-service";
import LoginDialog from "../auth/LoginDialog";
import { cn } from "@/lib/utils";
import MessageList from "./MessageList";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalLoginDialog } from "@/hooks/useGlobalLoginDialog";

// Maximum characters allowed per message
const MAX_CHARS = 140;

// Default chat tag
const DEFAULT_CHAT_TAG = "world-chat";

const WorldChat = () => {
  const [currentChatTag, setCurrentChatTag] = useState(DEFAULT_CHAT_TAG);
  // Add a state to track channel switches for UI feedback
  const [isChangingChannel, setIsChangingChannel] = useState(false);
  
  // Use the proper authentication hook instead of directly checking chatNostrService
  const { isLoggedIn } = useAuth();
  const { isOpen: loginDialogOpen, openLoginDialog, setLoginDialogOpen } = useGlobalLoginDialog();

  const {
    messages,
    profiles,
    emojiReactions,
    loading,
    sendMessage,
    addReaction,
    error,
    connectionStatus,
    reconnect,
    isReconnecting
  } = useWorldChat(currentChatTag);

  // Handle chat channel selection
  const handleChannelSelect = (channel: ChatChannel) => {
    if (channel.tag === currentChatTag) return;
    
    // Set changing channel state to show loading indicator
    setIsChangingChannel(true);
    setCurrentChatTag(channel.tag);
  };

  // Reset the changing channel state once messages are loaded
  useEffect(() => {
    if (!loading && isChangingChannel) {
      setIsChangingChannel(false);
    }
  }, [loading, isChangingChannel]);

  // Show read-only interface if not logged in
  if (!isLoggedIn) {
    return (
      <Card className="chat-card flex flex-col h-full shadow-md overflow-hidden rounded-lg relative bg-background/90 backdrop-blur-sm border-border/50">
        <WorldChatHeader 
          connectionStatus={connectionStatus} 
          currentChatTag={currentChatTag} 
          onChannelSelect={handleChannelSelect}
        />
        
        {/* Read-only indicator */}
        <Alert className="mx-2 mt-1 mb-2 py-2 rounded-md border-primary/20 bg-primary/5">
          <Eye className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Viewing chat in read-only mode. <a href="#" onClick={openLoginDialog} className="text-primary hover:underline">Sign in</a> to participate.
          </AlertDescription>
        </Alert>
        
        <div className="flex-grow overflow-y-auto relative">
          <MessageList
            messages={messages}
            profiles={profiles}
            emojiReactions={emojiReactions}
            loading={isChangingChannel}
            isLoggedIn={isLoggedIn}
            onAddReaction={addReaction}
          />
        </div>
        
        {/* Read-only chat input area */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Sign in to join the conversation</span>
          </div>
        </div>
        
        {/* Global Login Dialog is rendered at app level */}
      </Card>
    );
  }

  return (
    <Card className="chat-card flex flex-col h-full shadow-md overflow-hidden rounded-lg relative bg-background/90 backdrop-blur-sm border-accent/10"> 
      <WorldChatHeader 
        connectionStatus={connectionStatus}
        currentChatTag={currentChatTag}
        onChannelSelect={handleChannelSelect}
      />
      
      {error && (
        <Alert variant="destructive" className="mx-2 mt-1 mb-0 py-1.5 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      
      {connectionStatus === 'disconnected' && (
        <Alert variant="warning" className="mx-2 mt-1 mb-0 py-1.5 rounded-md">
          <div className="flex justify-between w-full items-center">
            <div className="flex items-center gap-2">
              <WifiOff className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">Not connected to chat relays</AlertDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs py-0 rounded-full" 
              onClick={reconnect}
              disabled={isReconnecting}
            >
              {isReconnecting ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                <>Reconnect</>
              )}
            </Button>
          </div>
        </Alert>
      )}
      
      {connectionStatus === 'connecting' && (
        <Alert variant="warning" className="w-auto mx-2 mt-1 mb-0 py-1 px-3 border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 rounded-md">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3 animate-spin text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-xs font-medium text-yellow-700 dark:text-yellow-300 whitespace-nowrap">
              Connecting to chat relays...
            </AlertDescription>
          </div>
        </Alert>
      )}
      
      <div className="flex-grow overflow-y-auto relative">
        <MessageList
          messages={messages}
          profiles={profiles}
          emojiReactions={emojiReactions}
          loading={isChangingChannel} // Only show loading when changing channels, not during initial load
          isLoggedIn={isLoggedIn}
          onAddReaction={addReaction}
        />
      </div>
      
      <ChatInput
        isLoggedIn={isLoggedIn}
        maxChars={MAX_CHARS}
        onSendMessage={sendMessage}
        disabled={connectionStatus === 'disconnected'}
      />
    </Card>
  );
};

export default WorldChat;
