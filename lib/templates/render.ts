export type TemplateVariable = {
  name: string
  label: string
  default?: string
}

export type TemplateContent = {
  body: string
  subject?: string
  variables?: TemplateVariable[]
}

const VAR_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g

export function renderTemplate(text: string, vars: Record<string, string | number | null | undefined> = {}): string {
  return text.replace(VAR_REGEX, (match, name: string) => {
    const v = vars[name]
    if (v === null || v === undefined || v === '') return `{{${name}}}`
    return String(v)
  })
}

export function extractVariableNames(text: string): string[] {
  const set = new Set<string>()
  let m: RegExpExecArray | null
  const re = new RegExp(VAR_REGEX.source, 'g')
  while ((m = re.exec(text)) !== null) {
    set.add(m[1])
  }
  return Array.from(set)
}

export function hasUnfilledVariables(rendered: string): boolean {
  return /\{\{[a-zA-Z0-9_]+\}\}/.test(rendered)
}
