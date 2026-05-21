'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter'
import api from '@/lib/api'
import useAuthStore from '@/stores/auth.store'
import type { User } from '@/types'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
})

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

interface SellerProfileClientProps {
  initialUser: User
}

export default function SellerProfileClient({ initialUser }: SellerProfileClientProps) {
  const { updateUser } = useAuthStore()
  const [profileServerError, setProfileServerError] = useState<string | null>(null)
  const [passwordServerError, setPasswordServerError] = useState<string | null>(null)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: initialUser.name, email: initialUser.email },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const newPassword = watch('password', '')

  const profileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => api.patch<User>('/seller/profile', data),
    onSuccess: (res) => {
      updateUser({ name: res.data.name, email: res.data.email })
      toast.success('Profile updated.')
      setProfileServerError(null)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setProfileServerError(msg ?? 'Failed to update profile.')
    },
  })

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordFormData) => api.patch('/seller/profile/password', data),
    onSuccess: () => {
      toast.success('Password changed.')
      resetPassword()
      setPasswordServerError(null)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setPasswordServerError(msg ?? 'Failed to change password.')
    },
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-8">
      <h1 className="font-heading text-2xl font-bold text-content-primary">My Profile</h1>

      <section className="rounded-xl border border-border bg-surface p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-content-primary">Account Information</h2>

        {profileServerError && (
          <p className="rounded-lg bg-status-error/10 px-4 py-3 text-sm text-status-error">{profileServerError}</p>
        )}

        <form
          onSubmit={handleProfileSubmit((data) => profileMutation.mutate(data))}
          className="flex flex-col gap-4"
          noValidate
        >
          <Input
            label="Full name"
            autoComplete="name"
            error={profileErrors.name?.message}
            {...registerProfile('name')}
          />
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            error={profileErrors.email?.message}
            {...registerProfile('email')}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={profileSubmitting || profileMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-content-primary">Change Password</h2>

        {passwordServerError && (
          <p className="rounded-lg bg-status-error/10 px-4 py-3 text-sm text-status-error">{passwordServerError}</p>
        )}

        <form
          onSubmit={handlePasswordSubmit((data) => passwordMutation.mutate(data))}
          className="flex flex-col gap-4"
          noValidate
        >
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            error={passwordErrors.current_password?.message}
            {...registerPassword('current_password')}
          />
          <div className="flex flex-col gap-2">
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              error={passwordErrors.password?.message}
              {...registerPassword('password')}
            />
            <PasswordStrengthMeter password={newPassword} />
          </div>
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={passwordErrors.password_confirmation?.message}
            {...registerPassword('password_confirmation')}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={passwordSubmitting || passwordMutation.isPending}>
              Change Password
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
