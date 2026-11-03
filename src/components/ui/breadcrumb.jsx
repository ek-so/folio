import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { CaretRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

function Breadcrumb(props) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn('text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0 text-sm', className)}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }) {
  return <li data-slot="breadcrumb-item" className={cn('inline-flex items-center gap-1.5', className)} {...props} />
}

function BreadcrumbLink({ asChild, className, ...props }) {
  const Comp = asChild ? Slot : 'a'
  return (
    <Comp data-slot="breadcrumb-link" className={cn("relative block h-6 leading-6 hover:text-foreground transition-colors after:absolute after:inset-x-0 after:-inset-y-2 after:content-['']", className)} {...props} />
  )
}

function BreadcrumbPage({ className, ...props }) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('block h-6 max-w-40 truncate leading-6 text-foreground font-normal', className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({ children, className, ...props }) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:size-4', className)}
      {...props}
    >
      {children ?? <CaretRight />}
    </li>
  )
}

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator }
