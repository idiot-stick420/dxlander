'use client';

import { IconWrapper } from '@/components/common';
import { Header, PageLayout, Section } from '@/components/layouts';
import {
  DeleteProjectDialog,
  type DeleteProjectDialogProps,
} from '@/components/projects/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  Code,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  FileText,
  FolderOpen,
  GitBranch,
  Key,
  Link2,
  MoreHorizontal,
  Plus,
  Rocket,
  Search,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Extended project type to include all properties used in the dashboard
type Project = DeleteProjectDialogProps['project'] & {
  framework?: string | null;
  language?: string | null;
  generatedConfigs?: Record<string, unknown> | null;
  lastActivity?: string | null;
  localPath?: string | null;
  sourceBranch?: string | null;
  deployUrl?: string | null;
  sourceHash?: string;
  sourceType?: string;
  sourceUrl?: string | null;
  userId?: string;
  updatedAt?: string;
  projectSize?: number | null;
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Fetch real projects from API (skeleton shown while isLoading is true)
  const { data, isLoading } = trpc.projects.list.useQuery({
    page: 1,
    limit: 50,
  });

  const projects = data?.projects || [];

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      imported: {
        icon: <FolderOpen className="h-4 w-4" />,
        variant: 'secondary' as const,
        label: 'Imported',
        color: 'text-blue-600 bg-blue-100',
      },
      discovering: {
        icon: <Clock className="h-4 w-4 animate-pulse" />,
        variant: 'secondary' as const,
        label: 'Discovering...',
        color: 'text-ocean-600 bg-ocean-100',
      },
      // Support both 'analyzing' and 'discovering' for backward compatibility
      analyzing: {
        icon: <Clock className="h-4 w-4 animate-pulse" />,
        variant: 'secondary' as const,
        label: 'Discovering...',
        color: 'text-ocean-600 bg-ocean-100',
      },
      discovered: {
        icon: <CheckCircle2 className="h-4 w-4" />,
        variant: 'secondary' as const,
        label: 'Discovered',
        color: 'text-green-600 bg-green-100',
      },
      // Support both 'analyzed' and 'discovered' for backward compatibility
      analyzed: {
        icon: <CheckCircle2 className="h-4 w-4" />,
        variant: 'secondary' as const,
        label: 'Discovered',
        color: 'text-green-600 bg-green-100',
      },
      configured: {
        icon: <FileText className="h-4 w-4" />,
        variant: 'secondary' as const,
        label: 'Configured',
        color: 'text-purple-600 bg-purple-100',
      },
      deployed: {
        icon: <Rocket className="h-4 w-4" />,
        variant: 'default' as const,
        label: 'Deployed',
        color: 'text-indigo-600 bg-indigo-100',
      },
      failed: {
        icon: <AlertCircle className="h-4 w-4" />,
        variant: 'destructive' as const,
        label: 'Failed',
        color: 'text-red-600 bg-red-100',
      },
    };
    return configs[status as keyof typeof configs] || configs.imported;
  };

  // Helper function to format time
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };

  const filteredProjects = projects.filter((project: Project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.framework && project.framework.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.language && project.language.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'imported') return matchesSearch && project.status === 'imported';
    // Configured means has at least one build configuration
    if (activeTab === 'configured') return matchesSearch && project.status === 'configured';
    // Deployed means has at least one active deployment
    if (activeTab === 'deployed') return matchesSearch && project.status === 'deployed';
    return matchesSearch;
  });

  const stats = {
    all: projects.length,
    imported: projects.filter((p: Project) => p.status === 'imported').length,
    configured: projects.filter((p: Project) => p.status === 'configured').length,
    deployed: projects.filter((p: Project) => p.status === 'deployed').length,
  };

  const headerActions = (
    <div className="flex items-center space-x-2 sm:space-x-3">
      <Link href="/dashboard/integrations">
        <Button variant="ghost" size="sm" className="px-2 sm:px-3">
          <Key className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Integrations</span>
        </Button>
      </Link>
      <Link href="/dashboard/settings">
        <Button variant="ghost" size="sm" className="px-2 sm:px-3">
          <Settings className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </Link>
    </div>
  );

  return (
    <>
      <PageLayout background="default">
        <Header
          title="Projects"
          subtitle="Import, analyze, and deploy your applications"
          actions={headerActions}
        />

        <Section spacing="lg" container={false}>
          <div className="max-w-[100%] mx-auto px-4 sm:px-6 space-y-6">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Link href="/dashboard/import" className="flex-shrink-0">
                <Button className="shadow-elegant w-full sm:w-auto" aria-label="Import project">
                  {/* Desktop / tablet: show icon + text */}
                  <span className="hidden sm:inline-flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    Import Project
                  </span>

                  {/* Mobile: show icon only */}
                  <span className="inline-flex sm:hidden items-center justify-center">
                    <Plus className="h-5 w-5" />
                  </span>
                </Button>
              </Link>

              <div className="relative flex-1 max-w-[100%] sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Tabs with counts */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-2 sm:flex sm:w-fit space-x-1 h-full">
                <TabsTrigger value="all" className="relative text-xs sm:text-sm whitespace-nowrap">
                  <span className="truncate">All Projects</span>
                  {stats.all > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-gray-200 text-gray-700 text-xs">
                      {stats.all}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="imported" className="text-xs sm:text-sm whitespace-nowrap">
                  <span className="truncate">Imported</span>
                  {stats.imported > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 text-xs">
                      {stats.imported}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="configured" className="text-xs sm:text-sm whitespace-nowrap">
                  <span className="truncate">Configured</span>
                  {stats.configured > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 bg-purple-100 text-purple-700 text-xs"
                    >
                      {stats.configured}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="deployed" className="text-xs sm:text-sm whitespace-nowrap">
                  <span className="truncate">Deployed</span>
                  {stats.deployed > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 bg-indigo-100 text-indigo-700 text-xs"
                    >
                      {stats.deployed}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {isLoading ? (
                  <div className="space-y-6">
                    {/* Top bar skeleton */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <Skeleton className="h-10 w-full sm:w-40" /> {/* Import Project button */}
                      <Skeleton className="h-10 w-full sm:w-96" /> {/* Search bar */}
                    </div>

                    {/* Tabs skeleton */}
                    <div className="flex w-full overflow-x-auto">
                      <div className="flex space-x-1 min-w-full sm:min-w-0">
                        <Skeleton className="h-10 w-24 flex-shrink-0" />
                        <Skeleton className="h-10 w-24 flex-shrink-0" />
                        <Skeleton className="h-10 w-24 flex-shrink-0" />
                        <Skeleton className="h-10 w-24 flex-shrink-0" />
                      </div>
                    </div>

                    {/* Project cards skeleton */}
                    <div className="grid grid-cols-1 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i} className="border shadow-sm">
                          <CardContent className="p-4 sm:p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="space-y-3 flex-1 w-full">
                                <Skeleton className="h-5 w-1/3" /> {/* Project title */}
                                <Skeleton className="h-4 w-1/4" /> {/* Status */}
                                <Skeleton className="h-4 w-1/2" /> {/* Framework info */}
                                <Skeleton className="h-4 w-2/3" /> {/* URL or source */}
                              </div>
                              <Skeleton className="h-8 w-20" /> {/* Button */}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <Card className="border-dashed border-2">
                    <CardContent className="p-4 sm:p-16 text-center">
                      <IconWrapper variant="default" size="xl" className="mx-auto mb-4">
                        <FolderOpen className="h-12 w-12" />
                      </IconWrapper>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                        {searchQuery ? 'No projects found' : 'No projects yet'}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
                        {searchQuery
                          ? 'Try adjusting your search or import a new project'
                          : 'Import your first project. AI will analyze it and generate deployment configurations automatically.'}
                      </p>
                      <Link href="/dashboard/import">
                        <Button size="lg" className="px-4 sm:px-6">
                          <span className="hidden sm:inline-flex items-center">
                            <Plus className="h-5 w-5 mr-2" />
                            Import First Project
                          </span>

                          <span className="inline-flex sm:hidden items-center justify-center">
                            <Plus className="h-5 w-5" />
                          </span>
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredProjects.map((project) => {
                      const statusConfig = getStatusConfig(project.status);

                      return (
                        <Link key={project.id} href={`/project/${project.id}`}>
                          <Card className="hover:shadow-elegant transition-all hover:border-ocean-300 group cursor-pointer">
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                {/* Project Info */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center space-x-0 sm:space-x-4 flex-1 min-w-0 w-full">
                                  <IconWrapper
                                    variant="default"
                                    size="md"
                                    className="flex-shrink-0 mb-3 sm:mb-0"
                                  >
                                    <Zap className="h-5 w-5" />
                                  </IconWrapper>

                                  <div className="flex-1 min-w-0 space-y-3 w-full">
                                    {/* Title & Status */}
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="font-semibold text-gray-900 text-base sm:text-lg">
                                        {project.name}
                                      </h4>
                                      <Badge
                                        variant={statusConfig.variant}
                                        className={`${statusConfig.color} flex items-center gap-1.5 text-xs sm:text-sm`}
                                      >
                                        {statusConfig.icon}
                                        {statusConfig.label}
                                      </Badge>
                                    </div>

                                    {/* Framework & Source */}
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                      <span className="flex items-center gap-1.5">
                                        <Code className="h-3.5 w-3.5" />
                                        {project.language || 'Unknown'}
                                      </span>
                                      {project.sourceType && (
                                        <span className="flex items-center gap-1.5">
                                          {project.sourceType === 'github' && (
                                            <GitBranch className="h-3.5 w-3.5" />
                                          )}
                                          {project.sourceType === 'zip' && (
                                            <Archive className="h-3.5 w-3.5" />
                                          )}
                                          {project.sourceType === 'git' && (
                                            <Link2 className="h-3.5 w-3.5" />
                                          )}
                                          {project.sourceType.charAt(0).toUpperCase() +
                                            project.sourceType.slice(1)}
                                        </span>
                                      )}
                                      <span className="text-gray-400">•</span>
                                      <span>
                                        {formatDate(project.updatedAt || project.createdAt)}
                                      </span>
                                    </div>

                                    {/* Source URL - Conditional rendering based on source type */}
                                    {project.sourceUrl && (
                                      <div className="flex flex-wrap items-center gap-2 text-sm">
                                        {project.sourceType === 'zip' ? (
                                          <>
                                            <Archive className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-600 truncate">
                                              {project.sourceUrl}
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <ExternalLink className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                            <span
                                              className="text-ocean-600 hover:text-ocean-700 hover:underline truncate cursor-pointer"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(project.sourceUrl!, '_blank');
                                              }}
                                            >
                                              {project.sourceUrl}
                                            </span>
                                          </>
                                        )}
                                        {project.sourceBranch && (
                                          <Badge variant="secondary" className="text-xs">
                                            {project.sourceBranch}
                                          </Badge>
                                        )}
                                      </div>
                                    )}

                                    {/* Generated Configs */}
                                    {(project as Project).generatedConfigs &&
                                      Object.keys((project as Project).generatedConfigs || {})
                                        .length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                          <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                          {Object.keys(
                                            (project as Project).generatedConfigs || {}
                                          ).map((file: string, idx: number) => (
                                            <Badge
                                              key={idx}
                                              variant="secondary"
                                              className="text-xs bg-gray-100 text-gray-700"
                                            >
                                              {file}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}

                                    {/* Deploy URL */}
                                    {project.deployUrl && (
                                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                                        <ExternalLink className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                        <span
                                          className="text-sm text-ocean-600 hover:text-ocean-700 hover:underline flex-1 truncate cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(project.deployUrl!, '_blank');
                                          }}
                                        >
                                          {project.deployUrl}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div
                                  className="flex items-center justify-items-end gap-0 flex-shrink-0 w-full sm:w-auto"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex flex-row sm:flex-col gap-2 sm:gap-0 w-full sm:w-auto">
                                    {project.status === 'imported' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="px-3 sm:px-4 w-full sm:w-auto"
                                      >
                                        <span className="hidden sm:inline-flex items-center gap-2">
                                          <Eye className="h-4 w-4" />
                                          View
                                        </span>
                                        <span className="sm:hidden">
                                          <Eye className="h-4 w-4" />
                                        </span>
                                      </Button>
                                    )}
                                    {project.status === 'configured' && (
                                      <div className="flex gap-2 sm:gap-0 w-full">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="px-3 sm:px-4 w-1/2 sm:w-auto"
                                        >
                                          <span className="hidden sm:inline-flex items-center gap-2">
                                            <FileCode className="h-4 w-4" />
                                            Config
                                          </span>
                                          <span className="sm:hidden">
                                            <FileCode className="h-4 w-4" />
                                          </span>
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="bg-purple-600 hover:bg-purple-700 px-3 sm:px-4 w-1/2 sm:w-auto sm:ml-2"
                                        >
                                          <span className="hidden sm:inline-flex items-center gap-2">
                                            <Rocket className="h-4 w-4" />
                                            Deploy
                                          </span>
                                          <span className="sm:hidden">
                                            <Rocket className="h-4 w-4" />
                                          </span>
                                        </Button>
                                      </div>
                                    )}
                                    {project.status === 'deployed' && (
                                      <div className="flex gap-2 sm:gap-0 w-full">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="px-3 sm:px-4 w-1/2 sm:w-auto"
                                        >
                                          <span className="hidden sm:inline-flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            View
                                          </span>
                                          <span className="sm:hidden">
                                            <Eye className="h-4 w-4" />
                                          </span>
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="px-3 sm:px-4 w-1/2 sm:w-auto sm:ml-2"
                                        >
                                          <span className="hidden sm:inline-flex items-center gap-2">
                                            <Download className="h-4 w-4" />
                                            Config
                                          </span>
                                          <span className="sm:hidden">
                                            <Download className="h-4 w-4" />
                                          </span>
                                        </Button>
                                      </div>
                                    )}

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="w-1/2 sm:w-auto"
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem>
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Details
                                        </DropdownMenuItem>
                                        {project.status === 'configured' && (
                                          <>
                                            <DropdownMenuItem>
                                              <FileCode className="h-4 w-4 mr-2" />
                                              Configurations
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                              <Download className="h-4 w-4 mr-2" />
                                              Download Configs
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => handleDeleteClick(project)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete Project
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </Section>
      </PageLayout>

      {/* Delete Project Dialog */}
      {projectToDelete && (
        <DeleteProjectDialog
          project={projectToDelete}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        />
      )}
    </>
  );
}
