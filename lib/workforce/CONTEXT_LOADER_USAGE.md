# Tenant Agent Context Loader — Usage Guide

## Overview

The context loader (`config-loader.ts`) loads tenant-specific agent configuration from the database and formats it for injection into agent system prompts at runtime.

## Core Functions

### `loadTenantAgentContext(tenantId, agentId)`

Loads tenant-specific overrides for an agent. Returns `AgentSystemPromptContext` with:
- `tenantAgentContext`: Raw config (niche, services, tone, metadata)
- `formattedOverrides`: String formatted for prompt injection

```typescript
import { loadTenantAgentContext } from '@/lib/workforce/config-loader'

const context = await loadTenantAgentContext(tenantId, agentId)
if (context) {
  console.log(context.tenantAgentContext.tone) // 'formal' | 'casual' | 'direct' | 'friendly'
  console.log(context.formattedOverrides) // Ready to inject into system prompt
}
```

### `injectTenantContextIntoPrompt(basePrompt, formattedContext)`

Injects formatted overrides into a system prompt.

```typescript
const basePrompt = `You are a lead intake agent. Your job is to...`
const customizedPrompt = injectTenantContextIntoPrompt(basePrompt, context.formattedOverrides)
// Now use customizedPrompt with Claude API
```

### `loadMultipleTenantAgentContexts(tenantId, agentIds)`

Batch-loads contexts for multiple agents (useful for workflows involving multiple agents).

```typescript
const contexts = await loadMultipleTenantAgentContexts(tenantId, ['agent-1', 'agent-2', 'agent-3'])
contexts.forEach((context, agentId) => {
  console.log(`Agent ${agentId} tone: ${context.tenantAgentContext.tone}`)
})
```

## Integration Pattern

Typical usage when executing an agent:

```typescript
import { loadTenantAgentContext, injectTenantContextIntoPrompt } from '@/lib/workforce/config-loader'
import Anthropic from '@anthropic-ai/sdk'

async function executeLeadIntakeAgent(tenantId: string, leadData: any) {
  // 1. Load tenant-specific configuration
  const context = await loadTenantAgentContext(tenantId, 'lead-intake')
  
  // 2. Define base system prompt
  const baseSystemPrompt = `You are a Lead Intake Agent. Your role is to:
- Structure inbound lead information (name, company, service, budget, urgency, region)
- Extract intent from unstructured conversations
- Flag missing critical information for follow-up
- Format output as JSON for downstream processing`
  
  // 3. Inject tenant overrides (if config exists)
  const systemPrompt = context 
    ? injectTenantContextIntoPrompt(baseSystemPrompt, context.formattedOverrides)
    : baseSystemPrompt
  
  // 4. Execute agent with Claude
  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Process this lead: ${JSON.stringify(leadData)}`
      }
    ]
  })
  
  return message.content[0].type === 'text' ? message.content[0].text : null
}
```

## Configuration Hierarchy

1. **Catalog defaults** (fw_agents_catalog): Base agent definition (name, description, features)
2. **Tenant activation** (fw_tenant_agents): Whether agent is active for this tenant
3. **Tenant overrides** (fw_agent_config): Custom niche, services, tone, metadata for this tenant + agent combo

The context loader applies overrides in this order:
- If no override exists in fw_agent_config → use null (agent uses its default behavior)
- If override exists → inject it into the system prompt

## Data Flow

```
API Request → Tenant ID + Agent ID
                      ↓
        Load Tenant Agent Context
                      ↓
    [fw_agents_catalog] + [fw_agent_config]
                      ↓
      TenantAgentContext Object
                      ↓
    Format for System Prompt
                      ↓
      Inject into Base Prompt
                      ↓
        Execute Agent with Claude
```

## Available Overrides

| Override | Type | Purpose | Example |
|---|---|---|---|
| `niche_override` | string | Customize agent behavior for specific niche | "hoveniers_amsterdam" |
| `services_override` | string[] | Limit agent to specific services | ["tuinaanleg", "onderhoud"] |
| `tone_override` | enum | Control communication style | "friendly" (vs formal/casual/direct) |
| `metadata` | object | Arbitrary custom config | { "escalation_threshold": 1000, "response_language": "nl" } |

## Error Handling

```typescript
const context = await loadTenantAgentContext(tenantId, agentId)

if (!context) {
  // Agent doesn't exist in catalog or DB error
  // Fall back to default behavior or handle gracefully
  console.warn(`No context found for agent ${agentId}`)
}

// If context exists but specific overrides are null:
if (context.tenantAgentContext.tone === null) {
  // Use agent's default tone
}
```

## Performance Notes

- Context is loaded per agent per request (not cached)
- For workflows with many agents, use `loadMultipleTenantAgentContexts()` to batch-load
- Future: add caching if context is loaded frequently for same tenant
