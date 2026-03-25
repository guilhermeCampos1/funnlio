interface IconProps {
  className?: string
}

export function MetaAdsIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2"/>
    </svg>
  )
}

export function PipedriveIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#017737"/>
      <path d="M12 5c-2.76 0-5 2.24-5 5 0 2.05 1.23 3.81 3 4.58V18h4v-3.42c1.77-.77 3-2.53 3-4.58 0-2.76-2.24-5-5-5zm0 7.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 7.5 12 7.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="white"/>
    </svg>
  )
}

export function GoogleAdsIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M3.272 16.102l6.26-10.848a3.635 3.635 0 016.29 0l6.26 10.848a3.635 3.635 0 01-3.146 5.452H6.418a3.635 3.635 0 01-3.146-5.452z" fill="#FBBC04"/>
      <path d="M6.418 21.554a3.635 3.635 0 01-3.146-5.452l6.26-10.848a3.635 3.635 0 016.29 0" fill="#4285F4"/>
      <path d="M15.876 5.254a3.635 3.635 0 013.146 1.818l3.06 5.301" fill="#34A853"/>
      <circle cx="6.545" cy="18.545" r="3" fill="#34A853"/>
      <circle cx="17.455" cy="18.545" r="3" fill="#4285F4"/>
    </svg>
  )
}

export function ClarityIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#5C2D91"/>
      <path d="M7 8h10v2H7V8zm0 3h8v2H7v-2zm0 3h6v2H7v-2z" fill="white" opacity="0.9"/>
      <circle cx="17" cy="14" r="2.5" fill="#FFB900"/>
    </svg>
  )
}

export function GoogleAnalyticsIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M19.5 21h-2a1.5 1.5 0 01-1.5-1.5v-15A1.5 1.5 0 0117.5 3h2A1.5 1.5 0 0121 4.5v15a1.5 1.5 0 01-1.5 1.5z" fill="#F9AB00"/>
      <path d="M12.5 21h-2A1.5 1.5 0 019 19.5v-8A1.5 1.5 0 0110.5 10h2a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5z" fill="#E37400"/>
      <circle cx="5" cy="19.5" r="2" fill="#E37400"/>
    </svg>
  )
}

const providerIconMap: Record<string, React.ComponentType<IconProps>> = {
  meta_ads: MetaAdsIcon,
  pipedrive: PipedriveIcon,
  google_ads: GoogleAdsIcon,
  microsoft_clarity: ClarityIcon,
  clarity: ClarityIcon,
  google_analytics: GoogleAnalyticsIcon,
  google_analytics_4: GoogleAnalyticsIcon,
}

export function ProviderIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = providerIconMap[slug]
  if (!Icon) return <div className={`rounded bg-muted ${className ?? 'w-6 h-6'}`} />
  return <Icon className={className} />
}
