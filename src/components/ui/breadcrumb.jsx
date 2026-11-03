import * as React from 'react'
import { CaretRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

function Breadcrumb(props) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn('text-muted-foreground flex flex-wrap items-center gap-x-0.5 gap-y-0 text-sm', className)}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }) {
  return <li data-slot="breadcrumb-item" className={cn('inline-flex items-center gap-1.5', className)} {...props} />
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

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator }
