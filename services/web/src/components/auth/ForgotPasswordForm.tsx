'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Link } from '@/i18n/navigation'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/auth/forgot-password', data)
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-status-success" />
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-lg font-semibold text-content-primary">Check your inbox</h3>
          <p className="text-sm text-content-secondary">Reset link sent to your inbox</p>
        </div>
        <Link href="/auth/login" className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors">
          ← Back to login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Send Reset Link
      </Button>

      <p className="text-center text-sm">
        <Link href="/auth/login" className="text-brand-500 hover:text-brand-600 transition-colors">
          ← Back to login
        </Link>
      </p>
    </form>
  )
}
