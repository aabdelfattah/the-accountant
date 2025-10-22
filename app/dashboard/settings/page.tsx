import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Account settings will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This page will allow you to:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
            <li>Update your profile information</li>
            <li>Change your password</li>
            <li>Configure notification preferences</li>
            <li>Set default currency</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
