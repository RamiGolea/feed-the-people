import { useParams, Link, useLoaderData } from "react-router";
import { api } from "../api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useState, useEffect } from "react";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  try {
    // Fetch notification with related data
    const notification = await context.api.notification.findOne(id, {
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        isRead: true,
        type: true,
        metadata: true,
        relatedPostId: true,
        sender: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          googleImageUrl: true,
        },
        recipient: {
          id: true,
          firstName: true,
          lastName: true,
        }
      }
    });

    // If notification isn't read yet, mark it as read
    if (notification && !notification.isRead) {
      await context.api.notification.update(notification.id, {
        isRead: true
      });
    }

    // If it's a post_completed notification and has a related post ID, fetch that too
    let relatedPost = null;
    if (notification.type === "post_completed" && notification.relatedPostId) {
      try {
        relatedPost = await context.api.post.findOne(notification.relatedPostId, {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            location: true,
            createdAt: true,
            status: true
          }
        });
      } catch (error) {
        // Post might have been deleted, continue without it
        console.error("Related post not found:", error);
      }
    }

    return { notification, relatedPost };
  } catch (error) {
    throw new Response("Notification not found", { status: 404 });
  }
}

export default function NotificationDetailPage() {
  const { notification, relatedPost } = useLoaderData() as { 
    notification: any,
    relatedPost: any
  };
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedUpdateDate, setFormattedUpdateDate] = useState("");

  useEffect(() => {
    // Format dates for display
    if (notification.createdAt) {
      const date = new Date(notification.createdAt);
      setFormattedDate(date.toLocaleString());
    }
    
    if (notification.updatedAt) {
      const date = new Date(notification.updatedAt);
      setFormattedUpdateDate(date.toLocaleString());
    }
  }, [notification]);

  const renderNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "post_completed":
        return <Badge variant="success">Post Completed</Badge>;
      case "message_received":
        return <Badge variant="info">Message Received</Badge>;
      case "system":
        return <Badge variant="secondary">System</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const renderSenderInfo = () => {
    if (!notification.sender) {
      return <p>System notification</p>;
    }

    return (
      <div className="flex items-center gap-3 mt-2">
        {notification.sender.googleImageUrl ? (
          <img 
            src={notification.sender.googleImageUrl} 
            alt={`${notification.sender.firstName || ''} ${notification.sender.lastName || ''}`} 
            className="w-10 h-10 rounded-full" 
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
            {(notification.sender.firstName?.[0] || '') + (notification.sender.lastName?.[0] || '')}
          </div>
        )}
        <div>
          <p className="font-medium">
            {notification.sender.firstName} {notification.sender.lastName}
          </p>
          <p className="text-sm text-gray-500">{notification.sender.email}</p>
        </div>
      </div>
    );
  };

  const renderMetadata = () => {
    if (!notification.metadata) return null;

    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Additional Information</h3>
        <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-auto">
          {JSON.stringify(notification.metadata, null, 2)}
        </pre>
      </div>
    );
  };

  const renderRelatedPost = () => {
    if (!relatedPost) return null;

    return (
      <div className="mt-6">
        <h3 className="text-md font-medium mb-3">Related Post Information</h3>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{relatedPost.title}</CardTitle>
            <CardDescription>
              {relatedPost.category && (
                <Badge className="mr-2">{relatedPost.category}</Badge>
              )}
              <span className="text-sm text-gray-500">
                Created {new Date(relatedPost.createdAt).toLocaleDateString()}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-3">{relatedPost.description}</p>
            {relatedPost.location && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Location:</span> {relatedPost.location}
              </p>
            )}
            <div className="mt-3">
              <Badge variant={relatedPost.status === "Active" ? "default" : "secondary"}>
                {relatedPost.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex justify-between items-center">
        <Link to="/notifications">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Notifications
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Notification Details</CardTitle>
              <CardDescription>
                Created {formattedDate}
              </CardDescription>
            </div>
            {renderNotificationTypeLabel(notification.type)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-md font-medium mb-2">Content</h3>
            <p className="text-gray-700">{notification.content}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-md font-medium mb-2">From</h3>
            {renderSenderInfo()}
          </div>

          {renderMetadata()}

          {notification.type === "post_completed" && (
            <>
              <Separator />
              {renderRelatedPost()}
            </>
          )}
          
          <div className="text-sm text-gray-500 mt-4">
            <p>Last updated: {formattedUpdateDate}</p>
            <p>Status: {notification.isRead ? "Read" : "Unread"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}