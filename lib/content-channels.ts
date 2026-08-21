// De 4 Facebook/Instagram x Zakelijk/Persoonlijk kanalen (Content V2).
// content_items.platforms blijft text[] — kanalen worden opgeslagen als
// composite keys "platform:profile_type" (bv. "facebook:zakelijk"), zodat
// er geen nieuwe kolom op content_items nodig is. content_distributions
// heeft wel losse platform + profile_type kolommen (zie migratie 047).

export type ContentPlatform = 'facebook' | 'instagram'
export type ContentProfileType = 'zakelijk' | 'persoonlijk'

export interface ContentChannel {
  key: string // "facebook:zakelijk"
  platform: ContentPlatform
  profile_type: ContentProfileType
  label: string
  color: string
}

export const CHANNELS: ContentChannel[] = [
  { key: 'facebook:zakelijk', platform: 'facebook', profile_type: 'zakelijk', label: 'Facebook Zakelijk', color: '#1877F2' },
  { key: 'facebook:persoonlijk', platform: 'facebook', profile_type: 'persoonlijk', label: 'Facebook Persoonlijk', color: '#5B9BF2' },
  { key: 'instagram:zakelijk', platform: 'instagram', profile_type: 'zakelijk', label: 'Instagram Zakelijk', color: '#E4405F' },
  { key: 'instagram:persoonlijk', platform: 'instagram', profile_type: 'persoonlijk', label: 'Instagram Persoonlijk', color: '#F080A0' },
]

export function channelByKey(key: string): ContentChannel | undefined {
  return CHANNELS.find((c) => c.key === key)
}

export function makeChannelKey(platform: string, profileType: string): string {
  return `${platform}:${profileType}`
}

export function parseChannelKey(key: string): { platform: string; profile_type: string } | null {
  const [platform, profile_type] = key.split(':')
  if (!platform || !profile_type) return null
  return { platform, profile_type }
}
