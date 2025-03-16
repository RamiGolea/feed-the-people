import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useFindMany, useFindOne, useAction, useUser } from "@gadgetinc/react";
import { flushSync } from "react-dom";
import { useSearchParams } from "react-router";
import { api } from "../api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, X, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

export default function DirectMessages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(userIdParam);
  const [messageInput, setMessageInput] = useState("");
  const currentUser = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // State to track newly arrived messages for highlighting
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  
  // Counter to force UI updates when new messages arrive
  const [messageChangeCounter, setMessageChangeCounter] = useState(0);
  
  // State for the pop-up notification
  const [currentNotification, setCurrentNotification] = useState<{
    id: string;
    sender: string;
    message: string;
    userId: string;
  } | null>(null);
  
  // Ref to store seen message IDs to avoid showing duplicate notifications
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  // Ref to store unread message counts by user
  const unreadCountsRef = useRef<Record<string, number>>({});
  // State to track user activity for adaptive polling
  const [isUserActive, setIsUserActive] = useState(true);
  // State to simulate typing indicators
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  // Timer for resetting typing indicator
  const typingTimerRef = useRef<Record<string, NodeJS.Timeout>>({});
  // Last activity timestamp
  const lastActivityRef = useRef<number>(Date.now());
  
  // Debug logging flag
  const debugMode = true;
  
  // Function to force UI updates when new messages arrive
  const forceUIUpdate = useCallback(() => {
    if (debugMode) console.log("🔄 forceUIUpdate called - Forcing UI refresh");
    
    // Update state to trigger a re-render
    flushSync(() => {
      setMessageChangeCounter(prev => {
        if (debugMode) console.log(`🔢 Incrementing messageChangeCounter: ${prev} → ${prev + 1}`);
        return prev + 1;
      });
    });
    
    // Direct DOM manipulation for immediate visual feedback
    const messagesContainer = document.querySelector('.messages-scroll-area');
    if (messagesContainer) {
      if (debugMode) console.log("📌 Found messages container, applying visual update indicator");
      // Add a quick flash effect to the scroll area to indicate new content
      messagesContainer.classList.add('new-message-flash');
      setTimeout(() => {
        messagesContainer.classList.remove('new-message-flash');
      }, 300);
    }
    
    // Force scroll to bottom with direct DOM manipulation
    if (messagesEndRef.current) {
      if (debugMode) console.log("⬇️ Forcing scroll to latest message");
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Track user activity for adaptive polling
  useEffect(() => {
    // Check if user is active every 30 seconds
    const activityInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > 60000) { // 1 minute without activity
        setIsUserActive(false);
      }
    }, 30000);
    
    // Activity event listeners
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setIsUserActive(true);
    };
    
    // Add event listeners for user activity
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('focus', handleActivity);
    
    // Set initial activity
    handleActivity();
    
    return () => {
      clearInterval(activityInterval);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('focus', handleActivity);
    };
  }, []);
  
  // Fetch all messages for the current user to determine conversation partners
  const [{ data: allUserMessages, fetching: loadingAllMessages, error: allMessagesError }] = useFindMany(api.message, {
    filter: {
      OR: [
        { userId: { equals: currentUser?.id } },
        { recipient: { equals: currentUser?.id } }
      ]
    },
    select: {
      id: true,
      userId: true,
      recipient: true,
      content: true,
      createdAt: true,
      user: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        googleImageUrl: true,
      }
    },
    live: true, // Enable real-time updates for new conversations
    pollInterval: isUserActive ? 2000 : 10000, // Poll more frequently when user is active
  });
  
  // Dedicated live query for monitoring new incoming messages across all conversations
  const [{ data: incomingMessages }] = useFindMany(api.message, {
    filter: {
      AND: [
        { recipient: { equals: currentUser?.id } }, // Only messages sent to current user
        { userId: { notEquals: currentUser?.id } }, // Not messages sent by current user
      ]
    },
    sort: { createdAt: "Descending" }, // Most recent first
    select: {
      id: true,
      content: true,
      createdAt: true,
      userId: true,
      user: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        googleImageUrl: true,
      }
    },
    live: true, // Enable real-time updates
    pollInterval: isUserActive ? 1500 : 5000, // Even faster polling for direct messages when active
  });
  
  // Extract unique user IDs from messages and track unread messages
  const conversationUserIds = useMemo(() => {
    if (!allUserMessages || !currentUser) return [];
    
    // Get unique user IDs from both sent and received messages
    const uniqueUserIds = new Set<string>();
    const tempUnreadCounts: Record<string, number> = {};
    
    allUserMessages.forEach(message => {
      // Add the other user's ID to our set (either sender or recipient)
      if (message.userId === currentUser.id) {
        // This is a message the current user sent to someone else
        uniqueUserIds.add(message.recipient);
      } else if (message.recipient === currentUser.id) {
        // This is a message someone sent to the current user
        uniqueUserIds.add(message.userId);
        
        // Check if this is a new message we haven't seen yet
        if (!seenMessageIdsRef.current.has(message.id)) {
          // Count as unread if not from the currently selected conversation
          if (message.userId !== selectedUserId) {
            tempUnreadCounts[message.userId] = (tempUnreadCounts[message.userId] || 0) + 1;
          } else {
            // If from the selected conversation, mark as seen
            seenMessageIdsRef.current.add(message.id);
          }
        }
      }
    });
    
    // Update unread counts ref
    unreadCountsRef.current = tempUnreadCounts;
    
    return Array.from(uniqueUserIds);
  }, [allUserMessages, currentUser, selectedUserId]);
  
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);
  
  // Simulate typing indicators based on user activity
  const simulateTypingIndicator = useCallback((userId: string) => {
    // Only show typing indicator if we're currently viewing that user's conversation
    if (selectedUserId === userId) {
      setTypingUsers(prev => ({ ...prev, [userId]: true }));
      
      // Clear any existing timeout for this user
      if (typingTimerRef.current[userId]) {
        clearTimeout(typingTimerRef.current[userId]);
      }
      
      // Set timeout to remove typing indicator after random interval (2-4 seconds)
      const randomDuration = Math.floor(Math.random() * 2000) + 2000;
      typingTimerRef.current[userId] = setTimeout(() => {
        setTypingUsers(prev => ({ ...prev, [userId]: false }));
      }, randomDuration);
    }
  }, [selectedUserId]);
  
  // Dedicated effect for handling new messages and auto-scrolling
  useEffect(() => {
    // Check if there are messages with IDs in the newMessageIds set
    if (newMessageIds.size > 0 && selectedUserId) {
      if (debugMode) console.log(`🔍 Detected ${newMessageIds.size} new messages in highlight set`);
      
      // Force an immediate UI update
      forceUIUpdate();
      
      // Schedule a scroll after a brief delay to ensure the DOM has updated
      const scrollTimeout = setTimeout(() => {
        scrollToBottom();
      }, 50);
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [newMessageIds, selectedUserId, scrollToBottom, forceUIUpdate]);
  
  // Effect to debug when the messageChangeCounter updates
  useEffect(() => {
    if (debugMode) console.log(`🔄 Component re-rendered due to messageChangeCounter: ${messageChangeCounter}`);
  }, [messageChangeCounter]);

  // Process new incoming messages for notifications
  useEffect(() => {
    if (!incomingMessages || !currentUser) return;
    
    if (debugMode) console.log(`📩 Processing ${incomingMessages.length} incoming messages`);
    
    let newUnreadCounts: Record<string, number> = {...unreadCountsRef.current};
    let hasNewMessages = false;
    
    // Check for new messages that haven't been seen yet
    incomingMessages.forEach(message => {
      // Only process messages to the current user that we haven't seen yet
      if (
        message.recipient === currentUser.id && 
        message.userId !== currentUser.id && 
        !seenMessageIdsRef.current.has(message.id)
      ) {
        if (debugMode) console.log(`🆕 New message detected: ${message.id}`);
        hasNewMessages = true;
        
        // If not viewing the conversation with this sender, show a notification
        if (message.userId !== selectedUserId) {
          // Show toast notification
          toast.message(`New message from ${message.user?.firstName || 'User'}`, {
            description: message.content,
            action: {
              label: "View",
              onClick: () => {
                // Navigate to that conversation
                setSelectedUserId(message.userId);
                setSearchParams({ userId: message.userId });
              },
            },
          });
          
          // Also trigger the pop-up notification
          setCurrentNotification({
            id: message.id,
            sender: message.user?.firstName || 'User',
            message: message.content,
            userId: message.userId
          });
          
          // Auto-dismiss the notification after 5 seconds
          setTimeout(() => {
            setCurrentNotification(current => 
              current?.id === message.id ? null : current
            );
          }, 5000);
          
          // Update unread count for this sender
          newUnreadCounts[message.userId] = (newUnreadCounts[message.userId] || 0) + 1;
          
          // Simulate the other user typing occasionally (40% chance)
          if (Math.random() > 0.6) {
            setTimeout(() => {
              simulateTypingIndicator(message.userId);
            }, 5000 + Math.random() * 10000); // Random delay 5-15 seconds
          }
        } else {
          // If we're already viewing this conversation, mark as seen
          seenMessageIdsRef.current.add(message.id);
          
          // Add to new message IDs for highlight effect
          flushSync(() => {
            setNewMessageIds(prev => {
              const updated = new Set(prev);
              updated.add(message.id);
              if (debugMode) console.log(`✨ Adding message ${message.id} to highlighted messages`);
              return updated;
            });
          });
          
          // Force UI update to immediately reflect the new message
          forceUIUpdate();
          
          // Set timeout to remove highlight after 4 seconds (extended from 3)
          setTimeout(() => {
            setNewMessageIds(prev => {
              const updated = new Set(prev);
              updated.delete(message.id);
              return updated;
            });
          }, 4000);
        }
      }
    });
    
    // Update the unread counts ref
    if (hasNewMessages) {
      unreadCountsRef.current = newUnreadCounts;
      if (debugMode) console.log(`📊 Updated unread message counts`, unreadCountsRef.current);
      
      // Force an additional UI update to ensure everything is in sync
      setTimeout(forceUIUpdate, 100);
    }
    
  }, [incomingMessages, currentUser, selectedUserId, setSearchParams, scrollToBottom, simulateTypingIndicator, forceUIUpdate]);

  // Handler to dismiss the notification manually
  const dismissNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);
  
  // Clear notification when changing to the sender's conversation
  useEffect(() => {
    if (currentNotification && selectedUserId === currentNotification.userId) {
      setCurrentNotification(null);
    }
  }, [selectedUserId, currentNotification]);

  // Fetch all users who have conversations with the current user
  const [{ data: users, fetching: loadingUsers, error: usersError }] = useFindMany(api.user, {
    filter: {
      id: { in: conversationUserIds }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      googleImageUrl: true,
    },
  });
  


  // Fetch selected user details directly if we have a userId in URL params
  const [{ data: selectedUserData, fetching: loadingSelectedUser, error: selectedUserError }] = useFindOne(
    api.user,
    selectedUserId || "",
    {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        googleImageUrl: true,
      },
      pause: !selectedUserId, // Only run the query if we have a selectedUserId
    }
  );

  // Fetch messages for selected user (both sent and received)
  const [{ data: messages, fetching: loadingMessages, error: messagesError }, refreshMessages] = useFindMany(
    api.message,
    {
      filter: {
        OR: [
          // Messages I've sent to selected user
          { 
            AND: [
              { userId: { equals: currentUser?.id } },
              { recipient: { equals: selectedUserId } }
            ]
          },
          // Messages sent to me by selected user
          { 
            AND: [
              { userId: { equals: selectedUserId } },
              { recipient: { equals: currentUser?.id } }
            ]
          }
        ]
      },
      sort: { createdAt: "Ascending" },
      live: true, // Enable real-time updates
      pollInterval: isUserActive ? 1000 : 5000, // Poll every second when active for selected conversation
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        recipient: true,
      },
      pause: !selectedUserId, // Only run when we have a selected user
    }
  );

  // Mark messages as seen when they appear in the conversation view
  useEffect(() => {
    if (messages && messages.length > 0 && currentUser) {
      messages.forEach(message => {
        // Add message ID to seen messages set
        seenMessageIdsRef.current.add(message.id);
      });
    }
  }, [messages, currentUser]);

  // Send message action
  const [{ fetching: sendingMessage }, sendMessage] = useAction(api.message.create);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUserId || !currentUser) return;

    const result = await sendMessage({
      content: messageInput,
      recipient: selectedUserId,
      user: {
        _link: currentUser.id,
      },
    });

    setMessageInput("");
    refreshMessages();
    
    // Add the newly sent message to the new messages set for highlighting
    if (result?.data?.id) {
      if (debugMode) console.log(`✉️ Message sent successfully: ${result.data.id}`);
        
      flushSync(() => {
        setNewMessageIds(prev => {
          const updated = new Set(prev);
          updated.add(result.data.id);
          return updated;
        });
      });
        
      // Force UI update with the new message
      forceUIUpdate();
      
      // Set timeout to remove highlight after 3 seconds
      setTimeout(() => {
        setNewMessageIds(prev => {
          const updated = new Set(prev);
          updated.delete(result.data.id);
          return updated;
        });
      }, 3000);
    }
  };

  // Users with conversations are already filtered to only include those who've exchanged messages
  const otherUsers = users || [];
  
  // Check if the user from URL params has a conversation with current user
  const hasConversationWithSelectedUser = selectedUserId && conversationUserIds.includes(selectedUserId);

  // Get selected user details - prioritize the directly fetched user if coming from URL params
  const selectedUser = selectedUserId 
    ? (selectedUserData || users?.find(user => user.id === selectedUserId))
    : null;

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (selectedUserId) {
      // Mark all messages from this user as seen
      if (incomingMessages) {
        incomingMessages.forEach(message => {
          if (message.userId === selectedUserId) {
            seenMessageIdsRef.current.add(message.id);
          }
        });
      }
      
      // Reset unread count for this user
      if (unreadCountsRef.current[selectedUserId]) {
        unreadCountsRef.current[selectedUserId] = 0;
      }
    }
  }, [selectedUserId, incomingMessages]);
  
  // Auto-scroll to bottom when messages load
  useEffect(() => {
    // If we have a selectedUserId from URL, auto-scroll to messages
    if (selectedUserId && !loadingMessages && messages?.length) {
      if (debugMode) console.log(`📜 Messages loaded, scrolling to bottom (${messages.length} messages)`);
      
      // Use slight delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
        // Force a UI update after scrolling to ensure everything is rendered
        forceUIUpdate();
      }, 50);
    }
  }, [selectedUserId, loadingMessages, messages, scrollToBottom, forceUIUpdate, messageChangeCounter]);
  
  // Reset new message IDs when changing conversations
  useEffect(() => {
    setNewMessageIds(new Set());
  }, [selectedUserId]);
  
  // Add CSS animations via useEffect only on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if styles already exist to avoid duplicates
      if (!document.getElementById('message-notification-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'message-notification-styles';
        styleElement.textContent = `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes newMessageFlash {
            0% { background-color: rgba(var(--primary-rgb), 0.05); }
            50% { background-color: rgba(var(--primary-rgb), 0.1); }
            100% { background-color: transparent; }
          }
          
          .new-message-flash {
            animation: newMessageFlash 0.3s ease-out;
          }
          
          @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(10px); }
          }
          
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0px rgba(var(--primary-rgb), 0.4); }
            50% { box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.2); }
            100% { box-shadow: 0 0 0 0px rgba(var(--primary-rgb), 0.1); }
          }
          
          @keyframes slideIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          @keyframes typingDot {
            0% { opacity: 0.3; transform: translateY(0px); }
            50% { opacity: 1; transform: translateY(-2px); }
            100% { opacity: 0.3; transform: translateY(0px); }
          }
          
          .animate-fade-in {
            animation: fadeIn 0.3s ease forwards;
          }
          
          .animate-fade-out {
            animation: fadeOut 0.3s ease forwards;
          }
          
          .animate-slide-in {
            animation: slideIn 0.4s ease forwards;
          }
          
          .animate-pulse-shadow {
            animation: pulse 2s infinite;
          }
          
          .typing-dot:nth-child(1) { animation: typingDot 1s infinite 0.1s; }
          .typing-dot:nth-child(2) { animation: typingDot 1s infinite 0.2s; }
          .typing-dot:nth-child(3) { animation: typingDot 1s infinite 0.3s; }
          
          .new-message {
            animation: slideIn 0.4s ease forwards, pulse 2s 0.4s;
          }
        `;
        document.head.appendChild(styleElement);
      }
    }
  }, []);

  return (
    <div className="container mx-auto py-6 relative">
      <h1 className="text-2xl font-bold mb-6">Direct Messages</h1>
      
      {/* Pop-up notification for new messages */}
      {currentNotification && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className="bg-card border shadow-lg rounded-lg p-4 max-w-[300px] relative">
            <button 
              onClick={dismissNotification}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary rounded-full p-2 text-primary-foreground">
                <MessageSquare size={16} />
              </div>
              <div>
                <p className="font-semibold text-sm">{currentNotification.sender}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {currentNotification.message}
                </p>
                <Button 
                  variant="link" 
                  className="text-xs p-0 h-auto mt-1"
                  onClick={() => {
                    setSelectedUserId(currentNotification.userId);
                    setSearchParams({ userId: currentNotification.userId });
                    dismissNotification();
                  }}
                >
                  View conversation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Users List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {loadingUsers || loadingAllMessages ? (
                  <div className="flex justify-center p-4">Loading conversations...</div>
                ) : usersError || allMessagesError ? (
                  <div className="text-red-500 p-4">
                    Error loading conversations: {(usersError || allMessagesError)?.toString()}
                  </div>
                ) : otherUsers.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2 py-8">
                      <MessageSquare className="h-12 w-12 opacity-20" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start a conversation with another user</p>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {otherUsers.map((user) => {
                      const unreadCount = unreadCountsRef.current[user.id] || 0;
                      return (
                        <li key={user.id}>
                          <Button
                            variant={selectedUserId === user.id ? "default" : "ghost"}
                            className="w-full justify-start relative"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setSearchParams({ userId: user.id });
                            }}
                          >
                            <div className="flex items-center flex-grow">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={user.googleImageUrl || undefined} />
                                <AvatarFallback>
                                  {user.firstName?.[0] || user.email?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="flex-grow">
                                {user.firstName} {user.lastName}
                              </span>
                              
                              {/* Unread message badge */}
                              {unreadCount > 0 && (
                                <Badge className="ml-2 bg-primary text-primary-foreground animate-pulse">
                                  {unreadCount}
                                </Badge>
                              )}
                            </div>
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Messages Area */}
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              {loadingSelectedUser && selectedUserId ? (
                <CardTitle>
                  <div className="flex items-center">
                    <div className="h-8 w-8 mr-2 rounded-full bg-muted animate-pulse"></div>
                    <div className="h-5 w-32 bg-muted animate-pulse rounded"></div>
                  </div>
                </CardTitle>
              ) : selectedUser ? (
                <CardTitle>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={selectedUser.googleImageUrl || undefined} />
                      <AvatarFallback>
                        {selectedUser.firstName?.[0] || selectedUser.email?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span>
                        {selectedUser.firstName} {selectedUser.lastName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {selectedUser.email}
                      </span>
                    </div>
                  </div>
                </CardTitle>
              ) : selectedUserError && selectedUserId ? (
                <CardTitle className="text-red-500">User not found</CardTitle>
              ) : (
                <CardTitle>Select a user to start messaging</CardTitle>
              )}
            </CardHeader>

            {(selectedUserId && !hasConversationWithSelectedUser && !loadingAllMessages) ? (
              <CardContent className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
                <p>No messages with this user yet</p>
                <p className="text-sm mt-1">It seems you haven't exchanged any messages with this user.</p>
                <Button 
                  variant="secondary" 
                  className="mt-4" 
                  onClick={() => {
                    // Focus on the message input to start conversation
                    const messageInput = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement;
                    if (messageInput) {
                      messageInput.focus();
                    }
                  }}
                >
                  Start Conversation
                </Button>
              </CardContent>
            ) : (selectedUserId && (selectedUser || loadingSelectedUser)) ? (
              <>
                <CardContent className="flex-grow p-0">
                  <ScrollArea ref={scrollAreaRef} className="h-[400px] p-4 messages-scroll-area">
                    {loadingSelectedUser ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex justify-start">
                            <div className="max-w-[70%] px-4 py-2 rounded-lg bg-muted h-12 animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    ) : loadingMessages && messages?.length === 0 ? (
                      <div className="flex justify-center p-4">Loading messages...</div>
                    ) : messagesError ? (
                      <div className="text-red-500 p-4">Error loading messages: {messagesError.toString()}</div>
                    ) : messages?.length === 0 ? (
                      <div className="text-center p-4 text-gray-500">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages?.map((message) => {
                          const isCurrentUserMessage = message.userId === currentUser?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isCurrentUserMessage ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[70%] px-4 py-2 rounded-lg transition-all duration-500 ${
                                  isCurrentUserMessage
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                } ${
                                  newMessageIds.has(message.id)
                                    ? "new-message shadow-lg shadow-primary/30 animate-pulse-shadow"
                                    : ""
                                }`}
                              >
                                <p>{message.content}</p>
                                <p className="text-xs mt-1 opacity-70">
                                  {new Date(message.createdAt).toLocaleTimeString([], { 
                                    hour: "2-digit", 
                                    minute: "2-digit" 
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef}></div>
                      </div>
                    )}
                    
                    {/* Typing indicator */}
                    {selectedUserId && typingUsers[selectedUserId] && (
                      <div className="flex justify-start mb-4 mt-2 animate-slide-in">
                        <div className="bg-accent px-4 py-2 rounded-lg flex items-center space-x-1 max-w-[70%]">
                          <span className="typing-dot rounded-full h-2 w-2 bg-foreground/70"></span>
                          <span className="typing-dot rounded-full h-2 w-2 bg-foreground/70"></span>
                          <span className="typing-dot rounded-full h-2 w-2 bg-foreground/70"></span>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                <CardFooter className="border-t p-3">
                  <form
                    className="flex w-full gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    onChange={() => {
                      // When user is typing, consider them active
                      lastActivityRef.current = Date.now();
                      setIsUserActive(true);
                    }}
                  >
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-grow"
                      disabled={sendingMessage}
                    />
                    <Button type="submit" disabled={sendingMessage || !messageInput.trim()}>
                      {sendingMessage ? "Sending..." : "Send"}
                    </Button>
                  </form>
                </CardFooter>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
                <p>Select a conversation</p>
                {otherUsers.length === 0 ? (
                  <>
                    <p className="text-sm mt-1">You haven't started any conversations yet</p>
                  </>
                ) : (
                  <p className="text-sm mt-1">Select a user from the contacts list to view your conversation</p>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </div>

    </div>
  );
}


