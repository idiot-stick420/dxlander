'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { PageLayout, Header, Section } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  FileCode,
  Download,
  Rocket,
  Loader2,
  AlertCircle,
  Package,
  Key,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import {
  VariablesTab,
  FilesTab,
  OverviewTab,
  DependenciesTab,
  IntegrationsTab,
  DeploymentTab,
} from '@/components/configuration';

// Import types for proper typing
type EnvironmentVariables = {
  required?: Array<{
    key: string;
    description: string;
    example?: string;
    integration?: string;
  }>;
  optional?: Array<{
    key: string;
    description: string;
    example?: string;
    integration?: string;
  }>;
};

type ConfigFileEntry = {
  fileName: string;
  path?: string;
  content?: string;
};

interface PageProps {
  params: Promise<{ id: string; configId: string }>;
}

export default function ConfigurationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = trpc.projects.get.useQuery({
    id: resolvedParams.id,
  });

  const {
    data: configSet,
    isLoading: configLoading,
    error: configError,
    refetch,
  } = trpc.configs.get.useQuery({
    id: resolvedParams.configId,
  });

  // Mutations for updating config data
  const updateMetadataMutation = trpc.configs.updateMetadata.useMutation();
  const updateFileMutation = trpc.configs.updateFile.useMutation();

  // Poll for updates while generating
  useEffect(() => {
    if (configSet?.status === 'generating') {
      const interval = setInterval(() => {
        refetch();
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [configSet?.status, refetch]);

  const isLoading = projectLoading || configLoading;

  // Utility functions
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <PageLayout background="default">
        <Section spacing="lg">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-ocean-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading configuration...</p>
            </div>
          </div>
        </Section>
      </PageLayout>
    );
  }

  if (projectError || configError || !project || !configSet) {
    return (
      <PageLayout background="default">
        <Section spacing="lg">
          <Card className="border-red-200">
            <CardContent className="p-16 text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {!project ? 'Project Not Found' : 'Configuration Not Found'}
              </h3>
              <p className="text-gray-600 mb-8">
                {!project
                  ? "The project you're looking for doesn't exist or you don't have access to it."
                  : "This configuration doesn't exist or has been deleted."}
              </p>
              <Link href={!project ? '/dashboard' : `/project/${resolvedParams.id}/configs`}>
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {!project ? 'Back to Dashboard' : 'Back to Configurations'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </Section>
      </PageLayout>
    );
  }

  // Handlers for component callbacks
  const handleSaveVariables = async (variables: EnvironmentVariables) => {
    if (!summary) return;
    const updatedMetadata = { ...summary, environmentVariables: variables };
    await updateMetadataMutation.mutateAsync({
      configId: resolvedParams.configId,
      metadata: updatedMetadata,
    });
    await refetch();
  };

  const handleSaveFile = async (fileName: string, content: string) => {
    await updateFileMutation.mutateAsync({
      configId: resolvedParams.configId,
      fileName,
      content,
    });
    await refetch();
  };

  // Parse summary from config metadata
  let summary: Record<string, unknown> | null = null;
  try {
    if (configSet?.metadata && typeof configSet.metadata === 'string') {
      summary = JSON.parse(configSet.metadata);
    } else if (configSet?.metadata && typeof configSet.metadata === 'object') {
      summary = configSet.metadata as Record<string, unknown>;
    }
  } catch (e) {
    console.error('Failed to parse config metadata:', e);
  }

  const headerActions = (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link href={`/project/${resolvedParams.id}/configs`}>
        <Button variant="ghost" size="sm" className="px-2 sm:px-4">
          <ArrowLeft className="h-4 w-4 mr-0 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </Link>
      <Button variant="outline" size="sm" className="px-2 sm:px-4">
        <Download className="h-4 w-4 mr-0 sm:mr-2" />
        <span className="hidden sm:inline">Download</span>
      </Button>
      <Button size="sm" className="bg-gradient-to-r from-ocean-600 to-ocean-500 px-2 sm:px-4">
        <Rocket className="h-4 w-4 mr-0 sm:mr-2" />
        <span className="hidden sm:inline">Deploy</span>
      </Button>
    </div>
  );

  // Count environment variables
  const environmentVariables = summary?.environmentVariables as EnvironmentVariables | undefined;
  const requiredEnvCount = environmentVariables?.required?.length || 0;
  const optionalEnvCount = environmentVariables?.optional?.length || 0;
  const totalEnvCount = requiredEnvCount + optionalEnvCount;

  // Count integrations
  const integrations = summary?.integrations as { detected?: unknown[] } | undefined;
  const integrationsCount = integrations?.detected?.length || 0;

  // Count config files (excluding summary)
  const configFiles = Array.isArray(configSet.files) ? (configSet.files as ConfigFileEntry[]) : [];
  const configFilesCount = configFiles.filter((file) => file.fileName !== '_summary.json').length;

  return (
    <PageLayout background="default">
      <Header
        title={`${configSet.type.charAt(0).toUpperCase() + configSet.type.slice(1)} Configuration`}
        subtitle={`${project.name} • v${configSet.version} • Created ${formatDate(configSet.createdAt)}`}
        badge={configSet.status}
        actions={headerActions}
        className="py-2 sm:py-4"
      />

      <Section spacing="lg" container={false}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Generating State Banner */}
          {configSet.status === 'generating' && (
            <Card className="border-ocean-200 bg-ocean-50 mb-6">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-ocean-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                      Generating Configuration...
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      AI is analyzing your project and creating deployment files. This usually takes
                      30-60 seconds.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex w-full sm:w-max min-w-full sm:min-w-0 space-x-1 h-full overflow-x-auto py-1.5 sm:py-2">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="dependencies"
                className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">Dependencies</span>
                {(() => {
                  const deps = summary?.dependencies as { totalCount?: number } | undefined;
                  return (
                    deps && (
                      <Badge
                        variant="secondary"
                        className="ml-1 bg-purple-100 text-purple-700 text-[0.6rem] sm:text-xs px-1 sm:px-2 py-0 sm:py-0.5"
                      >
                        {deps.totalCount || 0}
                      </Badge>
                    )
                  );
                })()}
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">Files</span>
                {configFilesCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-ocean-100 text-ocean-700 text-[0.6rem] sm:text-xs px-1 sm:px-2 py-0 sm:py-0.5"
                  >
                    {configFilesCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="env"
                className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">Variables</span>
                {totalEnvCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-green-100 text-green-700 text-[0.6rem] sm:text-xs px-1 sm:px-2 py-0 sm:py-0.5"
                  >
                    {totalEnvCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="integrations"
                className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">Integrations</span>
                {integrationsCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-blue-100 text-blue-700 text-[0.6rem] sm:text-xs px-1 sm:px-2 py-0 sm:py-0.5"
                  >
                    {integrationsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="deployment"
                className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">Deployment</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <OverviewTab
                summary={summary}
                configFilesCount={configFilesCount}
                totalEnvCount={totalEnvCount}
                requiredEnvCount={requiredEnvCount}
                integrationsCount={integrationsCount}
              />
            </TabsContent>

            {/* Dependencies Tab */}
            <TabsContent value="dependencies" className="space-y-6">
              <DependenciesTab summary={summary} />
            </TabsContent>

            {/* Configuration Files Tab */}
            <TabsContent value="files" className="space-y-6">
              <FilesTab files={configSet?.files || []} onSaveFile={handleSaveFile} />
            </TabsContent>

            {/* Environment Variables Tab */}
            <TabsContent value="env" className="space-y-6">
              <VariablesTab
                environmentVariables={environmentVariables}
                onSave={handleSaveVariables}
              />
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="space-y-6">
              <IntegrationsTab summary={summary} integrationsCount={integrationsCount} />
            </TabsContent>

            {/* Deployment Instructions Tab */}
            <TabsContent value="deployment" className="space-y-6">
              <DeploymentTab summary={summary} />
            </TabsContent>
          </Tabs>
        </div>
      </Section>
    </PageLayout>
  );
}
