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
  // Header/Profile
  pageTitle?: string;
  pageDescription?: string;
  profileImage?: string;
  profileLayout: 'classic' | 'hero';
  titleStyle: 'text' | 'logo';
  titleSize: 'small' | 'large';
  titleColor: string;
  
  // Theme
  theme: string;
  
  // Wallpaper/Background
  backgroundType: 'solid' | 'gradient' | 'blur' | 'pattern' | 'image' | 'video';
  backgroundValue: string;
  backgroundColor: string;
  
  // Text Styling
  fontFamily: string;
  pageTextColor: string;
  
  // Button Styling
  buttonStyle: 'solid' | 'glass' | 'outline';
  buttonCorners: 'square' | 'rounded' | 'pill';
  buttonShadow: 'none' | 'subtle' | 'strong' | 'hard';
  buttonColor: string;
  buttonTextColor: string;
  
  // Legacy
  showSocialIcons: boolean;
  showLogo: boolean;
  customCss?: string;
}

interface ContactPageSettingsProps {
  tenantId: string;
  subdomain: string;
}

// Profile Layout Options
const PROFILE_LAYOUTS = [
  { value: 'classic', label: 'Classic', icon: 'bx-user-circle' },
  { value: 'hero', label: 'Hero', icon: 'bx-image' },
];

// Title Style Options
const TITLE_STYLES = [
  { value: 'text', label: 'Text' },
  { value: 'logo', label: 'Logo' },
];

// Button Style Options
const BUTTON_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'glass', label: 'Glass' },
  { value: 'outline', label: 'Outline' },
];

// Button Corner Options
const BUTTON_CORNERS = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
];

// Button Shadow Options
const BUTTON_SHADOWS = [
  { value: 'none', label: 'None' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'strong', label: 'Strong' },
  { value: 'hard', label: 'Hard' },
];

// Background/Wallpaper Types
const BACKGROUND_TYPES = [
  { value: 'solid', label: 'Fill', icon: 'bx-square' },
  { value: 'gradient', label: 'Gradient', icon: 'bx-palette' },
  { value: 'blur', label: 'Blur', icon: 'bx-blur' },
  { value: 'pattern', label: 'Pattern', icon: 'bx-grid-alt' },
  { value: 'image', label: 'Image', icon: 'bx-image' },
  { value: 'video', label: 'Video', icon: 'bx-video' },
];

// Gradient Presets
const GRADIENT_PRESETS = [
  { value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Purple Dream' },
  { value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', label: 'Pink Sunset' },
  { value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', label: 'Ocean Blue' },
  { value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', label: 'Green Energy' },
  { value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', label: 'Warm Glow' },
  { value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', label: 'Soft Pink' },
  { value: 'linear-gradient(135deg, #000000 0%, #434343 100%)', label: 'Dark Mode' },
  { value: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', label: 'Night Sky' },
];

// Theme Presets
const THEME_PRESETS = [
  { value: 'custom', label: 'Custom', colors: { bg: '#000000', text: '#ffffff', button: '#ffffff' } },
  { value: 'agate', label: 'Agate', colors: { bg: '#2d3436', text: '#dfe6e9', button: '#00b894' } },
  { value: 'air', label: 'Air', colors: { bg: '#f8f9fa', text: '#212529', button: '#6c757d' } },
  { value: 'astrid', label: 'Astrid', colors: { bg: '#1e272e', text: '#f5f6fa', button: '#ffc048' } },
  { value: 'aura', label: 'Aura', colors: { bg: '#2c2c54', text: '#aaacb0', button: '#706fd3' } },
  { value: 'bliss', label: 'Bliss', colors: { bg: '#ffeaa7', text: '#2d3436', button: '#fdcb6e' } },
  { value: 'bloom', label: 'Bloom', colors: { bg: '#ffcccc', text: '#2d3436', button: '#ff6b81' } },
  { value: 'breeze', label: 'Breeze', colors: { bg: '#c7ecee', text: '#130f40', button: '#22a6b3' } },
  { value: 'encore', label: 'Encore', colors: { bg: '#2f3640', text: '#f5f6fa', button: '#e84118' } },
  { value: 'grove', label: 'Grove', colors: { bg: '#d4edda', text: '#155724', button: '#28a745' } },
  { value: 'haven', label: 'Haven', colors: { bg: '#e8daef', text: '#4a235a', button: '#8e44ad' } },
  { value: 'lake', label: 'Lake', colors: { bg: '#d6eaf8', text: '#1b4f72', button: '#3498db' } },
  { value: 'mineral', label: 'Mineral', colors: { bg: '#eaecee', text: '#2c3e50', button: '#7f8c8d' } },
  { value: 'twilight', label: 'Twilight', colors: { bg: '#1a1a2e', text: '#eaeaea', button: '#e94560' } },
];

// Font Options
const FONT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'inter', label: 'Inter' },
  { value: 'epilogue', label: 'Epilogue' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'playfair', label: 'Playfair Display' },
  { value: 'lora', label: 'Lora' },
];

// Pattern Presets
const PATTERN_PRESETS = [
  { value: 'dots', label: 'Dots' },
  { value: 'grid', label: 'Grid' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'waves', label: 'Waves' },
];

const POPULAR_ICONS = ['🔗', '📱', '💬', '📧', '🛒', '📍', '🎵', '📸', '🎬', '💼', '🌐', '📝'];

export default function ContactPageSettings({ tenantId, subdomain }: ContactPageSettingsProps) {
  const [links, setLinks] = useState<ContactLink[]>([]);
  const [settings, setSettings] = useState<ContactPageSettingsData>({
    // Header/Profile
    profileLayout: 'classic',
    titleStyle: 'text',
    titleSize: 'large',
    titleColor: '#ffffff',
    
    // Theme
    theme: 'custom',
    
    // Wallpaper/Background
    backgroundType: 'solid',
    backgroundValue: '#000000',
    backgroundColor: '#000000',
    
    // Text Styling
    fontFamily: 'default',
    pageTextColor: '#ffffff',
    
    // Button Styling
    buttonStyle: 'solid',
    buttonCorners: 'rounded',
    buttonShadow: 'subtle',
    buttonColor: '#ffffff',
    buttonTextColor: '#000000',
    
    // Legacy
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
    const base: React.CSSProperties = {};
    
    switch (settings.backgroundType) {
      case 'solid':
        return { backgroundColor: settings.backgroundColor || settings.backgroundValue };
      case 'gradient':
        return { background: settings.backgroundValue };
      case 'blur':
        return { 
          backgroundColor: settings.backgroundColor,
          backdropFilter: 'blur(20px)',
        };
      case 'pattern':
        return { 
          backgroundColor: settings.backgroundColor,
          backgroundImage: getPatternStyle(settings.backgroundValue),
        };
      case 'image':
        return {
          backgroundImage: `url(${settings.backgroundValue})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      case 'video':
        return { backgroundColor: settings.backgroundColor };
      default:
        return { backgroundColor: '#000000' };
    }
  };

  const getPatternStyle = (pattern: string) => {
    switch (pattern) {
      case 'dots':
        return `radial-gradient(circle, ${settings.pageTextColor}20 1px, transparent 1px)`;
      case 'grid':
        return `linear-gradient(${settings.pageTextColor}10 1px, transparent 1px), linear-gradient(90deg, ${settings.pageTextColor}10 1px, transparent 1px)`;
      case 'diagonal':
        return `repeating-linear-gradient(45deg, ${settings.pageTextColor}10 0, ${settings.pageTextColor}10 1px, transparent 0, transparent 50%)`;
      case 'waves':
        return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='0.1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`;
      default:
        return 'none';
    }
  };

  const getButtonCornerClass = () => {
    switch (settings.buttonCorners) {
      case 'pill': return 'rounded-full';
      case 'square': return 'rounded-none';
      default: return 'rounded-lg';
    }
  };

  const getButtonStyleClass = () => {
    switch (settings.buttonStyle) {
      case 'glass': return 'bg-white/10 backdrop-blur-sm border border-white/20';
      case 'outline': return 'bg-transparent border-2';
      default: return ''; // solid - uses buttonColor directly
    }
  };

  const getButtonShadowClass = () => {
    switch (settings.buttonShadow) {
      case 'subtle': return 'shadow-md';
      case 'strong': return 'shadow-xl';
      case 'hard': return 'shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]';
      default: return '';
    }
  };

  const applyTheme = (themeValue: string) => {
    const theme = THEME_PRESETS.find(t => t.value === themeValue);
    if (theme && theme.value !== 'custom') {
      setSettings(prev => ({
        ...prev,
        theme: themeValue,
        backgroundColor: theme.colors.bg,
        backgroundValue: theme.colors.bg,
        pageTextColor: theme.colors.text,
        titleColor: theme.colors.text,
        buttonColor: theme.colors.button,
        buttonTextColor: theme.colors.bg,
      }));
    } else {
      setSettings(prev => ({ ...prev, theme: 'custom' }));
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <i className='bx bx-loader-alt text-2xl animate-spin text-primary'></i>
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
          <i className='bx bx-show mr-2'></i>
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
                <i className='bx bx-plus mr-2'></i>
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
                        className="data-[state=checked]:bg-primary"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveLink(link.id, 'up')}
                        disabled={index === 0}
                      >
                        <i className='bx bx-chevron-up'></i>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveLink(link.id, 'down')}
                        disabled={index === links.length - 1}
                      >
                        <i className='bx bx-chevron-down'></i>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLink(link.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className='bx bx-trash'></i>
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
                        {uploadingProfile ? <i className='bx bx-loader-alt animate-spin'></i> : <i className='bx bx-upload mr-2'></i>}
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
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value, backgroundValue: e.target.value, theme: 'custom' }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value, backgroundValue: e.target.value, theme: 'custom' }))}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  )}

                  {settings.backgroundType === 'pattern' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Pattern Style</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {PATTERN_PRESETS.map(p => (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => setSettings(prev => ({ ...prev, backgroundValue: p.value }))}
                              className={`h-12 rounded-lg border-2 flex items-center justify-center ${
                                settings.backgroundValue === p.value ? 'border-blue-500' : 'border-gray-200'
                              }`}
                            >
                              <span className="text-xs">{p.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Base Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={settings.backgroundColor}
                            onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value, theme: 'custom' }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={settings.backgroundColor}
                            onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value, theme: 'custom' }))}
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {settings.backgroundType === 'blur' && (
                    <div className="space-y-2">
                      <Label>Base Color (with blur effect)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value, theme: 'custom' }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value, theme: 'custom' }))}
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
                        {uploadingBg ? <i className='bx bx-loader-alt animate-spin mr-2'></i> : <i className='bx bx-upload mr-2'></i>}
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

              {/* Theme Picker */}
              <Card>
                <CardHeader>
                  <CardTitle>Theme</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {THEME_PRESETS.map(theme => (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() => applyTheme(theme.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
                          settings.theme === theme.value ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ 
                          backgroundColor: theme.colors.bg, 
                          color: theme.colors.text 
                        }}
                        title={theme.label}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Profile Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Layout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Layout Style</Label>
                    <div className="flex gap-2">
                      {PROFILE_LAYOUTS.map(layout => (
                        <button
                          key={layout.value}
                          type="button"
                          onClick={() => setSettings(prev => ({ ...prev, profileLayout: layout.value as any }))}
                          className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${
                            settings.profileLayout === layout.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          <i className={`bx ${layout.icon} text-xl`}></i>
                          <span className="text-xs">{layout.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Title Size</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, titleSize: 'small' }))}
                        className={`flex-1 p-2 rounded border-2 text-sm ${settings.titleSize === 'small' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                      >
                        Small
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, titleSize: 'large' }))}
                        className={`flex-1 p-2 rounded border-2 text-sm ${settings.titleSize === 'large' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                      >
                        Large
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Title Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.titleColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, titleColor: e.target.value, theme: 'custom' }))}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={settings.titleColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, titleColor: e.target.value, theme: 'custom' }))}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Font</Label>
                    <Select
                      value={settings.fontFamily}
                      onValueChange={(v) => setSettings(prev => ({ ...prev, fontFamily: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Button Style */}
              <Card>
                <CardHeader>
                  <CardTitle>Button Style</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Style</Label>
                    <div className="flex gap-2">
                      {BUTTON_STYLES.map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setSettings(prev => ({ ...prev, buttonStyle: s.value as any }))}
                          className={`flex-1 p-2 rounded border-2 text-sm ${settings.buttonStyle === s.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Corners</Label>
                    <div className="flex gap-2">
                      {BUTTON_CORNERS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setSettings(prev => ({ ...prev, buttonCorners: c.value as any }))}
                          className={`flex-1 p-2 rounded border-2 text-sm ${settings.buttonCorners === c.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Shadow</Label>
                    <div className="flex gap-2">
                      {BUTTON_SHADOWS.map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setSettings(prev => ({ ...prev, buttonShadow: s.value as any }))}
                          className={`flex-1 p-2 rounded border-2 text-xs ${settings.buttonShadow === s.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Button Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.buttonColor}
                          onChange={(e) => setSettings(prev => ({ ...prev, buttonColor: e.target.value, theme: 'custom' }))}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={settings.buttonColor}
                          onChange={(e) => setSettings(prev => ({ ...prev, buttonColor: e.target.value, theme: 'custom' }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.buttonTextColor}
                          onChange={(e) => setSettings(prev => ({ ...prev, buttonTextColor: e.target.value, theme: 'custom' }))}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={settings.buttonTextColor}
                          onChange={(e) => setSettings(prev => ({ ...prev, buttonTextColor: e.target.value, theme: 'custom' }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Social Icons</Label>
                    <Switch
                      checked={settings.showSocialIcons}
                      onCheckedChange={(v) => setSettings(prev => ({ ...prev, showSocialIcons: v }))}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Logo</Label>
                    <Switch
                      checked={settings.showLogo}
                      onCheckedChange={(v) => setSettings(prev => ({ ...prev, showLogo: v }))}
                      className="data-[state=checked]:bg-primary"
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
                        <div className={`flex flex-col items-center gap-3 ${settings.profileLayout === 'hero' ? 'pb-6' : ''}`}>
                          {settings.profileImage ? (
                            <img
                              src={settings.profileImage}
                              alt="Profile"
                              className={`object-cover border-4 border-white/20 ${
                                settings.profileLayout === 'hero' 
                                  ? 'w-full h-32 rounded-xl' 
                                  : 'w-24 h-24 rounded-full'
                              }`}
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl">
                              👤
                            </div>
                          )}
                          {settings.pageTitle && (
                            <h1 
                              className={`font-bold ${settings.titleSize === 'large' ? 'text-2xl' : 'text-lg'}`}
                              style={{ color: settings.titleColor }}
                            >
                              {settings.pageTitle}
                            </h1>
                          )}
                          {settings.pageDescription && (
                            <p style={{ color: settings.pageTextColor }} className="opacity-80 text-sm">
                              {settings.pageDescription}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Links Preview */}
                      <div className="space-y-3">
                        {links.filter(l => l.isActive).slice(0, 5).map(link => (
                          <div
                            key={link.id}
                            className={`w-full p-4 flex items-center gap-3 transition-all ${getButtonCornerClass()} ${getButtonStyleClass()} ${getButtonShadowClass()}`}
                            style={{
                              backgroundColor: settings.buttonStyle === 'solid' ? settings.buttonColor : undefined,
                              borderColor: settings.buttonStyle === 'outline' ? settings.buttonColor : undefined,
                              color: settings.buttonTextColor,
                            }}
                          >
                            <span className="text-xl">{link.icon || '🔗'}</span>
                            <span className="flex-1 font-medium">{link.title}</span>
                            <i className='bx bx-link-external opacity-50'></i>
                          </div>
                        ))}
                        {links.filter(l => l.isActive).length === 0 && (
                          <p style={{ color: settings.pageTextColor }} className="opacity-60 text-sm">No active links yet</p>
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
              <i className='bx bx-loader-alt mr-2 animate-spin'></i>
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
