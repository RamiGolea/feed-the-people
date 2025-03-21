import { useState, useEffect } from "react";
import { useFindMany } from "@gadgetinc/react";
import { api } from "../api";
import { Link } from "react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [userScores, setUserScores] = useState<Record<string, number>>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [afterCursor, setAfterCursor] = useState<string | undefined>(undefined);
  const [beforeCursor, setBeforeCursor] = useState<string | undefined>(undefined);
  const pageSize = 10;
  
  // Build filter object based on selected category
  const filter = {
    status: {
      equals: "Active"
    },
    ...(categoryFilter !== "all" && {
      category: {
        equals: categoryFilter
      }
    })
  };
  
  const [{ data, fetching, error }] = useFindMany(api.post, {
    filter,
    search: searchTerm || undefined, // Only apply search if there's a term
    sort: { createdAt: "Descending" },
    first: pageSize,
    after: afterCursor,
    before: beforeCursor,
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      location: true,
      images: true,
      foodAllergens: true,
      goBadDate: true,
      createdAt: true,
      user: {
        id: true,
        firstName: true,
        lastName: true
      }
    },
  });
  
  // Fetch user scores separately since ShareScore has a belongsTo relationship to User
  useEffect(() => {
    const fetchUserScores = async () => {
      if (!data || data.length === 0) return;
      
      // Get unique user IDs from posts
      const userIds = [...new Set(data.map(post => post.user?.id).filter(Boolean))];
      
      // For each user ID, find their shareScore
      const scores: Record<string, number> = {};
      
      await Promise.all(userIds.map(async (userId) => {
        if (!userId) return;
        
        try {
          // Find the shareScore for this user
          const shareScores = await api.shareScore.findMany({
            filter: {
              userId: {
                equals: userId
              }
            },
            select: {
              id: true,
              score: true,
              userId: true
            }
          });
          
          // If a score was found, save it
          if (shareScores && shareScores.length > 0) {
            scores[userId] = shareScores[0].score ?? 0;
          } else {
            scores[userId] = 0;
          }
        } catch (err) {
          console.error(`Error fetching score for user ${userId}:`, err);
          scores[userId] = 0;
        }
      }));
      
      setUserScores(scores);
    };
    
    fetchUserScores();
  }, [data]);

  // Reset pagination when search term or category changes
  useEffect(() => {
    setCurrentPage(1);
    setAfterCursor(undefined);
    setBeforeCursor(undefined);
  }, [searchTerm, categoryFilter]);

  // Handle pagination
  const handleNextPage = () => {
    if (data?.hasNextPage) {
      setBeforeCursor(undefined);
      setAfterCursor(data.endCursor);
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (data?.hasPreviousPage) {
      setAfterCursor(undefined);
      setBeforeCursor(data.startCursor);
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Format the goBadDate to a human-readable format
  const formatDate = (date: string | null | undefined) => {
    if (!date) return null;
    return format(new Date(date), "MMM d, yyyy");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Find Food</h1>
      
      <div className="mb-4">
        <Tabs 
          defaultValue="all" 
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-green-50">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="perishables"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              Perishables
            </TabsTrigger>
            <TabsTrigger 
              value="leftovers"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              Leftovers
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="mb-8">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search by title, description, location, or allergens..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {fetching && <div className="text-center py-8">Loading...</div>}
      
      {error && (
        <div className="text-center py-8 text-red-500">
          Error loading posts: {error.message}
        </div>
      )}
      
      {!fetching && !error && data && data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No food items found. Try adjusting your search.
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.map((post) => (
          <Link 
            to={`/post-detail/${post.id}`} 
            key={post.id}
            className="w-full"
          >
            <Card className="w-full h-full hover:shadow-lg transition-shadow">
              <div className="flex flex-col">
                <div className="w-full h-40 overflow-hidden">
                  {(() => {
                    // Safe JSON parsing
                    let images = [];
                    try {
                      if (post.images) {
                        const parsedImages = JSON.parse(post.images as string);
                        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                          images = parsedImages;
                        }
                      }
                    } catch (e) {
                      console.error("Error parsing post images:", e);
                    }
                    
                    return images.length > 0 ? (
                      <img 
                        src={images[0]} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    );
                  })()}
                </div>
                
                <div className="flex-1 p-3">
                  
                  <div className="flex justify-between items-start">
                    <h2 className="font-semibold text-base line-clamp-1">{post.title}</h2>
                    <div className="flex flex-col items-end gap-1">
                      {post.category && (
                        <Badge variant="secondary" className="capitalize">
                          {post.category}
                        </Badge>
                      )}
                      {post.user && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span>
                            {post.user.id ? (userScores[post.user.id] ?? 0) : 0}
                          </span>
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{post.description}</p>                  
                  {post.foodAllergens && (
                    <div className="mt-2">
                      <span className="text-xs font-medium">Allergens: </span>
                      <span className="text-xs text-gray-600 line-clamp-1">{post.foodAllergens}</span>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    {post.user && (
                      <div className="text-xs text-gray-600 mb-1">
                        By: <span className="font-medium">
                          {post.user.firstName || post.user.lastName 
                            ? `${post.user.firstName || ''} ${post.user.lastName || ''}`.trim()
                            : 'Anonymous'}
                        </span>
                      </div>
                    )}
                  
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {post.location && (
                        <div className="text-gray-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{post.location}</span>
                        </div>
                      )}
                      
                      {post.goBadDate && (
                        <div className="text-gray-500 flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          <span>Expires: {formatDate(post.goBadDate)}</span>
                        </div>
                      )}
                      
                      <div className="text-gray-400 ml-auto">
                        Posted: {format(new Date(post.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      
      {/* Pagination UI */}
      {!fetching && !error && data && data.length > 0 && (
        <div className="flex justify-center items-center mt-8">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={!data.hasPreviousPage}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <span className="text-sm px-3 py-1 rounded-md bg-muted">
              Page {currentPage}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!data.hasNextPage}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
