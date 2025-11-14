'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoItem, SocialMediaLink, PhotoGallery, PhotoGalleryItem } from '@/types/booking';
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface LandingPageMediaSettingsProps {
  tenantId: string;
  initialData: {
    videos?: VideoItem[];
    socialMedia?: SocialMediaLink[];
    galleries?: PhotoGallery[];
  };
}

const PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'];
const DISPLAY_TYPES = {
  videos: ['single', 'carousel', 'grid'],
  gallery: ['grid', 'carousel', 'masonry']
};

export default function LandingPageMediaSettings({
  tenantId,
  initialData
}: LandingPageMediaSettingsProps) {
  const [videos, setVideos] = useState<VideoItem[]>(initialData.videos || []);
  const [socialMedia, setSocialMedia] = useState<SocialMediaLink[]>(initialData.socialMedia || []);
  const [galleries, setGalleries] = useState<PhotoGallery[]>(initialData.galleries || []);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Video Management
  const [newVideo, setNewVideo] = useState({ title: '', youtubeUrl: '', description: '' });
  const addVideo = () => {
    if (!newVideo.title || !newVideo.youtubeUrl) {
      setMessage({ type: 'error', text: 'Please fill in title and YouTube URL' });
      return;
    }
    const video: VideoItem = {
      id: Date.now().toString(),
      title: newVideo.title,
      youtubeUrl: newVideo.youtubeUrl,
      description: newVideo.description,
      displayOrder: videos.length,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setVideos([...videos, video]);
    setNewVideo({ title: '', youtubeUrl: '', description: '' });
    setMessage(null);
  };

  const removeVideo = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
  };

  const moveVideo = (id: string, direction: 'up' | 'down') => {
    const index = videos.findIndex(v => v.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === videos.length - 1)) return;
    const newVideos = [...videos];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newVideos[index], newVideos[newIndex]] = [newVideos[newIndex], newVideos[index]];
    newVideos.forEach((v, i) => v.displayOrder = i);
    setVideos(newVideos);
  };

  // Social Media Management
  const [newSocial, setNewSocial] = useState({ platform: 'instagram', url: '' });
  const addSocial = () => {
    if (!newSocial.url) {
      setMessage({ type: 'error', text: 'Please enter a social media URL' });
      return;
    }
    const social: SocialMediaLink = {
      id: Date.now().toString(),
      platform: newSocial.platform as any,
      url: newSocial.url,
      displayOrder: socialMedia.length,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSocialMedia([...socialMedia, social]);
    setNewSocial({ platform: 'instagram', url: '' });
    setMessage(null);
  };

  const removeSocial = (id: string) => {
    setSocialMedia(socialMedia.filter(s => s.id !== id));
  };

  const moveSocial = (id: string, direction: 'up' | 'down') => {
    const index = socialMedia.findIndex(s => s.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === socialMedia.length - 1)) return;
    const newSocial = [...socialMedia];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSocial[index], newSocial[newIndex]] = [newSocial[newIndex], newSocial[index]];
    newSocial.forEach((s, i) => s.displayOrder = i);
    setSocialMedia(newSocial);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/landing-page-media', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          tenantId,
          videos: videos.filter(v => v.id.toString().length > 0),
          socialMedia: socialMedia.filter(s => s.id.toString().length > 0),
          galleries,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Landing page media updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update media' });
      }
    } catch (error) {
      console.error('Error updating landing page media:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="gallery">Photo Gallery</TabsTrigger>
        </TabsList>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add YouTube Video</CardTitle>
              <CardDescription>
                Add YouTube videos to your landing page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoTitle">Video Title</Label>
                <Input
                  id="videoTitle"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  placeholder="Enter video title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">YouTube URL</Label>
                <Input
                  id="youtubeUrl"
                  value={newVideo.youtubeUrl}
                  onChange={(e) => setNewVideo({ ...newVideo, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoDescription">Description (Optional)</Label>
                <Textarea
                  id="videoDescription"
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                  placeholder="Enter video description"
                  rows={3}
                />
              </div>

              <Button type="button" onClick={addVideo} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Video
              </Button>
            </CardContent>
          </Card>

          {videos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Videos List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {videos.map((video, index) => (
                  <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{video.title}</p>
                      <p className="text-sm text-gray-600 truncate">{video.youtubeUrl}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moveVideo(video.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moveVideo(video.id, 'down')}
                        disabled={index === videos.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeVideo(video.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Social Media Link</CardTitle>
              <CardDescription>
                Add links to your social media profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={newSocial.platform} onValueChange={(value) => setNewSocial({ ...newSocial, platform: value })}>
                  <SelectTrigger id="platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialUrl">URL</Label>
                <Input
                  id="socialUrl"
                  value={newSocial.url}
                  onChange={(e) => setNewSocial({ ...newSocial, url: e.target.value })}
                  placeholder="https://www.instagram.com/yourprofile"
                />
              </div>

              <Button type="button" onClick={addSocial} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Social Media
              </Button>
            </CardContent>
          </Card>

          {socialMedia.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Social Media List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {socialMedia.map((social, index) => (
                  <div key={social.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize">{social.platform}</p>
                      <p className="text-sm text-gray-600 truncate">{social.url}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moveSocial(social.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moveSocial(social.id, 'down')}
                        disabled={index === socialMedia.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSocial(social.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Photo Gallery Coming Soon</CardTitle>
              <CardDescription>
                Photo gallery management will be available soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Photo gallery management interface is currently under development.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Media Settings'
          )}
        </Button>
      </div>
    </form>
  );
}
