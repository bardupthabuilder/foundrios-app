import Anthropic from '@anthropic-ai/sdk'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'
import type { AgentSpec, AgentContext, AgentResult, ToolCall } from '@/lib/workforce/types'

const anthropic = new Anthropic()

export async function runAgent(
  spec: AgentSpec,
  input: Record<string, unknown>,
  context: AgentContext
): Promise<AgentResult> {
  const supabase = createWorkforceServiceClient()
  const startTime = Date.now()

  // Create agent run record
  const { data: run, error: insertError } = await supabase
    .from('fw_agent_runs')
    .insert({
      tenant_id: context.tenantId,
      lead_id: context.leadId || null,
      agent_name: spec.name,
      agent_version: spec.version,
      input,
      model: spec.model,
      status: 'running',
    })
    .select('id')
    .single()

  if (insertError || !run) {
    return { success: false, error: `Failed to create agent run: ${insertError?.message}`, runId: '' }
  }

  try {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: JSON.stringify(input) },
    ]

    let response = await anthropic.messages.create({
      model: spec.model,
      max_tokens: spec.maxTokens,
      system: spec.system,
      tools: spec.tools as Anthropic.Tool[],
      messages,
    })

    const toolsCalled: ToolCall[] = []

    // Tool use loop — agent calls skills until done
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of toolUseBlocks) {
        const handler = spec.toolHandlers[block.name]
        if (!handler) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify({ error: `Unknown tool: ${block.name}` }),
            is_error: true,
          })
          continue
        }

        try {
          const result = await handler(block.input as Record<string, unknown>)
          toolsCalled.push({
            name: block.name,
            input: block.input as Record<string, unknown>,
            output: result,
          })
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          })
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          toolsCalled.push({
            name: block.name,
            input: block.input as Record<string, unknown>,
            output: { error: errMsg },
          })
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify({ error: errMsg }),
            is_error: true,
          })
        }
      }

      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResults })

      response = await anthropic.messages.create({
        model: spec.model,
        max_tokens: spec.maxTokens,
        system: spec.system,
        tools: spec.tools as Anthropic.Tool[],
        messages,
      })
    }

    // Extract final text output
    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === 'text'
    )

    let output: Record<string, unknown> | undefined
    if (textBlock) {
      try {
        output = JSON.parse(textBlock.text)
      } catch {
        output = { raw: textBlock.text }
      }
    }

    // Update agent run with results
    await supabase
      .from('fw_agent_runs')
      .update({
        output,
        tools_called: toolsCalled,
        tokens_input: response.usage.input_tokens,
        tokens_output: response.usage.output_tokens,
        duration_ms: Date.now() - startTime,
        status: 'success',
      })
      .eq('id', run.id)

    return { success: true, output, runId: run.id }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)

    await supabase
      .from('fw_agent_runs')
      .update({
        status: 'error',
        error: errMsg,
        duration_ms: Date.now() - startTime,
      })
      .eq('id', run.id)

    return { success: false, error: errMsg, runId: run.id }
  }
}
