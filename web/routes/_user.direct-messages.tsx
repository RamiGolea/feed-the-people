import { useState, useEffect } from "react";
import { useFindMany, useFindOne, useAction, useUser } from "@gadgetinc/react";
import { useSearchParams } from "react-router";
import { api } from "../api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DirectMessages() {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(userIdParam);
  const [messageInput, setMessageInput] = useState("");
  const currentUser = useUser();

  // Fetch all users
  const [{ data: users, fetching: loadingUsers, error: usersError }] = useFindMany(api.user, {
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
    refreshMessages();
  };

  // Filter out the current user from the users list
  const otherUsers = users?.filter(user => user.id !== currentUser?.id) || [];

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
                {loadingUsers ? (
                  <div className="flex justify-center p-4">Loading users...</div>
                ) : usersError ? (
                  <div className="text-red-500 p-4">Error loading users: {usersError.toString()}</div>
                ) : otherUsers.length === 0 ? (
                  <div className="text-center p-4">No users found</div>
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
                    <span>
                      {selectedUser.firstName} {selectedUser.lastName}
                    </span>
                  </div>
                </CardTitle>
              ) : selectedUserError && selectedUserId ? (
                <CardTitle className="text-red-500">User not found</CardTitle>
              ) : (
                <CardTitle>Select a user to start messaging</CardTitle>
              )}
            </CardHeader>

            {(selectedUserId && (selectedUser || loadingSelectedUser)) ? (
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
              <CardContent className="flex items-center justify-center h-[500px] text-gray-500">
                Select a user from the contacts list to start messaging
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}