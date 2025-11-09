'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { PageLayout, Header, Section } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AIProvidersTab } from '@/components/settings/ai-providers-tab';

function AIProvidersContent() {
  const headerActions = (
    <Link href="/dashboard/settings">
      <Button variant="ghost" size="sm" className="px-2 sm:px-4">
        <ArrowLeft className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Back</span>
      </Button>
    </Link>
  );

  return (
    <PageLayout background="default">
      <Header
        title="AI Providers"
        subtitle="Configure AI models for code analysis and configuration generation"
        actions={headerActions}
      />

      <Section spacing="lg" container={false}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <AIProvidersTab />
        </div>
      </Section>
    </PageLayout>
  );
}

export default function AIProvidersPage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-muted-foreground">Loading AI providers...</div>
          </div>
        </PageLayout>
      }
    >
      <AIProvidersContent />
    </Suspense>
  );
}
