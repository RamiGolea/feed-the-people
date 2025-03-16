import { useNavigate, useParams } from "react-router";
import { useFindOne, useFindMany, useAction, useSession, useUser, useMaybeFindOne } from "@gadgetinc/react";
import { api } from "../api";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Apple, Beef, Carrot, ChefHat, Egg, Fish, Leaf, Wheat } from "lucide-react";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);

  // Setup delete action
  const [{ fetching: deleteFetching, error: deleteError }, deletePost] = useAction(api.post.delete);

  // Setup complete action
  const [{ fetching: completeFetching, error: completeError }, completePost] = useAction(api.post.complete);

  // Email validation function
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle email change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setRecipientEmail(email);
    
    if (!email) {
      setEmailError("Email is required");
      setIsEmailValid(false);
    } else if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      setIsEmailValid(false);
    } else {
      setEmailError("");
      setIsEmailValid(true);
    }
    
    // Reset user existence check when email changes
    setUserExists(null);
  };
  
  // Check if user exists with the given email
  const checkUserExists = async (email: string) => {
    if (!isEmailValid) return;
    
    setIsCheckingUser(true);
    try {
      const result = await api.user.findFirst({
        filter: { email: { equals: email } },
        select: { id: true }
      });
      
      // If we got here, a user was found
      setUserExists(true);
      setEmailError("");
    } catch (error) {
      // No user found with this email
      setUserExists(false);
      setEmailError("No user found with this email address");
    } finally {
      setIsCheckingUser(false);
    }
  };
  
  // Handle email field blur event
  const handleEmailBlur = () => {
    if (isEmailValid) {
      checkUserExists(recipientEmail);
    }
  };

  // Handle post deletion
  const handleDeletePost = async () => {
    try {
      await deletePost({ id });
      toast.success("Post deleted successfully");
      navigate("/signed-in");
    } catch (error) {
      toast.error("Failed to delete post: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Handle post completion
  const handleCompletePost = async () => {
    // Validate email before proceeding
    if (!isEmailValid) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    // Check if user exists (if not already checked)
    if (userExists === false) {
      toast.error("No user with this email exists. Please check the email address.");
      return;
    }
    
    try {
      const result = await completePost({ id, recipientEmail }, { 
        select: { 
          success: true,
          post: {
            status: true,
            title: true
          }
        }
      });
      
      toast.success("Listing has been completed.", {
        duration: 4000,
      });
      navigate("/signed-in");
    } catch (error) {
      // Provide more specific error feedback without navigating away
      if (error instanceof Error) {
        if (error.message.includes("permission")) {
          toast.error("You don't have permission to complete this post.");
        } else if (error.message.includes("network")) {
          toast.error("Network error. Please check your connection and try again.");
        } else if (error.message.includes("recipient")) {
          toast.error("Invalid recipient email. Please check and try again.");
        } else {
          toast.error(`Failed to complete post: ${error.message}`);
        }
      } else {
        toast.error("An unexpected error occurred while completing the post.");
      }
    }
  };

  // Fetch post details with dietary preferences
  const [{ data: post, error: postError, fetching: fetchingPost }, refreshPost] = useFindOne(api.post, id!, {
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      foodAllergens: true,
      goBadDate: true,
      location: true,
      images: true,
      status: true,
      user: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dietaryPreferences: true,
      },
    },
  });

  // Component to display dietary preference icons with tooltips
  const DietaryIcons = ({ dietaryPreferences }: { dietaryPreferences?: string | null }) => {
    if (!dietaryPreferences) return null;
    
    // Parse dietary preferences from string (assuming comma-separated values)
    const preferences = dietaryPreferences.split(',').map(pref => pref.trim().toLowerCase());
    
    // Define icon mappings and their tooltips
    const dietaryIcons = [
      { 
        id: 'vegetarian', 
        keywords: ['vegetarian', 'veg'], 
        icon: <Carrot className="h-4 w-4 text-orange-500" />, 
        tooltip: 'Vegetarian' 
      },
      { 
        id: 'vegan', 
        keywords: ['vegan', 'plant-based'], 
        icon: <Leaf className="h-4 w-4 text-green-600" />, 
        tooltip: 'Vegan/Plant-based' 
      },
      { 
        id: 'pescatarian', 
        keywords: ['pescatarian', 'fish'], 
        icon: <Fish className="h-4 w-4 text-blue-500" />, 
        tooltip: 'Pescatarian' 
      },
      { 
        id: 'gluten-free', 
        keywords: ['gluten-free', 'gluten free', 'no gluten'], 
        icon: <Wheat className="h-4 w-4 text-amber-600" />, 
        tooltip: 'Gluten-Free' 
      },
      { 
        id: 'dairy-free', 
        keywords: ['dairy-free', 'dairy free', 'no dairy'], 
        icon: <Egg className="h-4 w-4 text-yellow-400" />, 
        tooltip: 'Dairy-Free' 
      },
      { 
        id: 'paleo', 
        keywords: ['paleo', 'caveman', 'paleolithic'], 
        icon: <Beef className="h-4 w-4 text-red-600" />, 
        tooltip: 'Paleo' 
      },
      { 
        id: 'organic', 
        keywords: ['organic', 'bio'], 
        icon: <Apple className="h-4 w-4 text-green-500" />, 
        tooltip: 'Organic' 
      },
      { 
        id: 'chef', 
        keywords: ['chef', 'cook', 'culinary'], 
        icon: <ChefHat className="h-4 w-4 text-gray-500" />, 
        tooltip: 'Chef/Culinary Professional' 
      }
    ];

    // Display only icons that match user preferences
    const matchedIcons = dietaryIcons.filter(icon => 
      icon.keywords.some(keyword => 
        preferences.some(pref => pref.includes(keyword))
      )
    );

    return (
      <TooltipProvider>
        <span className="flex items-center ml-2 gap-1">
          {matchedIcons.map((icon, index) => (
            <Tooltip key={icon.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <span className="inline-block cursor-help">{icon.icon}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{icon.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </span>
      </TooltipProvider>
    );
  };

  // Get current user session
  const session = useSession(api);

  const currentUserId = session?.user?.id;
  const postOwnerId = post?.user?.id;
  const isPostOwner = currentUserId === postOwnerId;



  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  // Loading states
  if (fetchingPost && !post) {
    return (
      <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states
  if (postError) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Post</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was an error loading this post. Please try again later.</p>
            <p className="text-sm text-gray-500">{postError.toString()}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Post Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The post you are looking for does not exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Post Details - Left Column */}
      <Card className={isPostOwner ? "lg:col-span-2" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">{post.title}</CardTitle>
            </div>
            <div className="flex flex-col items-end gap-2">
              {isPostOwner && post.status !== "Archived" && (
                <>
                  <Button 
                    className="bg-green-600 text-white hover:bg-green-700"
                    size="sm"
                    onClick={handleCompletePost}
                    disabled={completeFetching || !isValidEmail(recipientEmail)}
                  >
                    {completeFetching ? "Completing..." : "Complete"}
                  </Button>
                  <div className="w-full mt-2">
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={recipientEmail}
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
                      className={`w-full text-sm ${emailError ? 'border-red-500' : isEmailValid ? 'border-green-500' : ''}`}
                      aria-label="Recipient Email"
                    />
                    <div className="flex justify-between mt-1">
                      <div className="text-xs text-gray-500">Recipient Email</div>
                      {isCheckingUser && <div className="text-xs text-blue-500">Checking user...</div>}
                      {userExists === true && <div className="text-xs text-green-500">User found!</div>}
                    </div>
                    {emailError && <div className="text-xs text-red-500 mt-1">{emailError}</div>}
                  </div>
                </>
              )}
              {isPostOwner && (
              
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Post</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this post? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex items-center justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={handleDeletePost}
                        disabled={deleteFetching}
                      >
                        {deleteFetching ? "Deleting..." : "Delete"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              <Badge variant={post.category === "leftovers" ? "secondary" : "default"}>
                {post.category === "leftovers" ? "Leftovers" : "Perishables"}
              </Badge>
            </div>
          </div>
          <CardDescription className="flex items-center">
            Posted by {post.user?.firstName} {post.user?.lastName}
            <DietaryIcons dietaryPreferences={post.user?.dietaryPreferences} />
          </CardDescription>
          <CardDescription className="mt-1 text-sm text-gray-500">Owner ID: {post.user?.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-lg">{post.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {post.location && (
              <div>
                <h3 className="font-medium text-sm text-gray-500">Location</h3>
                <p>{post.location}</p>
              </div>
            )}

            {post.goBadDate && (
              <div>
                <h3 className="font-medium text-sm text-gray-500">Goes Bad On</h3>
                <p>{formatDate(post.goBadDate)}</p>
              </div>
            )}
          </div>

          {post.foodAllergens && (
            <div>
              <h3 className="font-medium text-sm text-gray-500">Allergen Information</h3>
              <p>{post.foodAllergens}</p>
            </div>
          )}

          {(() => {
            // Helper function to normalize image data
            const getImageArray = () => {
              try {
                if (!post.images) return null;

                // If images is a string (JSON), try to parse it
                if (typeof post.images === 'string') {
                  try {
                    const parsed = JSON.parse(post.images);
                    return Array.isArray(parsed) ? parsed : [parsed];
                  } catch {
                    // If parsing fails, treat it as a single image URL
                    return [post.images];
                  }
                }

                // If images is already an array, use it directly
                if (Array.isArray(post.images)) {
                  return post.images.length > 0 ? post.images : null;
                }

                // If images is an object but not an array (like a single image object)
                if (typeof post.images === 'object') {
                  return [post.images];
                }

                return null;
              } catch (error) {
                console.error("Error processing images:", error);
                return null;
              }
            };

            const imageArray = getImageArray();

            if (!imageArray) {
              return (
                <div className="mt-4">
                  <h3 className="font-medium text-sm text-gray-500 mb-2">Images</h3>
                  <div className="p-4 bg-gray-100 rounded-md text-center text-gray-500">
                    No images available
                  </div>
                </div>
              );
            }

            return (
              <div className="mt-4">
                <h3 className="font-medium text-sm text-gray-500 mb-2">Images</h3>
                <div className="grid grid-cols-2 gap-2">
                  {imageArray.map((image, index) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
                      {(() => {
                        try {
                          // Handle different image formats
                          const imgSrc = typeof image === 'string'
                            ? image
                            : image.url || image.src || image.source || null;

                          if (!imgSrc) {
                            return <div className="flex items-center justify-center w-full h-full text-gray-500">Invalid image</div>;
                          }

                          return (
                            <img
                              src={imgSrc}
                              alt={`Food image ${index + 1}`}
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%236b7280'%3EImage Error%3C/text%3E%3C/svg%3E";
                              }}
                            />
                          );
                        } catch (error) {
                          return <div className="flex items-center justify-center w-full h-full text-gray-500">Error</div>;
                        }
                      })()};
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Error display for delete action */}
      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md">
          Error deleting post: {deleteError.toString()}
        </div>
      )}

      {/* Error display for complete action */}
      {completeError && (
        <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md">
          Error completing post: {completeError.toString()}
        </div>
      )}
      
      {/* Contact Owner - Right Column (Only shows if not post owner) */}
      {!isPostOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Contact {post.user?.firstName || "Owner"}</CardTitle>
            <CardDescription>Interested in this food item?</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-center mb-6">
              Send a direct message to coordinate pickup or delivery with the owner.
            </p>
            <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={() => navigate(`/direct-messages?userId=${post.user?.id}`)}
            >
              Message {post.user?.firstName || "Owner"}
            </Button>
          </CardContent>
        </Card>
      )}
   
      {/* Own Post Notice - Shows instead of chat when user is post owner */}
      {isPostOwner && (
        <Card className="lg:hidden">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-center text-gray-500 py-10">
              This is your own post. You cannot message yourself.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}