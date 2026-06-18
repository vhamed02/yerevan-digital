'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import useAuthStore from '@/stores/auth.store'
import type { User } from '@/types'

interface RegisterResponse {
  token: string
  user: User
}

export default function CustomerRegisterForm() {
  const t = useTranslations('account')
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  const schema = z
    .object({
      name: z.string().min(1, t('register.nameRequired')),
      email: z.string().email(t('register.emailInvalid')),
      phone: z.string().optional(),
      password: z.string().min(8, t('register.passwordShort')),
      password_confirmation: z.string().min(1, t('register.confirmRequired')),
    })
    .refine((d) => d.password === d.password_confirmation, {
      message: t('register.passwordMismatch'),
      path: ['password_confirmation'],
    })

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post<RegisterResponse>('/auth/customer/register', data)
      login({ user: res.data.user, token: res.data.token })
      router.push('/account/orders')
    } catch {
      toast.error(t('register.failed'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <Input label={t('register.name')} error={errors.name?.message} {...register('name')} />
      <Input
        label={t('register.email')}
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input label={t('register.phone')} error={errors.phone?.message} {...register('phone')} />
      <Input
        label={t('register.password')}
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        label={t('register.confirm')}
        type="password"
        autoComplete="new-password"
        error={errors.password_confirmation?.message}
        {...register('password_confirmation')}
      />

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        {t('register.submit')}
      </Button>

      <p className="text-center text-sm text-content-secondary">
        {t('register.haveAccount')}{' '}
        <Link href="/auth/login" className="font-medium text-brand-500 transition-colors hover:text-brand-600">
          {t('register.signIn')} →
        </Link>
      </p>
    </form>
  )
}
