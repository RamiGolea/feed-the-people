import React, { useState, KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import { api } from "../api";
import { AutoForm, AutoInput, AutoSubmit, SubmitResultBanner } from "@/components/auto";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { z } from "zod";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PostCreationPage = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [goBadDate, setGoBadDate] = useState<Date | undefined>(undefined);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [customAllergen, setCustomAllergen] = useState<string>("");
  const [customAllergens, setCustomAllergens] = useState<string[]>([]);
  
  const commonAllergens = ["Nuts", "Dairy", "Eggs", "Wheat", "Shellfish", "Soy", "Fish"];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      const newImages: File[] = Array.from(files);
      setImages([...images, ...newImages]);
      
      // Convert files to base64 for preview and storage
      const imagePromises = newImages.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(imagePromises).then(base64Images => {
        setUploadedImages([...uploadedImages, ...base64Images]);
        setIsUploading(false);
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newUploadedImages = [...uploadedImages];
    newUploadedImages.splice(index, 1);
    setUploadedImages(newUploadedImages);
  };

  const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    location: z.string().optional(),
    category: z.enum(["leftovers", "perishables"]),
    foodAllergens: z.string().optional(),
    goBadDate: z.date().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      category: "leftovers",
      foodAllergens: "",
      goBadDate: undefined,
    },
  });

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens(prev => 
      prev.includes(allergen)
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
  };

  const addCustomAllergen = () => {
    if (customAllergen.trim() !== "" && !customAllergens.includes(customAllergen.trim())) {
      setCustomAllergens(prev => [...prev, customAllergen.trim()]);
      setCustomAllergen("");
    }
  };

  const handleCustomAllergenKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomAllergen();
    }
  };

  const removeCustomAllergen = (allergen: string) => {
    setCustomAllergens(prev => prev.filter(a => a !== allergen));
  };

  const getAllergenString = (): string => {
    const allAllergens = [...selectedAllergens, ...customAllergens];
    return allAllergens.length > 0 ? allAllergens.join(", ") : "";
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const allergenString = getAllergenString();
      
      const result = await api.post.create({
        title: values.title,
        description: values.description,
        location: values.location || null,
        category: values.category,
        foodAllergens: allergenString || null,
        goBadDate: values.goBadDate || null,
        images: uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : null,
        status: "Active",
      });

      if (result) {
        toast.success("Post created successfully!");
        navigate("/signed-in");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
          <CardDescription>
            Fill in the details below to create a new post for an item you want to share.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { onChange: (...event: any[]) => void; onBlur: () => void; value: any; name: string; ref: React.RefCallback<HTMLInputElement>; } }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Title of your item" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }: { field: React.InputHTMLAttributes<HTMLTextAreaElement> & { onChange: (...event: any[]) => void; onBlur: () => void; value: any; name: string; ref: React.RefCallback<HTMLTextAreaElement>; } }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your item in detail" 
                        className="min-h-32" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { onChange: (...event: any[]) => void; onBlur: () => void; value: any; name: string; ref: React.RefCallback<HTMLInputElement>; } }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }: { field: { onChange: (...event: any[]) => void; onBlur: () => void; value: any; name: string; ref: React.RefCallback<HTMLSelectElement>; } }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="leftovers">Leftovers</SelectItem>
                          <SelectItem value="perishables">Perishables</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="foodAllergens"
                  render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { onChange: (...event: any[]) => void; onBlur: () => void; value: any; name: string; ref: React.RefCallback<HTMLInputElement>; } }) => (
                    <FormItem>
                      <FormLabel>Food Allergens (Optional)</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {commonAllergens.map(allergen => (
                              <Badge 
                                key={allergen}
                                variant={selectedAllergens.includes(allergen) ? "default" : "outline"}
                                className={`cursor-pointer ${selectedAllergens.includes(allergen) ? 'bg-primary' : ''}`}
                                onClick={() => toggleAllergen(allergen)}
                              >
                                {allergen}
                                {selectedAllergens.includes(allergen) && (
                                  <X className="ml-1 h-3 w-3" />
                                )}
                              </Badge>
                            ))}
                          </div>
                          
                          {customAllergens.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {customAllergens.map(allergen => (
                                <Badge 
                                  key={allergen}
                                  variant="default"
                                  className="bg-primary cursor-pointer"
                                >
                                  {allergen}
                                  <X 
                                    className="ml-1 h-3 w-3" 
                                    onClick={() => removeCustomAllergen(allergen)}
                                  />
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Input
                              value={customAllergen}
                              onChange={(e) => setCustomAllergen(e.target.value)}
                              onKeyDown={handleCustomAllergenKeyDown}
                              placeholder="Add custom allergen"
                              className="flex-grow"
                            />
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline"
                              onClick={addCustomAllergen}
                              disabled={customAllergen.trim() === ""}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          
                          <input
                            type="hidden"
                            {...field}
                            value={getAllergenString()}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goBadDate"
                  render={({ field }: { field: { onChange: (date: Date | undefined) => void; onBlur: () => void; value: Date | undefined; name: string; ref: React.RefCallback<HTMLButtonElement>; } }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Goes Bad Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="images">Upload Images</Label>
                <div className="mt-2">
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                </div>
                
                {isUploading && <p className="text-sm mt-2">Uploading images...</p>}
                
                {uploadedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={imageUrl} 
                          alt={`Uploaded image ${index}`} 
                          className="h-24 w-full object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isUploading || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Creating Post..." : "Create Post"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Alternative implementation using AutoForm */}
      {/* 
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
          <CardDescription>
            Fill in the details below to create a new post for an item you want to share.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutoForm action={api.post.create} title={false}>
            <SubmitResultBanner />
            <div className="space-y-6">
              <AutoInput field="title" />
              <AutoInput field="description" />
              <div className="grid grid-cols-2 gap-4">
                <AutoInput field="price" />
                <AutoInput field="condition" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AutoInput field="location" />
                <AutoInput field="category" />
              </div>
              <div>
                <Label htmlFor="images">Upload Images</Label>
                <div className="mt-2">
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                </div>
                
                {isUploading && <p className="text-sm mt-2">Uploading images...</p>}
                
                {uploadedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={imageUrl} 
                          alt={`Uploaded image ${index}`} 
                          className="h-24 w-full object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <AutoSubmit>Create Post</AutoSubmit>
            </div>
          </AutoForm>
        </CardContent>
      </Card>
      */}
    </div>
  );
};

export default PostCreationPage;
