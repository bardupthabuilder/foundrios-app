import { checkFeature } from '@/lib/tier'
import { UpgradeCard } from '@/components/UpgradeCard'

interface FeatureGateProps {
  feature: string
  children: React.ReactNode
  fallback?: 'card' | 'blur' | 'hide'
  title?: string
  description?: string
}

export async function FeatureGate({
  feature,
  children,
  fallback = 'card',
  title,
  description,
}: FeatureGateProps) {
  const { allowed, currentTier, requiredTier } = await checkFeature(feature)

  if (allowed) return <>{children}</>

  if (fallback === 'hide') return null

  if (fallback === 'blur') {
    return (
      <div className="relative" data-feature={feature}>
        <div className="pointer-events-none opacity-30 blur-[1px]">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <UpgradeCard
            feature={feature}
            requiredTier={requiredTier}
            currentTier={currentTier}
            title={title}
            description={description}
          />
        </div>
      </div>
    )
  }

  return (
    <UpgradeCard
      feature={feature}
      requiredTier={requiredTier}
      currentTier={currentTier}
      title={title}
      description={description}
    />
  )
}
