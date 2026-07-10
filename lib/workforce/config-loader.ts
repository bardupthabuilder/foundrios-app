import { createWorkforceServiceClient } from './supabase'

export interface TenantAgentContext {
  agentId: string
  tenantId: string
  niche: string | null
  services: string[] | null
  tone: 'formal' | 'casual' | 'direct' | 'friendly' | null
  metadata: Record<string, any>
}

export interface AgentSystemPromptContext {
  tenantAgentContext: TenantAgentContext
  formattedOverrides: string
}

/**
 * Load tenant-specific agent configuration and prepare overrides for system prompt injection.
 * Returns null if agent is not configured or doesn't exist for this tenant.
 */
export async function loadTenantAgentContext(
  tenantId: string,
  agentId: string
): Promise<AgentSystemPromptContext | null> {
  const supabase = createWorkforceServiceClient()

  // Load agent config (may not exist if not customized yet)
  const { data: config, error: configError } = await supabase
    .from('fw_agent_config')
    .select('niche_override, services_override, tone_override, metadata')
    .eq('tenant_id', tenantId)
    .eq('agent_id', agentId)
    .maybeSingle()

  // Verify agent exists in catalog
  const { data: catalogAgent, error: catalogError } = await supabase
    .from('fw_agents_catalog')
    .select('id, slug, name, category')
    .eq('id', agentId)
    .single()

  if (catalogError || !catalogAgent) {
    return null
  }

  // Build context object
  const tenantAgentContext: TenantAgentContext = {
    agentId,
    tenantId,
    niche: config?.niche_override ?? null,
    services: config?.services_override ?? null,
    tone: config?.tone_override ?? null,
    metadata: config?.metadata ?? {},
  }

  // Format overrides for system prompt injection
  const formattedOverrides = formatContextForPrompt(
    tenantAgentContext,
    catalogAgent
  )

  return {
    tenantAgentContext,
    formattedOverrides,
  }
}

/**
 * Format tenant context as a prompt snippet for system prompt injection.
 * This is injected into the agent's system prompt to customize behavior.
 */
function formatContextForPrompt(
  context: TenantAgentContext,
  catalogAgent: {
    id: string
    slug: string
    name: string
    category: string
  }
): string {
  const parts: string[] = []

  parts.push(
    `## Tenant-Specific Configuration for ${catalogAgent.name}\n`
  )

  if (context.niche) {
    parts.push(`**Niche Override:** ${context.niche}`)
  }

  if (context.services && context.services.length > 0) {
    parts.push(`**Services Focus:** ${context.services.join(', ')}`)
  }

  if (context.tone) {
    parts.push(`**Tone/Style:** Use a ${context.tone} tone in all communications.`)
  }

  if (Object.keys(context.metadata).length > 0) {
    parts.push(`**Custom Metadata:**`)
    Object.entries(context.metadata).forEach(([key, value]) => {
      parts.push(`- ${key}: ${JSON.stringify(value)}`)
    })
  }

  // If no overrides, return a neutral statement
  if (parts.length === 1) {
    return `${parts[0]}\nNo custom overrides configured. Use default agent behavior.`
  }

  return parts.join('\n')
}

/**
 * Inject tenant context into a system prompt.
 * Appends the formatted context to the end of the system prompt.
 */
export function injectTenantContextIntoPrompt(
  baseSystemPrompt: string,
  formattedContext: string
): string {
  return `${baseSystemPrompt}\n\n---\n\n${formattedContext}`
}

/**
 * Load context for multiple agents (batch operation).
 * Useful for workflows that invoke multiple agents per tenant.
 */
export async function loadMultipleTenantAgentContexts(
  tenantId: string,
  agentIds: string[]
): Promise<Map<string, AgentSystemPromptContext>> {
  const contexts = new Map<string, AgentSystemPromptContext>()

  for (const agentId of agentIds) {
    const context = await loadTenantAgentContext(tenantId, agentId)
    if (context) {
      contexts.set(agentId, context)
    }
  }

  return contexts
}
