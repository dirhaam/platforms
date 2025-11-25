'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Upload, Link as LinkIcon, Eye, ExternalLink } from 'lucide-react';

interface ContactLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  iconType?: string;
  backgroundColor?: string;
  textColor?: string;
  displayOrder: number;
  isActive: boolean;
  clickCount?: number;
}

interface ContactPageSettingsData {
  pageTitle?: string;
  pageDescription?: string;
  profileImage?: string;
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundValue: string;
  buttonStyle: 'rounded' | 'pill' | 'square';
  buttonShadow: boolean;
  fontFamily: string;
  showSocialIcons: boolean;
  showLogo: boolean;
  customCss?: string;
}

interface ContactPageSettingsProps {
  tenantId: string;
  subdomain: string;
}

const BUTTON_STYLES = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
  { value: 'square', label: 'Square' },
];

const BACKGROUND_TYPES = [
  { value: 'solid', label: 'Solid Color' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'image', label: 'Image' },
];

const GRADIENT_PRESETS = [
  { value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Purple Dream' },
  { value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', label: 'Pink Sunset' },
  { value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', label: 'Ocean Blue' },
  { value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', label: 'Green Energy' },
  { value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', label: 'Warm Glow' },
  { value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', label: 'Soft Pink' },
  { value: 'linear-gradient(135deg, #000000 0%, #434343 100%)', label: 'Dark Mode' },
];

const POPULAR_ICONS = ['🔗', '📱', '💬', '📧', '🛒', '📍', '🎵', '📸', '🎬', '💼', '🌐', '📝'];

export default function ContactPageSettings({ tenantId, subdomain }: ContactPageSettingsProps) {
  const [links, setLinks] = useState<ContactLink[]>([]);
  const [settings, setSettings] = useState<ContactPageSettingsData>({
    backgroundType: 'solid',
    backgroundValue: '#000000',
    buttonStyle: 'rounded',
    buttonShadow: true,
    fontFamily: 'default',
    showSocialIcons: true,
    showLogo: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newLink, setNewLink] = useState({ title: '', url: '', icon: '🔗' });
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchContactPageData();
  }, [tenantId]);

  const fetchContactPageData = async () => {
    try {
      setIsFetching(true);
      const response = await fetch('/api/settings/contact-page', {
        headers: { 'x-tenant-id': tenantId },
        credentials: 'same-origin',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.data?.links) {
          setLinks(result.data.links.map((l: any) => ({
            id: l.id,
            title: l.title,
            url: l.url,
            icon: l.icon,
            iconType: l.icon_type,
            backgroundColor: l.background_color,
            textColor: l.text_color,
            displayOrder: l.display_order,
            isActive: l.is_active,
            clickCount: l.click_count,
          })));
        }
        if (result.data?.settings) {
          setSettings(prev => ({ ...prev, ...result.data.settings }));
        }
      }
    } catch (error) {
      console.error('Error fetching linktree data:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const addLink = () => {
    if (!newLink.title || !newLink.url) {
      setMessage({ type: 'error', text: 'Please fill in title and URL' });
      return;
    }

    const link: ContactLink = {
      id: Date.now().toString(),
      title: newLink.title,
      url: newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`,
      icon: newLink.icon,
      iconType: 'emoji',
      displayOrder: links.length,
      isActive: true,
    };

    setLinks([...links, link]);
    setNewLink({ title: '', url: '', icon: '🔗' });
    setMessage(null);
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const moveLink = (id: string, direction: 'up' | 'down') => {
    const index = links.findIndex(l => l.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === links.length - 1)) return;
    
    const newLinks = [...links];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];
    newLinks.forEach((l, i) => l.displayOrder = i);
    setLinks(newLinks);
  };

  const toggleLinkActive = (id: string) => {
    setLinks(links.map(l => l.id === id ? { ...l, isActive: !l.isActive } : l));
  };

  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBg(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/linktree-background', {
        method: 'POST',
        headers: { 'x-tenant-id': tenantId },
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.url) {
        setSettings(prev => ({
          ...prev,
          backgroundType: 'image',
          backgroundValue: result.url,
        }));
        setMessage({ type: 'success', text: 'Background uploaded successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to upload background' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload background' });
    } finally {
      setUploadingBg(false);
    }
  };

  const handleUploadProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProfile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/linktree-background', {
        method: 'POST',
        headers: { 'x-tenant-id': tenantId },
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.url) {
        setSettings(prev => ({ ...prev, profileImage: result.url }));
        setMessage({ type: 'success', text: 'Profile image uploaded successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to upload image' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/contact-page', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ links, settings }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Contact page settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const getBackgroundStyle = () => {
    if (settings.backgroundType === 'solid') {
      return { backgroundColor: settings.backgroundValue };
    } else if (settings.backgroundType === 'gradient') {
      return { background: settings.backgroundValue };
    } else if (settings.backgroundType === 'image') {
      return {
        backgroundImage: `url(${settings.backgroundValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {};
  };

  const getButtonStyle = () => {
    switch (settings.buttonStyle) {
      case 'pill': return 'rounded-full';
      case 'square': return 'rounded-none';
      default: return 'rounded-lg';
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Contact Links (Linktree)</h2>
          <p className="text-sm text-gray-600">Manage your contact page links</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.open(`/s/${subdomain}/contact`, '_blank')}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
      </div>

      <Tabs defaultValue="links" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Link</CardTitle>
              <CardDescription>Add links to your contact page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex gap-2 flex-wrap">
                    {POPULAR_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewLink(prev => ({ ...prev, icon }))}
                        className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg border-2 transition-colors ${
                          newLink.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkTitle">Title</Label>
                  <Input
                    id="linkTitle"
                    value={newLink.title}
                    onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Instagram"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkUrl">URL</Label>
                  <Input
                    id="linkUrl"
                    value={newLink.url}
                    onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://instagram.com/yourusername"
                  />
                </div>
              </div>
              <Button type="button" onClick={addLink} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Link
              </Button>
            </CardContent>
          </Card>

          {links.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Links ({links.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {links.map((link, index) => (
                  <div
                    key={link.id}
                    className={`flex items-center gap-3 p-4 border rounded-lg ${!link.isActive ? 'opacity-50' : ''}`}
                  >
                    <span className="text-2xl">{link.icon || '🔗'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{link.title}</p>
                      <p className="text-sm text-gray-500 truncate">{link.url}</p>
                      {link.clickCount !== undefined && link.clickCount > 0 && (
                        <p className="text-xs text-gray-400">{link.clickCount} clicks</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={link.isActive}
                        onCheckedChange={() => toggleLinkActive(link.id)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveLink(link.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveLink(link.id, 'down')}
                        disabled={index === links.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLink(link.id)}
                        className="text-red-500 hover:text-red-700"
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

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Page Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile Image</Label>
                    <div className="flex items-center gap-4">
                      {settings.profileImage && (
                        <img
                          src={settings.profileImage}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      )}
                      <input
                        ref={profileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUploadProfile}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => profileInputRef.current?.click()}
                        disabled={uploadingProfile}
                      >
                        {uploadingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Upload
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pageTitle">Page Title</Label>
                    <Input
                      id="pageTitle"
                      value={settings.pageTitle || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, pageTitle: e.target.value }))}
                      placeholder="Your Name or Business"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pageDescription">Description</Label>
                    <Textarea
                      id="pageDescription"
                      value={settings.pageDescription || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, pageDescription: e.target.value }))}
                      placeholder="A short bio or description"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Background</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Background Type</Label>
                    <Select
                      value={settings.backgroundType}
                      onValueChange={(v) => setSettings(prev => ({ ...prev, backgroundType: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BACKGROUND_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.backgroundType === 'solid' && (
                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.backgroundValue}
                          onChange={(e) => setSettings(prev => ({ ...prev, backgroundValue: e.target.value }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.backgroundValue}
                          onChange={(e) => setSettings(prev => ({ ...prev, backgroundValue: e.target.value }))}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  )}

                  {settings.backgroundType === 'gradient' && (
                    <div className="space-y-2">
                      <Label>Gradient Preset</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {GRADIENT_PRESETS.map(g => (
                          <button
                            key={g.value}
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, backgroundValue: g.value }))}
                            className={`h-12 rounded-lg border-2 transition-all ${
                              settings.backgroundValue === g.value ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                            }`}
                            style={{ background: g.value }}
                            title={g.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {settings.backgroundType === 'image' && (
                    <div className="space-y-2">
                      <Label>Background Image</Label>
                      <input
                        ref={bgInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUploadBackground}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => bgInputRef.current?.click()}
                        disabled={uploadingBg}
                        className="w-full"
                      >
                        {uploadingBg ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Upload Background Image
                      </Button>
                      {settings.backgroundValue && settings.backgroundType === 'image' && (
                        <img
                          src={settings.backgroundValue}
                          alt="Background preview"
                          className="w-full h-32 object-cover rounded-lg mt-2"
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Button Style</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Button Shape</Label>
                    <Select
                      value={settings.buttonStyle}
                      onValueChange={(v) => setSettings(prev => ({ ...prev, buttonStyle: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUTTON_STYLES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Button Shadow</Label>
                    <Switch
                      checked={settings.buttonShadow}
                      onCheckedChange={(v) => setSettings(prev => ({ ...prev, buttonShadow: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Social Icons</Label>
                    <Switch
                      checked={settings.showSocialIcons}
                      onCheckedChange={(v) => setSettings(prev => ({ ...prev, showSocialIcons: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Logo</Label>
                    <Switch
                      checked={settings.showLogo}
                      onCheckedChange={(v) => setSettings(prev => ({ ...prev, showLogo: v }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="rounded-xl overflow-hidden min-h-[500px] p-6"
                    style={getBackgroundStyle()}
                  >
                    <div className="max-w-md mx-auto text-center space-y-6">
                      {/* Profile */}
                      {(settings.showLogo || settings.profileImage) && (
                        <div className="flex flex-col items-center gap-3">
                          {settings.profileImage ? (
                            <img
                              src={settings.profileImage}
                              alt="Profile"
                              className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl">
                              👤
                            </div>
                          )}
                          {settings.pageTitle && (
                            <h1 className="text-2xl font-bold text-white">{settings.pageTitle}</h1>
                          )}
                          {settings.pageDescription && (
                            <p className="text-white/80 text-sm">{settings.pageDescription}</p>
                          )}
                        </div>
                      )}

                      {/* Links Preview */}
                      <div className="space-y-3">
                        {links.filter(l => l.isActive).slice(0, 5).map(link => (
                          <div
                            key={link.id}
                            className={`w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center gap-3 ${getButtonStyle()} ${
                              settings.buttonShadow ? 'shadow-lg' : ''
                            }`}
                          >
                            <span className="text-xl">{link.icon || '🔗'}</span>
                            <span className="flex-1 font-medium">{link.title}</span>
                            <ExternalLink className="w-4 h-4 opacity-50" />
                          </div>
                        ))}
                        {links.filter(l => l.isActive).length === 0 && (
                          <p className="text-white/60 text-sm">No active links yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
