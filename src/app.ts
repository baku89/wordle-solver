import { Answers, ValidWords } from './words'
import _ from 'lodash'
import YAML from 'yaml'

type Groups = Record<string, string[]>
type GuessResult = { groups: Groups; maybeAnswer: boolean }

function variance(numbers: number[]) {
	const average = _.mean(numbers)
	return _.mean(numbers.map((n) => Math.pow(n - average, 2)))
}

function getHint(input: string, answer: string) {
	let hint = ''
	for (let i = 0; i < 5; i++) {
		const ch = input[i]

		if (ch === answer[i]) {
			hint += '🟩'
		} else if (answer.includes(ch) && !input.slice(0, i).includes(ch)) {
			hint += '🟨'
		} else {
			hint += '⬜'
		}
	}
	return hint
}

function getHintHash(hint: string) {
	let hash = 0
	for (const ch of hint) {
		hash <<= 2
		if (ch === '🟩') hash += 2
		if (ch === '🟨') hash += 1
	}
	return hash
}

function guess(input: string, candidates: string[]): GuessResult {
	const groups = {} as Groups
	let maybeAnswer = false

	candidates.forEach((answer) => {
		if (input === answer) {
			maybeAnswer = true
			return
		}

		const hint = getHint(input, answer)

		const group = groups[hint] ?? []
		group.push(answer)
		groups[hint] = group
	})

	return {
		groups,
		maybeAnswer,
	}
}

function computeCost({ maybeAnswer, groups }: GuessResult) {
	return -Object.keys(groups).length - (maybeAnswer ? 1.1 : 0)
}

function solveBestInput(candidates: string[], answers: string[]) {
	let best: { input: string; groups: Groups; maybeAnswer: boolean } | undefined
	let bestCost = Number.MAX_SAFE_INTEGER

	for (const input of candidates) {
		const guessResult = guess(input, answers)
		const cost = computeCost(guessResult)

		if (cost < bestCost || !best) {
			best = {
				input,
				groups: guessResult.groups,
				maybeAnswer: guessResult.maybeAnswer,
			}
			bestCost = cost
		}
	}

	return best
}

type Flow =
	| string
	| {
			input: string
			maxDepth: number
			averageDepth: number
			maybeAnswer: boolean
			count: number
			next: Record<string, Flow>
	  }

function solveFlow(candidates: string[], answers: string[], depth = 0): Flow {
	if (answers.length === 1) return answers[0]

	const { input, groups, maybeAnswer } = solveBestInput(candidates, answers)

	const remainingCandidates = _.without(candidates, input)

	const next = _.mapValues(groups, (group) => {
		return solveFlow(remainingCandidates, group, depth + 1)
	})

	const nexts = Object.values(next)

	const count =
		_.sum(nexts.map((flow) => (typeof flow === 'string' ? 1 : flow.count))) +
		(maybeAnswer ? 1 : 0)

	const maxDepth =
		_.max(nexts.map((flow) => (typeof flow === 'string' ? 0 : flow.maxDepth))) +
		1

	const averageDepth = _.sum(
		nexts.map((flow) =>
			typeof flow === 'string'
				? 1 / count
				: (flow.averageDepth + 1) * (flow.count / count)
		)
	)

	return {
		input,
		count,
		maxDepth,
		averageDepth,
		maybeAnswer,
		next,
	}
}

setTimeout(() => {
	const result = solveFlow(ValidWords, Answers)
	document.getElementById('output').textContent = YAML.stringify(
		formatFlow(result)
	)
}, 10)

function formatFlow(flow: Flow) {
	if (typeof flow === 'string') return flow

	return {
		input: flow.input,
		next: _.mapValues(sortKeysBy(flow.next, getHintHash), formatFlow),
	}
}

function sortKeysBy<T>(
	record: Record<string, T>,
	iteratees: (value: string) => number
) {
	const sorted: Record<string, T> = {}
	const keys = _.sortBy(Object.keys(record), iteratees)
	for (const key of keys) {
		sorted[key] = record[key]
	}
	return sorted
}

function printResult(result: ReturnType<typeof solveBestInput>) {
	const counts = Object.values(result.groups).map((g) => g.length)

	let str = ''

	str += `Input: ${result.input}\n`

	str += `Variance = ${variance(counts)}\n`
	str += `Average = ${_.mean(counts)} words\n`
	str += `# of Branches = ${counts.length}\n`

	str += '\n---\n\n'

	str += Object.entries(result.groups)
		.map(([h, g]) => {
			const num = _.padStart('(' + g.length + ')', 6)
			const group = printGroup(g)
			return `${h} ${num} -> ${group}`
		})
		.join('\n')

	return str

	function printGroup(group: string[]) {
		const str = group.join(',')
		// if (str.length > 77) return str.slice(0, 80) + '...'
		return str
	}
}
