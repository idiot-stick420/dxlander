'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { PageLayout, Header, Section } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Database,
  RefreshCw,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  HardDrive,
  Shield,
} from 'lucide-react';

function BackupContent() {
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  const headerActions = (
    <div className="flex flex-col sm:flex-row items-center gap-2">
      <Link href="/dashboard/settings">
        <Button variant="ghost" size="sm" className="px-2 sm:px-4">
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </Link>
      <Button size="sm" className="px-2 sm:px-4">
        <Database className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Create Backup</span>
      </Button>
    </div>
  );

  const backups = [
    {
      id: '1',
      name: 'Automatic Backup',
      date: '2 hours ago',
      size: '2.4 MB',
      type: 'auto',
      status: 'success',
    },
    {
      id: '2',
      name: 'Manual Backup - Pre-update',
      date: '1 day ago',
      size: '2.3 MB',
      type: 'manual',
      status: 'success',
    },
    {
      id: '3',
      name: 'Automatic Backup',
      date: '1 day ago',
      size: '2.3 MB',
      type: 'auto',
      status: 'success',
    },
    {
      id: '4',
      name: 'Automatic Backup',
      date: '2 days ago',
      size: '2.2 MB',
      type: 'auto',
      status: 'success',
    },
    {
      id: '5',
      name: 'Manual Backup - Initial setup',
      date: '5 days ago',
      size: '1.8 MB',
      type: 'manual',
      status: 'success',
    },
  ];

  return (
    <PageLayout background="default">
      <Header
        title="Backup & Restore"
        subtitle="Manage database backups and restore points"
        actions={headerActions}
      />

      <Section spacing="lg" container={false}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Backup Status Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last Backup</p>
                    <p className="text-lg font-bold text-gray-900">2 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <HardDrive className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Backups</p>
                    <p className="text-lg font-bold text-gray-900">5 backups</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Database className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Storage Used</p>
                    <p className="text-lg font-bold text-gray-900">12.0 MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Automatic Backup Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Automatic Backup Schedule</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure automatic database backups to run on a schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-lg gap-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Enable Automatic Backups</p>
                    <p className="text-sm text-gray-600">Create backups on a recurring schedule</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="auto-backup-toggle" className="text-sm cursor-pointer">
                    {autoBackupEnabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  <input
                    id="auto-backup-toggle"
                    type="checkbox"
                    checked={autoBackupEnabled}
                    onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-ocean-600 focus:ring-ocean-500 cursor-pointer"
                    aria-label="Toggle automatic backups"
                  />
                </div>
              </div>

              {autoBackupEnabled && (
                <div className="space-y-4 pl-0 sm:pl-4 border-l-0 sm:border-l-2 border-ocean-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="backup-frequency" className="text-sm">
                        Frequency
                      </Label>
                      <Select defaultValue="daily">
                        <SelectTrigger id="backup-frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Every Hour</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backup-time" className="text-sm">
                        Time
                      </Label>
                      <Input id="backup-time" type="time" defaultValue="02:00" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retention" className="text-sm">
                      Retention Period
                    </Label>
                    <Select defaultValue="30">
                      <SelectTrigger id="retention">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Keep for 7 days</SelectItem>
                        <SelectItem value="30">Keep for 30 days</SelectItem>
                        <SelectItem value="90">Keep for 90 days</SelectItem>
                        <SelectItem value="forever">Keep forever</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Next backup:</strong> Today at 2:00 AM
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Backup List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Backup History</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Available backup files and restore points
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Import Backup</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-ocean-300 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-lg ${backup.type === 'manual' ? 'bg-purple-100' : 'bg-blue-100'}`}
                      >
                        <Database
                          className={`h-5 w-5 ${backup.type === 'manual' ? 'text-purple-600' : 'text-blue-600'}`}
                        />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{backup.name}</p>
                          <Badge
                            variant="secondary"
                            className={
                              backup.type === 'manual'
                                ? 'bg-purple-100 text-purple-700 text-xs'
                                : 'bg-blue-100 text-blue-700 text-xs'
                            }
                          >
                            {backup.type === 'manual' ? 'Manual' : 'Auto'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {backup.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {backup.size}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBackup(backup.id);
                          setShowRestoreDialog(true);
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Restore</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Download className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Export</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Storage Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Backup Storage</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure where backups are stored
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-path" className="text-sm">
                  Local Backup Directory
                </Label>
                <Input
                  id="backup-path"
                  value="~/.dxlander/backups"
                  readOnly
                  className="font-mono text-sm"
                />
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Backup Security</h4>
                    <p className="text-sm text-gray-700">
                      Backups are encrypted using your master encryption key. Keep your key safe to
                      ensure you can restore from backups.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Restore Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Restore from Backup</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to restore the database from this backup?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Warning</h4>
                  <ul className="text-xs sm:text-sm text-gray-700 space-y-1">
                    <li>• Current database will be replaced</li>
                    <li>• All data after backup date will be lost</li>
                    <li>• A backup of current state will be created first</li>
                    <li>• This operation cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>

            {selectedBackup && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Restoring from:</p>
                <p className="font-medium text-gray-900">
                  {backups.find((b) => b.id === selectedBackup)?.name}
                </p>
                <p className="text-sm text-gray-600">
                  Created {backups.find((b) => b.id === selectedBackup)?.date}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={() => setShowRestoreDialog(false)} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Restore Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

export default function BackupPage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-muted-foreground">Loading backup settings...</div>
          </div>
        </PageLayout>
      }
    >
      <BackupContent />
    </Suspense>
  );
}
