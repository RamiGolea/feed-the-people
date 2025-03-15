import { useEffect, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { useForm } from "react-hook-form";
import { useSearchParams, useNavigate } from "react-router";
import { useUser } from "@gadgetinc/react";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MessageFormValues {
  content: string;
}

export default function NewMessage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get("postId");
  const recipientId = searchParams.get("userId");
  const currentUser = useUser(api);
  
  const [post, setPost] = useState<any>(null);
  const [recipient, setRecipient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
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
        recipient: {
          _link: recipientId
        },
        sender: {
          _link: currentUser.id
        },
        status: "active"
      };
      
      // Only add post if postId exists
      if (postId) {
        messagePayload.post = {
          _link: postId
        };
      }
      
      // Send the message
      const result = await api.message.create(messagePayload);
      
      if (result.success) {
        setSuccess(true);
        form.reset();
      } else {
        setError("Failed to send message: " + result.errors.map(e => e.message).join(", "));
      }
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
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error && !post) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertTitle>Error loading information</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
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
          <CardTitle>Send a Message</CardTitle>
          <CardDescription>
            Contact {recipient?.firstName} {post ? `about "${post?.title}"` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="mb-4">
              <AlertTitle>Message sent successfully!</AlertTitle>
              <AlertDescription>
                Your message has been sent to {recipient?.firstName}. They'll be notified and can respond to you.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {post && (
                <div className="mb-6 p-4 bg-muted rounded-md">
                  <h3 className="font-medium">Post details:</h3>
                  <p className="text-sm mt-2"><strong>Title:</strong> {post?.title}</p>
                  <p className="text-sm mt-1"><strong>Category:</strong> {post?.category}</p>
                  <p className="text-sm mt-1"><strong>Location:</strong> {post?.location}</p>
                </div>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField
                    control={form.control}
                    name="content"
                    rules={{ required: "Please enter a message" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Introduce yourself and explain why you're interested in this food. Include details about pickup arrangements and any questions you might have. (Minimum 10 characters)"
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-4" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </CardContent>
        {success && (
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleGoBack} variant="outline">
              Go Back
            </Button>
            <Button 
              onClick={() => {
                setSuccess(false);
                form.reset({ content: "" });
              }}
            >
              Send Another Message
            </Button>
            <Button 
              onClick={navigateToConversation}
              variant="default"
              className="flex items-center"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              View Conversation
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
