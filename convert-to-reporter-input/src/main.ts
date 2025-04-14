import * as core from '@actions/core'
import * as fs from 'fs'

function parseScores(scores: string): Map<string, number> {
  const parsed = new Map()
  const lines = scores.split('\n')
  for (const line of lines) {
    const parts = line.split(':')
    if (parts.length > 1) {
      const key = parts[0].trim()
      const value = parts[1].trim()
      parsed.set(key, parseFloat(value))
    }
  }
  return parsed
}

function getInputs() {
  const jsonPath = core.getInput('json-path', {
    required: true
  })
  const scores = core.getInput('scores', {
    required: true
  })

  return { jsonPath, scores }
}

type CheckResult = {
  is_ok: boolean
  results: ItemResult[]
}

type ItemResult = {
  id: string
  is_ok: boolean
  errors: string[]
}

type Status = 'pass' | 'fail' | 'error'

type ClassroomResult = {
  version: 1
  status: Status
  max_score: number
  tests: {
    name: string
    status: Status
    filename: string
    line_no: number
    execution_time: string
    score: number
  }[]
}

const COLORS = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
}

function convert(jsonPath: string, scores: string) {
  const checkResult: CheckResult = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const parsedScores = parseScores(scores)
  const status = checkResult.is_ok ? 'pass' : 'fail'

  const result: ClassroomResult = {
    version: 1,
    status,
    max_score: parsedScores.get('max') ?? 0,
    tests: checkResult.results.map(({ id, is_ok, errors }) => {
      let name: string
      if (is_ok) {
        name = id
      } else {
        // HACK: injection
        name = `${id}${COLORS.reset}\n${errors.map((e) => `  ${COLORS.yellow}-${COLORS.reset} ${e}`).join('\n')}`
      }
      return {
        name,
        status: is_ok ? 'pass' : 'fail',
        filename: '',
        line_no: 0,
        execution_time: 'Not available',
        score: is_ok ? (parsedScores.get(id) ?? 0) : 0
      }
    })
  }

  return result
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export function run() {
  try {
    const { jsonPath, scores } = getInputs()

    const result = convert(jsonPath, scores)

    core.setOutput('result', btoa(JSON.stringify(result)))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function btoa(str: string) {
  return Buffer.from(str).toString('base64')
}
