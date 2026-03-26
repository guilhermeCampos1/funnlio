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
      {/* Official Google Ads logo: triangle with 3 colored dots */}
      <path d="M3.5 18.5l7-12.1c.5-.9 1.4-1.4 2.5-1.4s2 .5 2.5 1.4l7 12.1c.5.9.5 1.9 0 2.8-.5.9-1.4 1.4-2.5 1.4H6c-1 0-2-.5-2.5-1.4-.5-.9-.5-1.9 0-2.8z" fill="#FBBC04"/>
      <path d="M3.5 18.5l7-12.1c.5-.9 1.4-1.4 2.5-1.4s2 .5 2.5 1.4" stroke="#4285F4" strokeWidth="0" fill="none"/>
      <circle cx="6" cy="19.5" r="2.5" fill="#34A853"/>
      <circle cx="18" cy="19.5" r="2.5" fill="#4285F4"/>
      <circle cx="12" cy="6" r="2.5" fill="#EA4335"/>
    </svg>
  )
}

export function ClarityIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      {/* Microsoft Clarity — flame/cursor shape */}
      <path d="M8.5 3C6.015 3 4 5.015 4 7.5c0 1.66.9 3.11 2.236 3.89L4.5 21h5l1-5.5h3l1 5.5h5l-1.736-9.61A4.49 4.49 0 0020 7.5C20 5.015 17.985 3 15.5 3h-7z" fill="url(#clarity-grad)"/>
      <defs>
        <linearGradient id="clarity-grad" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B2FBE"/>
          <stop offset="1" stopColor="#2F6FBE"/>
        </linearGradient>
      </defs>
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

export function SlackIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      {/* Slack hashmark — 4 colored arms */}
      <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" fill="#E01E5A" transform="scale(0.85) translate(2,1.5)"/>
      <path d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" fill="#36C5F0" transform="scale(0.85) translate(2,1.5)"/>
      <path d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.163 0a2.528 2.528 0 012.523 2.522v6.312z" fill="#2EB67D" transform="scale(0.85) translate(2,1.5)"/>
      <path d="M15.163 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.163 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 01-2.52-2.523 2.527 2.527 0 012.52-2.52h6.314A2.528 2.528 0 0124 15.163a2.528 2.528 0 01-2.523 2.523h-6.314z" fill="#ECB22E" transform="scale(0.85) translate(2,1.5)"/>
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
  slack: SlackIcon,
}

export function ProviderIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = providerIconMap[slug]
  if (!Icon) return <div className={`rounded bg-muted ${className ?? 'w-6 h-6'}`} />
  return <Icon className={className} />
}
