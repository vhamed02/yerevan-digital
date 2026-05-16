'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import useAuthStore from '@/stores/auth.store'
import type { User, Store } from '@/types'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface LoginResponse {
  token: string
  user: User
  store?: Store
}

export default function LoginForm() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post<LoginResponse>('/auth/login', data)
      login({ user: res.data.user, token: res.data.token, store: res.data.store })
      const role = res.data.user.role
      router.push(role === 'super_admin' ? '/admin' : '/seller')
    } catch {
      toast.error('Invalid email or password')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="flex flex-col gap-1.5">
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-xs text-brand-500 hover:text-brand-600 transition-colors">
            Forgot password?
          </Link>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border text-brand-500 focus:ring-brand-500"
          {...register('remember')}
        />
        <span className="text-sm text-content-secondary">Remember me</span>
      </label>

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Sign In
      </Button>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-content-muted">or</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <p className="text-center text-sm text-content-secondary">
        New seller?{' '}
        <Link href="/auth/register" className="font-medium text-brand-500 hover:text-brand-600 transition-colors">
          Create your store →
        </Link>
      </p>
    </form>
  )
}
