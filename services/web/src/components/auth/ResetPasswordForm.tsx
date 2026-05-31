'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Link } from '@/i18n/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter'
import api from '@/lib/api'

const schema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

type FormData = z.infer<typeof schema>

interface ResetPasswordFormProps {
  token: string
  email: string
}

export default function ResetPasswordForm({ token, email }: ResetPasswordFormProps) {
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email },
  })

  const password = watch('password', '')

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      await api.post('/auth/reset-password', { ...data, token })
      setDone(true)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setServerError(msg ?? 'Something went wrong. Please try again.')
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-status-success" />
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-lg font-semibold text-content-primary">Password updated</h3>
          <p className="text-sm text-content-secondary">You can now sign in with your new password.</p>
        </div>
        <Link href="/auth/login" className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors">
          Go to login →
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {serverError && (
        <p className="rounded-lg bg-status-error/10 px-4 py-3 text-sm text-status-error">{serverError}</p>
      )}

      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="flex flex-col gap-2">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordStrengthMeter password={password} />
      </div>

      <Input
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.password_confirmation?.message}
        {...register('password_confirmation')}
      />

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Reset Password
      </Button>

      <p className="text-center text-sm">
        <Link href="/auth/login" className="text-brand-500 hover:text-brand-600 transition-colors">
          ← Back to login
        </Link>
      </p>
    </form>
  )
}
