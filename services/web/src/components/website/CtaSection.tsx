import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function CtaSection() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-bold text-content-primary sm:text-4xl">
          Ready to start selling?
        </h2>
        <p className="mt-3 text-content-secondary">It only takes 2 minutes</p>
        <Link href="/auth/register" className="mt-8 inline-block">
          <Button size="xl">
            Create Your Free Store
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  )
}
