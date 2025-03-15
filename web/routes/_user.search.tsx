import { useState } from "react";
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

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const [{ data, fetching, error }] = useFindMany(api.post, {
    filter: {
      status: {
        equals: "Active"
      }
    },
    search: searchTerm || undefined, // Only apply search if there's a term
    sort: { createdAt: "Descending" },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      category: true,
      condition: true,
      location: true,
      images: true,
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Search Items</h1>
      
      <div className="mb-8">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search by title, description, or category..."
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
          No items found. Try adjusting your search.
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data?.map((post) => (
          <Link 
            to={`/post?id=${post.id}`} 
            key={post.id}
            className="h-full"
          >
            <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader className="p-0 overflow-hidden h-48 relative">
                {post.images && Array.isArray(JSON.parse(post.images as string)) && JSON.parse(post.images as string).length > 0 ? (
                  <img 
                    src={JSON.parse(post.images as string)[0]} 
                    alt={post.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <Badge className="absolute top-2 right-2 bg-primary">
                  ${post.price?.toFixed(2)}
                </Badge>
              </CardHeader>
              
              <CardContent className="py-4 flex-grow">
                <h2 className="font-semibold text-lg line-clamp-1">{post.title}</h2>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.description}</p>
                
                <div className="mt-3 flex flex-wrap gap-1">
                  {post.category && (
                    <Badge variant="secondary" className="text-xs">
                      {post.category}
                    </Badge>
                  )}
                  {post.condition && (
                    <Badge variant="outline" className="text-xs">
                      {post.condition}
                    </Badge>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 pb-4">
                {post.location && (
                  <div className="text-sm text-gray-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {post.location}
                  </div>
                )}
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}