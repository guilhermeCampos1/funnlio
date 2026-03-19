'use client'

import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@funnlio/api'

export const trpc = createTRPCReact<AppRouter>()
