import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useFindMany, useFindOne, useAction, useUser } from "@gadgetinc/react";
import { useSearchParams } from "react-router";
import { api } from "../api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { isEmptyArrayFilterError } from "../utils/errorHelpers";

export default function DirectMessages() {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(userIdParam);
  const [messageInput, setMessageInput] = useState("");
  const [lastConversationUpdate, setLastConversationUpdate] = useState<Date>(new Date());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = useUser();

  // Fetch all messages for the current user to determine conversation partners
  const [{ data: allUserMessages, fetching: loadingAllMessages, error: allMessagesError }, refreshAllMessages] = 
  useFindMany(api.message, {
    // Only apply filter if we have a currentUser, otherwise pause the query
    filter: currentUser ? {
      // Use a single filter condition that will work safely
      OR: [
        { userId: { equals: currentUser.id } },
        { recipient: { equals: currentUser.id } }
      ]
    } : {},
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
    sort: { createdAt: "Descending" },
    first: 100, // Limit to latest 100 messages to improve performance
    live: true, // Enable real-time updates for new conversations
    // Pause the query if we don't have a currentUser yet
    pause: !currentUser,
  });
  
  // Extract unique user IDs from messages (conversation partners)
  const conversationUserIds = useMemo(() => {
    if (!allUserMessages || !currentUser) return [];
    
    // Get unique user IDs from both sent and received messages
    const uniqueUserIds = new Set<string>();
    
    allUserMessages.forEach(message => {
      // Add the other user's ID to our set (either sender or recipient)
      if (message.userId === currentUser.id) {
        // This is a message the current user sent to someone else
        uniqueUserIds.add(message.recipient);
      } else if (message.recipient === currentUser.id) {
        // This is a message someone sent to the current user
        uniqueUserIds.add(message.userId);
      }
    });
    
    return Array.from(uniqueUserIds);
  }, [allUserMessages, currentUser]);

  // Fetch all users who have conversations with the current user
  const [{ data: users, fetching: loadingUsers, error: usersError }, refreshUsers] = useFindMany(api.user, {
    filter: conversationUserIds.length > 0 
      ? { id: { in: conversationUserIds } }
      : {}, // Empty filter when there are no conversation partners yet
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      googleImageUrl: true,
    },
    pause: conversationUserIds.length === 0, // Pause the query if there are no conversation partners
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
      /*
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
      },*/
      sort: { createdAt: "Ascending" },
      live: true, // Enable real-time updates
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
    }
  );

  // Send message action
  const [{ fetching: sendingMessage }, sendMessage] = useAction(api.message.create);

  // Function to refresh the list of conversations
  const refreshUserConversations = useCallback(async () => {
    // This will trigger a refetch of all user messages, which in turn updates the conversation partners
    await Promise.all([
      // Using the refetch functions returned by useFindMany hooks
      refreshAllMessages(),
      refreshUsers()
    ]);
    
    // Update the last conversation update timestamp to trigger UI updates
    setLastConversationUpdate(new Date());
  }, [refreshAllMessages, refreshUsers]);
  
  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Monitor messages for changes and update conversation list accordingly
  useEffect(() => {
    if (allUserMessages && allUserMessages.length > 0) {
      // Check if there are any new messages since our last update
      const latestMessageDate = new Date(allUserMessages[0].createdAt);
      
      if (latestMessageDate > lastConversationUpdate) {
        // We have new messages, update the conversation list and the timestamp
        refreshUserConversations();
      }
    }
  }, [allUserMessages, lastConversationUpdate, refreshUserConversations]);
  
  // Effect to scroll to messages when they load or new messages arrive
  useEffect(() => {
    // If we have a selectedUserId and messages, scroll to bottom
    if (selectedUserId && !loadingMessages && messages?.length) {
      scrollToBottom();
    }
  }, [selectedUserId, loadingMessages, messages, scrollToBottom]);
  
  // Effect to handle real-time updates for the current conversation
  useEffect(() => {
    // When new messages arrive in the current conversation, refresh the messages list
    if (messages && messages.length > 0 && selectedUserId) {
      const lastMessage = messages[messages.length - 1];
      
      // Update unread notifications if needed
      // This keeps the UI in sync when receiving messages
      if (lastMessage.userId !== currentUser?.id) {
        scrollToBottom();
      }
    }
  }, [messages, selectedUserId, currentUser, scrollToBottom]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUserId || !currentUser) return;

    await sendMessage({
      content: messageInput,
      recipient: selectedUserId,
      user: {
        _link: currentUser.id,
      },
    });

    setMessageInput("");
    setLastConversationUpdate(new Date());
    await refreshMessages();
    setTimeout(scrollToBottom, 100); // Give the UI a moment to update before scrolling
  };

  // Users with conversations are already filtered to only include those who've exchanged messages
  const otherUsers = users || [];
  
  // Check if the user from URL params has a conversation with current user
  const hasConversationWithSelectedUser = selectedUserId && conversationUserIds.includes(selectedUserId);

  // Get selected user details - prioritize the directly fetched user if coming from URL params
  const selectedUser = selectedUserId 
    ? (selectedUserData || users?.find(user => user.id === selectedUserId))
    : null;

  // Effect to scroll to messages when they load
  useEffect(() => {
    // If we have a selectedUserId from URL, auto-scroll to messages
    if (selectedUserId && !loadingMessages && messages?.length) {
      const messagesContainer = document.querySelector('.messages-scroll-area');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }, [selectedUserId, loadingMessages, messages]);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Direct Messages</h1>
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
                ) : (usersError && !isEmptyArrayFilterError(usersError)) || (allMessagesError && !currentUser) ? (
                  <div className="text-red-500 p-4">
                    Error loading conversations: {((usersError && !isEmptyArrayFilterError(usersError)) || (allMessagesError && !currentUser))?.toString()}
                  </div>
                ) : otherUsers.length === 0 || conversationUserIds.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2 py-8">
                      <MessageSquare className="h-12 w-12 opacity-20" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start a conversation with another user</p>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {otherUsers.map((user) => (
                      <li key={user.id}>
                        <Button
                          variant={selectedUserId === user.id ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={user.googleImageUrl || undefined} />
                            <AvatarFallback>
                              {user.firstName?.[0] || user.email?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {user.firstName} {user.lastName}
                          </span>
                        </Button>
                      </li>
                    ))}
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
                  onClick={() => startConversation()}
                  disabled={sendingMessage}
                >
                  {sendingMessage ? "Starting..." : "Start Conversation"}
                </Button>
              </CardContent>
            ) : (selectedUserId && (selectedUser || loadingSelectedUser)) ? (
              <>
                <CardContent className="flex-grow p-0">
                  <ScrollArea className="h-[400px] p-4 messages-scroll-area">
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
                                className={`max-w-[70%] px-4 py-2 rounded-lg ${
                                  isCurrentUserMessage
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
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
                        <div ref={messagesEndRef} />
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