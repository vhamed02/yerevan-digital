'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import api from '@/lib/api'
import type { AdminSettings } from '@/types'

interface SettingsAdminClientProps {
  initialSettings: AdminSettings | null
}

const defaultSettings: AdminSettings = {
  platform_name: 'Vendorex',
  platform_name_hy: 'Վենդորա',
  registration_enabled: true,
  registration_require_approval: true,
  support_email: '',
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
}

export default function SettingsAdminClient({ initialSettings }: SettingsAdminClientProps) {
  const [settings, setSettings] = useState<AdminSettings>(
    initialSettings ?? defaultSettings
  )

  const saveMutation = useMutation({
    mutationFn: (data: Partial<AdminSettings>) => api.patch('/admin/settings', data),
    onSuccess: () => toast.success('Settings saved'),
    onError: () => toast.error('Failed to save settings'),
  })

  function field<K extends keyof AdminSettings>(key: K) {
    return {
      value: settings[key] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setSettings((s) => ({ ...s, [key]: e.target.value })),
    }
  }

  function boolField(key: keyof AdminSettings) {
    return {
      checked: settings[key] as boolean,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setSettings((s) => ({ ...s, [key]: e.target.checked })),
    }
  }

  function SaveButton({ fields }: { fields: Partial<AdminSettings> }) {
    return (
      <div className="flex justify-end pt-4">
        <Button
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate(fields)}
        >
          Save Changes
        </Button>
      </div>
    )
  }

  const generalContent = (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <Input label="Platform Name (English)" {...field('platform_name')} />
      <Input label="Platform Name (Armenian)" {...field('platform_name_hy')} />
      <Input label="Support Email" type="email" {...field('support_email')} />
      <SaveButton
        fields={{
          platform_name: settings.platform_name,
          platform_name_hy: settings.platform_name_hy,
          support_email: settings.support_email,
        }}
      />
    </div>
  )

  const registrationContent = (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" className="h-4 w-4 rounded" {...boolField('registration_enabled')} />
        <div>
          <p className="text-sm font-medium text-content-primary">Enable Registration</p>
          <p className="text-xs text-content-muted">Allow new sellers to sign up</p>
        </div>
      </label>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          {...boolField('registration_require_approval')}
        />
        <div>
          <p className="text-sm font-medium text-content-primary">Require Approval</p>
          <p className="text-xs text-content-muted">New stores must be approved before going live</p>
        </div>
      </label>
      <SaveButton
        fields={{
          registration_enabled: settings.registration_enabled,
          registration_require_approval: settings.registration_require_approval,
        }}
      />
    </div>
  )

  const emailContent = (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <Input label="SMTP Host" {...field('smtp_host')} placeholder="smtp.example.com" />
      <Input
        label="SMTP Port"
        type="number"
        value={settings.smtp_port?.toString() ?? '587'}
        onChange={(e) =>
          setSettings((s) => ({ ...s, smtp_port: parseInt(e.target.value) || 587 }))
        }
      />
      <Input label="SMTP Username" {...field('smtp_user')} />
      <SaveButton
        fields={{
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_user: settings.smtp_user,
        }}
      />
    </div>
  )

  const seoContent = (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <Input label="Meta Title" {...field('meta_title')} />
      <Input label="Meta Description" {...field('meta_description')} />
      <Input label="Meta Keywords" {...field('meta_keywords')} />
      <SaveButton
        fields={{
          meta_title: settings.meta_title,
          meta_description: settings.meta_description,
          meta_keywords: settings.meta_keywords,
        }}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-content-primary">Settings</h1>

      <Tabs
        items={[
          { value: 'general', label: 'General', content: generalContent },
          { value: 'registration', label: 'Registration', content: registrationContent },
          { value: 'email', label: 'Email', content: emailContent },
          { value: 'seo', label: 'SEO', content: seoContent },
        ]}
      />
    </div>
  )
}
