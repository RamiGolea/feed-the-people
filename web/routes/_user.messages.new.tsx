import { useEffect, useState, useRef } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { useSearchParams, useNavigate } from "react-router";
import { useUser, useFindMany, useAction } from "@gadgetinc/react";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface MessageFormValues {
  content: string;
}

export default function NewMessage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get("postId");
  const recipientId = searchParams.get("userId");
  const currentUser = useUser(api);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [post, setPost] = useState<any>(null);
  const [recipient, setRecipient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Get conversation history with real-time updates
  const [{ data: messages, fetching: fetchingMessages, error: messagesError }] = useFindMany(api.message, {
    filter: {
      OR: [
        // Messages where current user is sender and recipient is the other user
        {
          AND: [
            { userId: { equals: currentUser?.id } },
            { recipient: { equals: recipientId } }
          ]
        },
        // Messages where current user is recipient and sender is the other user
        {
          AND: [
            { userId: { equals: recipientId } },
            { recipient: { equals: currentUser?.id } }
          ]
        }
      ]
    },
    sort: { createdAt: "Ascending" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      userId: true,
      user: {
        id: true,
        firstName: true,
        lastName: true,
      }
    },
    live: true // Enable real-time updates
  });
  
  // Create message action hook
  const [{ fetching: sendingMessage, error: sendError }, createMessage] = useAction(api.message.create);
  
  const form = useForm<MessageFormValues>({
    defaultValues: {
      content: "",
    },
    // Add minimum length validation for the message content
    resolver: (values) => {
      const errors: Record<string, { type: string; message: string }> = {};
      
      if (!values.content || values.content.trim().length < 10) {
        errors.content = {
          type: "minLength",
          message: "Message must be at least 10 characters long",
        };
      }
      
      return {
        values,
        errors,
      };
    },
  });
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      
      if (!recipientId) {
        setError("Missing recipient information. Please go back and try again.");
        setLoading(false);
        return;
      }
      
      try {
        // Load post data only if postId is provided
        if (postId) {
          const postData = await api.post.findOne(postId, {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              location: true,
            }
          });
          setPost(postData);
        }
        
        // Load recipient data
        const userData = await api.user.findOne(recipientId, {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        });
        setRecipient(userData);
      } catch (e) {
        console.error("Error loading data:", e);
        setError("Failed to load post or user information. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [postId, recipientId]);
  
  const onSubmit = async (data: MessageFormValues) => {
    if (!recipientId || !currentUser) {
      setError("Missing required information. Please go back and try again.");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Create the message payload
      const messagePayload: any = {
        content: data.content,
        recipient: recipientId,
        user: {
          _link: currentUser.id
        }
      };
      
      // Only add post if postId exists
      if (postId) {
        messagePayload.post = {
          _link: postId
        };
      }
      
      // Send the message using the action hook (which integrates with live queries)
      await createMessage(messagePayload);
      
      // Reset the form
      form.reset();
    } catch (e: any) {
      console.error("Error sending message:", e);
      setError("Failed to send message: " + (e.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const navigateToConversation = () => {
    navigate(`/messages`);
  };
  
  // Helper function to get initials for avatar
  const getInitials = (user: any) => {
    if (!user) return "?";
    return (
      (user.firstName?.slice(0, 1) ?? "") + 
      (user.lastName?.slice(0, 1) ?? "")
    ).toUpperCase();
  };
  
  // Helper to check if a message is from the current user
  const isOwnMessage = (message: any) => {
    return message.userId === currentUser?.id;
  };
  
  if (loading || fetchingMessages) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if ((error && !recipient) || messagesError) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertTitle>Error loading information</AlertTitle>
        <AlertDescription>{error || messagesError?.toString()}</AlertDescription>
        <div className="mt-4">
          <Button onClick={handleGoBack} variant="outline">Go Back</Button>
        </div>
      </Alert>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Button onClick={handleGoBack} variant="outline" className="mb-6">
        ← Back
      </Button>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Conversation with {recipient?.firstName}</CardTitle>
          <CardDescription>
            {post ? `About "${post?.title}"` : "Send and receive messages in real-time"}
          </CardDescription>
        </CardHeader>
        
        {post && (
          <div className="px-6 mb-4">
            <div className="p-3 bg-muted rounded-md">
              <h3 className="font-medium text-sm">Post details:</h3>
              <p className="text-sm mt-1"><strong>Title:</strong> {post?.title}</p>
              <p className="text-sm mt-1"><strong>Category:</strong> {post?.category}</p>
              <p className="text-sm mt-1"><strong>Location:</strong> {post?.location}</p>
            </div>
          </div>
        )}
        
        {/* Message history container */}
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {sendError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>Failed to send message: {sendError.toString()}</AlertDescription>
            </Alert>
          )}
          
          {/* Scrollable message container */}
          <ScrollArea className="h-[400px] pr-4 mb-4">
            {messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages?.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex ${isOwnMessage(message) ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[80%]`}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {isOwnMessage(message) 
                            ? getInitials(currentUser) 
                            : getInitials(message.user)
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div 
                          className={`p-3 rounded-lg ${
                            isOwnMessage(message) 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className={`text-xs mt-1 ${isOwnMessage(message) ? 'text-right' : ''} text-muted-foreground`}>
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} /> {/* Empty div for scrolling to bottom */}
              </div>
            )}
          </ScrollArea>
          
          {/* Message form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="relative">
              <FormField
                control={form.control}
                name="content"
                rules={{ required: "Please enter a message" }}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder="Type your message here... (Minimum 10 characters)"
                          className="pr-12 min-h-[80px] resize-none"
                          {...field}
                        />
                        <Button 
                          type="submit" 
                          size="icon"
                          className="absolute right-2 bottom-2" 
                          disabled={submitting || sendingMessage}
                        >
                          {submitting || sendingMessage ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
