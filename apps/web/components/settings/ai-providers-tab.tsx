'use client';

import { IconWrapper } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FloatingInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  MoreHorizontal,
  Plus,
  Server,
  Sparkles,
  Star,
  TestTube,
  Trash2,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Provider configuration
const PROVIDER_INFO = {
  'claude-code': {
    name: 'Claude Agent SDK',
    icon: Brain,
    requiresApiKey: true,
    requiresBaseUrl: false,
    models: [
      'claude-sonnet-4-5-20250929',
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307',
    ],
    color: 'bg-purple-100 text-purple-700',
    borderColor: 'border-purple-200',
    description: 'Anthropic Claude Agent SDK with file system tools',
  },
  openai: {
    name: 'OpenAI',
    icon: Sparkles,
    requiresApiKey: true,
    requiresBaseUrl: false,
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    color: 'bg-green-100 text-green-700',
    borderColor: 'border-green-200',
    description: 'OpenAI GPT models',
  },
  ollama: {
    name: 'Ollama',
    icon: Server,
    requiresApiKey: false,
    requiresBaseUrl: true,
    models: ['llama3', 'codellama', 'mistral'],
    color: 'bg-gray-100 text-gray-700',
    borderColor: 'border-gray-200',
    description: 'Self-hosted Ollama models',
  },
  lmstudio: {
    name: 'LM Studio',
    icon: Server,
    requiresApiKey: false,
    requiresBaseUrl: true,
    models: [],
    color: 'bg-indigo-100 text-indigo-700',
    borderColor: 'border-indigo-200',
    description: 'Local LM Studio server',
  },
  openrouter: {
    name: 'OpenRouter',
    icon: Sparkles,
    requiresApiKey: true,
    requiresBaseUrl: false,
    models: [],
    color: 'bg-orange-100 text-orange-700',
    borderColor: 'border-orange-200',
    description: 'OpenRouter unified API for multiple AI models',
  },
} as const;

type ProviderType = keyof typeof PROVIDER_INFO;

interface AIProvider {
  id: string;
  name: string;
  provider: string; // Changed from ProviderType to match API response
  settings: string | null;
  isDefault: boolean;
  isActive: boolean;
  lastTested: string | null; // Changed from Date to string (from API)
  lastTestStatus: string | null;
  lastError: string | null;
  usageCount: number | null;
  lastUsed: string | null; // Changed from Date to string (from API)
  createdAt: string; // Changed from Date to string (from API)
  updatedAt: string;
  userId: string;
  encryptedApiKey: string | null;
}

export function AIProvidersTab() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [detailedModels, setDetailedModels] = useState<
    Array<{
      id: string;
      name: string;
      pricing: { prompt: string; completion: string };
      contextLength: number;
      isFree: boolean;
    }>
  >([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    provider: 'claude-code' as ProviderType,
    apiKey: '',
    model: 'claude-sonnet-4-5-20250929',
    baseUrl: '',
  });

  // tRPC queries and mutations
  const { data: providers = [], isLoading, refetch } = trpc.aiProviders.list.useQuery();
  const createMutation = trpc.aiProviders.create.useMutation({
    onSuccess: () => {
      toast.success('AI provider created successfully');
      refetch();
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const updateMutation = trpc.aiProviders.update.useMutation({
    onSuccess: () => {
      toast.success('AI provider updated successfully');
      refetch();
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const deleteMutation = trpc.aiProviders.delete.useMutation({
    onSuccess: () => {
      toast.success('AI provider deleted successfully');
      refetch();
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const testMutation = trpc.aiProviders.test.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      refetch();
    },
    onError: (error) => {
      toast.error(`Connection test failed: ${error.message}`);
      refetch();
    },
  });
  const testConnectionMutation = trpc.aiProviders.testConnection.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setTestStatus('success');
        setTestMessage(result.message);
        toast.success(result.message);
      } else {
        setTestStatus('error');
        setTestMessage(result.message);
        toast.error(result.message);
      }
    },
    onError: (error) => {
      setTestStatus('error');
      setTestMessage(error.message);
      toast.error(`Connection test failed: ${error.message}`);
    },
  });
  const setDefaultMutation = trpc.aiProviders.setDefault.useMutation({
    onSuccess: () => {
      toast.success('Default AI provider updated');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const { data: detailedModelsData } = trpc.aiProviders.getDetailedModels.useQuery(
    { provider: formData.provider, apiKey: formData.apiKey || undefined },
    {
      enabled:
        formData.provider === 'openrouter' &&
        (!!formData.apiKey || providers.some((p) => p.provider === 'openrouter')),
    }
  );

  // Update detailed models when data changes
  useEffect(() => {
    if (detailedModelsData) {
      setDetailedModels(detailedModelsData);
    }
  }, [detailedModelsData]);

  // Fetch detailed models when provider changes to OpenRouter
  const handleProviderChange = (value: string) => {
    setFormData({ ...formData, provider: value as ProviderType, model: '' });

    // If changing to OpenRouter, fetch detailed models
    if (value === 'openrouter') {
      // Trigger refetch of detailed models
      refetch();
    } else {
      // Clear detailed models for other providers
      setDetailedModels([]);
    }
  };

  const handleEdit = (provider: AIProvider) => {
    setSelectedProvider(provider);
    const settings = provider.settings ? JSON.parse(provider.settings) : {};
    setFormData({
      name: provider.name,
      provider: provider.provider as ProviderType,
      apiKey: '',
      model: settings.model || '',
      baseUrl: settings.baseUrl || '',
    });
    setShowEditDialog(true);
  };

  interface ProviderSerializedSettings {
    model?: string;
    baseUrl?: string;
  }

  interface ProviderUpdatePayload {
    id: string;
    name: string;
    settings: {
      model: string;
      baseUrl?: string;
    };
    apiKey?: string;
  }

  const handleDelete = (provider: AIProvider) => {
    setSelectedProvider(provider);
    setShowDeleteDialog(true);
  };

  const handleTest = (providerId: string) => {
    testMutation.mutate({ id: providerId });
  };

  const handleSetDefault = (providerId: string) => {
    setDefaultMutation.mutate({ id: providerId });
  };

  const getProviderIcon = (providerType: string) => {
    const info = PROVIDER_INFO[providerType as ProviderType];
    if (!info) return <Zap className="h-5 w-5" />; // Fallback
    const Icon = info.icon;
    return <Icon className="h-5 w-5" />;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'claude-code',
      apiKey: '',
      model: 'claude-sonnet-4-5-20250929',
      baseUrl: '',
    });
    setShowApiKey(false);
    setTestStatus('idle');
    setTestMessage('');
  };

  const handleTestConnection = () => {
    const providerInfo = PROVIDER_INFO[formData.provider];

    // Validation before testing
    if (providerInfo.requiresApiKey && !formData.apiKey) {
      toast.error('API key is required to test connection');
      return;
    }

    if (providerInfo.requiresBaseUrl && !formData.baseUrl) {
      toast.error('Base URL is required to test connection');
      return;
    }

    if (!formData.model) {
      toast.error('Model selection is required to test connection');
      return;
    }

    // Set testing state
    setTestStatus('testing');
    setTestMessage('Testing connection...');

    // Run the test
    testConnectionMutation.mutate({
      provider: formData.provider,
      apiKey: formData.apiKey || undefined,
      settings: {
        model: formData.model,
        baseUrl: formData.baseUrl || undefined,
      },
    });
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleCreate = () => {
    const providerInfo = PROVIDER_INFO[formData.provider];

    // Validation
    if (!formData.name) {
      toast.error('Provider name is required');
      return;
    }

    if (providerInfo.requiresApiKey && !formData.apiKey) {
      toast.error('API key is required for this provider');
      return;
    }

    if (providerInfo.requiresBaseUrl && !formData.baseUrl) {
      toast.error('Base URL is required for this provider');
      return;
    }

    if (!formData.model) {
      toast.error('Model selection is required');
      return;
    }

    createMutation.mutate({
      name: formData.name,
      provider: formData.provider,
      apiKey: formData.apiKey || undefined,
      settings: {
        model: formData.model,
        baseUrl: formData.baseUrl || undefined,
      },
      isDefault: providers.length === 0, // First provider is default
    });
  };

  const handleUpdate = () => {
    if (!selectedProvider) return;

    const updateData: ProviderUpdatePayload = {
      id: selectedProvider.id,
      name: formData.name,
      settings: {
        model: formData.model,
        baseUrl: formData.baseUrl || undefined,
      },
    };

    // Only include API key if it was changed
    if (formData.apiKey) {
      updateData.apiKey = formData.apiKey;
    }

    updateMutation.mutate(updateData);
  };

  const handleDeleteConfirm = () => {
    if (!selectedProvider) return;
    deleteMutation.mutate({ id: selectedProvider.id });
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="border-ocean-200 bg-gradient-to-r from-ocean-50/50 to-blue-50/50">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-ocean-100 rounded-lg">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-ocean-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg">
                AI-Powered Analysis
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 mb-3">
                Configure AI providers to automatically analyze projects, detect frameworks, and
                generate deployment configurations.
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-700">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  <span>Encrypted credentials (AES-256-GCM)</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  <span>Multiple provider support</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  <span>Connection testing</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Provider Button */}
      <div className="flex justify-end">
        <Button onClick={handleOpenAddDialog} size="sm" className="px-2 sm:px-4">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Provider</span>
        </Button>
      </div>

      {/* Providers Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 sm:p-16 text-center">
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin mx-auto mb-4 text-ocean-500" />
            <p className="text-gray-600 text-sm sm:text-base">Loading AI providers...</p>
          </CardContent>
        </Card>
      ) : providers.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-6 sm:p-16 text-center">
            <IconWrapper variant="default" size="xl" className="mx-auto mb-4">
              <Zap className="h-8 w-8 sm:h-12 sm:w-12" />
            </IconWrapper>
            <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">
              No AI Providers Configured
            </h3>
            <p className="text-xs sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
              Add your first AI provider to enable automatic project analysis and configuration
              generation.
            </p>
            <Button size="lg" onClick={handleOpenAddDialog} className="px-3 sm:px-6">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="text-sm sm:text-base">Add Provider</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {providers.map((provider) => {
            const info = PROVIDER_INFO[provider.provider as ProviderType];
            const settings: ProviderSerializedSettings = provider.settings
              ? JSON.parse(provider.settings)
              : {};

            return (
              <Card
                key={provider.id}
                className={`hover:shadow-elegant transition-all ${
                  provider.isDefault ? 'border-ocean-300 ring-2 ring-ocean-100' : ''
                }`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <IconWrapper variant="default" size="md" className="flex-shrink-0 mt-0.5">
                          {getProviderIcon(provider.provider)}
                        </IconWrapper>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                              {provider.name}
                            </h4>
                            {provider.isDefault && (
                              <Badge
                                variant="secondary"
                                className="bg-ocean-100 text-ocean-700 flex-shrink-0 text-[0.6rem] sm:text-xs"
                              >
                                <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 fill-ocean-600" />
                                Default
                              </Badge>
                            )}
                            {provider.lastTestStatus === 'success' ? (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 flex-shrink-0 text-[0.6rem] sm:text-xs"
                              >
                                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                Connected
                              </Badge>
                            ) : provider.lastTestStatus === 'failed' ? (
                              <Badge
                                variant="destructive"
                                className="flex-shrink-0 text-[0.6rem] sm:text-xs"
                              >
                                <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                Error
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600">{info.description}</p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="flex-shrink-0 h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 sm:w-48">
                          {!provider.isDefault && (
                            <>
                              <DropdownMenuItem onClick={() => handleSetDefault(provider.id)}>
                                <Star className="h-4 w-4 mr-2" />
                                Set as Default
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleTest(provider.id)}>
                            <TestTube className="h-4 w-4 mr-2" />
                            Test Connection
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(provider)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(provider)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Error Message */}
                    {provider.lastError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-red-600">{provider.lastError}</p>
                      </div>
                    )}

                    {/* Provider Details */}
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Model</span>
                        <Badge
                          variant="secondary"
                          className={`${info.color} text-[0.6rem] sm:text-xs`}
                        >
                          {settings.model || 'Not set'}
                        </Badge>
                      </div>
                      {settings.baseUrl && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Base URL</span>
                          <span className="text-gray-900 font-mono text-[0.6rem] sm:text-xs truncate max-w-[100px] sm:max-w-[120px]">
                            {settings.baseUrl}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">API Key</span>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-900 font-mono text-[0.6rem] sm:text-xs">
                            {info.requiresApiKey ? '••••••••' : 'Not required'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-[0.6rem] sm:text-xs text-gray-500 mb-1">Used</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">
                          {provider.usageCount || 0}x
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.6rem] sm:text-xs text-gray-500 mb-1">Status</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">
                          {provider.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.6rem] sm:text-xs text-gray-500 mb-1">Last Tested</p>
                        <p className="text-[0.6rem] sm:text-sm font-semibold text-gray-900">
                          {provider.lastTested ? 'Just now' : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Provider Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add AI Provider</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Configure a new AI provider for project analysis and configuration generation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 sm:space-y-6 py-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider-type" className="text-sm">
                Provider
              </Label>
              <Select value={formData.provider} onValueChange={handleProviderChange}>
                <SelectTrigger id="provider-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`${info.color} text-[0.6rem] sm:text-xs`}
                        >
                          {info.name}
                        </Badge>
                        <span className="text-[0.6rem] sm:text-xs text-gray-500">
                          {info.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Provider Name */}
            <div className="space-y-2">
              <FloatingInput
                label="Provider Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                leftIcon={<Zap className="h-4 w-4" />}
              />
              <p className="text-[0.6rem] sm:text-xs text-gray-500">
                A friendly name to identify this provider (e.g., &quot;Production OpenAI&quot;,
                &quot;Dev Claude&quot;)
              </p>
            </div>

            {/* API Key (if required) */}
            {PROVIDER_INFO[formData.provider].requiresApiKey && (
              <div className="space-y-2">
                <FloatingInput
                  label="API Key"
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="cursor-pointer"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                <p className="text-[0.6rem] sm:text-xs text-gray-500">
                  Your API key will be encrypted with AES-256-GCM
                </p>
              </div>
            )}

            {/* Base URL (for Ollama/LM Studio) */}
            {PROVIDER_INFO[formData.provider].requiresBaseUrl && (
              <div className="space-y-2">
                <FloatingInput
                  label="Base URL"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  leftIcon={<Server className="h-4 w-4" />}
                />
                <p className="text-[0.6rem] sm:text-xs text-gray-500">
                  Server URL (e.g., http://localhost:11434 for Ollama)
                </p>
              </div>
            )}

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm">
                Model
              </Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData({ ...formData, model: value })}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {/* Use detailed models for OpenRouter, otherwise use default models */}
                  {formData.provider === 'openrouter' && detailedModels.length > 0
                    ? detailedModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex flex-wrap items-center justify-between w-full gap-2">
                            <span className="truncate text-xs sm:text-sm">{model.name}</span>
                            <Badge
                              variant="secondary"
                              className={`ml-2 text-[0.6rem] sm:text-xs ${model.isFree ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            >
                              {model.isFree ? 'Free' : 'Paid'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    : PROVIDER_INFO[formData.provider].models.map((model) => (
                        <SelectItem key={model} value={model}>
                          <span className="text-xs sm:text-sm">{model}</span>
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            {/* Test Connection Button */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testConnectionMutation.isPending}
                className="w-full"
                size="sm"
              >
                {testConnectionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="text-xs sm:text-sm">Testing Connection...</span>
                  </>
                ) : testStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-xs sm:text-sm">Test Connection</span>
                  </>
                ) : testStatus === 'error' ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                    <span className="text-xs sm:text-sm">Test Connection</span>
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Test Connection</span>
                  </>
                )}
              </Button>

              {/* Test Status Feedback */}
              {testStatus !== 'idle' && testMessage && (
                <div
                  className={`p-3 rounded-lg border ${
                    testStatus === 'success'
                      ? 'bg-green-50 border-green-200'
                      : testStatus === 'error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testStatus === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : testStatus === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-blue-600 mt-0.5 animate-spin flex-shrink-0" />
                    )}
                    <p
                      className={`text-xs sm:text-sm ${
                        testStatus === 'success'
                          ? 'text-green-700'
                          : testStatus === 'error'
                            ? 'text-red-700'
                            : 'text-blue-700'
                      }`}
                    >
                      {testMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Security Info */}
            <div className="p-3 sm:p-4 bg-ocean-50 border border-ocean-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-ocean-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">
                    Secure Storage
                  </h4>
                  <p className="text-[0.6rem] sm:text-sm text-gray-700">
                    All API keys are encrypted with your master encryption key (AES-256-GCM) before
                    storage. No credentials are ever stored in plaintext.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={createMutation.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-xs sm:text-sm">Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Add Provider</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Provider Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit AI Provider</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update your AI provider configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 sm:space-y-6 py-4">
            {/* Provider Name */}
            <div className="space-y-2">
              <FloatingInput
                label="Provider Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                leftIcon={<Zap className="h-4 w-4" />}
              />
            </div>

            {/* API Key (if required) */}
            {PROVIDER_INFO[formData.provider].requiresApiKey && (
              <div className="space-y-2">
                <FloatingInput
                  label="API Key (leave empty to keep current)"
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="cursor-pointer"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                <p className="text-[0.6rem] sm:text-xs text-gray-500">
                  Leave empty to keep the existing API key
                </p>
              </div>
            )}

            {/* Base URL (for Ollama/LM Studio) */}
            {PROVIDER_INFO[formData.provider].requiresBaseUrl && (
              <div className="space-y-2">
                <FloatingInput
                  label="Base URL"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  leftIcon={<Server className="h-4 w-4" />}
                />
              </div>
            )}

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="edit-model" className="text-sm">
                Model
              </Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData({ ...formData, model: value })}
              >
                <SelectTrigger id="edit-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Use detailed models for OpenRouter, otherwise use default models */}
                  {formData.provider === 'openrouter' && detailedModels.length > 0
                    ? detailedModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex flex-wrap items-center justify-between w-full gap-2">
                            <span className="truncate text-xs sm:text-sm">{model.name}</span>
                            <Badge
                              variant="secondary"
                              className={`ml-2 text-[0.6rem] sm:text-xs ${model.isFree ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            >
                              {model.isFree ? 'Free' : 'Paid'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    : PROVIDER_INFO[formData.provider].models.map((model) => (
                        <SelectItem key={model} value={model}>
                          <span className="text-xs sm:text-sm">{model}</span>
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-xs sm:text-sm">Saving...</span>
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Save Changes</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Delete AI Provider</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete this AI provider?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">
                    This action cannot be undone
                  </h4>
                  <p className="text-[0.6rem] sm:text-sm text-gray-700">
                    Deleting <strong>{selectedProvider?.name}</strong> will remove all associated
                    configuration and credentials. Projects using this provider may fail analysis.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="text-xs sm:text-sm">Delete Provider</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
