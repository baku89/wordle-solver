import { Answers, ValidWords } from './words'
import _ from 'lodash'
import YAML from 'yaml'
import { sortKeysBy, without } from './util'

type Groups = Record<string, string[]>
type GuessResult = { groups: Groups; maybeAnswer: boolean }
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

function solveFlow(candidates: string[], answers: string[], depth = 0): Flow {
	if (answers.length === 1) return answers[0]

	const { input, groups, maybeAnswer } = solveBestInput(candidates, answers)

	const remainingCandidates = without(candidates, input)

	const next = _.mapValues(groups, (group) => {
		return solveFlow(remainingCandidates, group, depth + 1)
	})

	const nexts = Object.values(next)

	const count =
		_.sum(nexts.map((flow) => (typeof flow === 'string' ? 1 : flow.count))) +
		(maybeAnswer ? 1 : 0)

	const maxDepth =
		Math.max(
			0,
			...nexts.map((flow) => (typeof flow === 'string' ? 1 : flow.maxDepth))
		) + 1

	const averageDepth =
		_.sum([
			...nexts.map((flow) =>
				typeof flow === 'string'
					? 1 / count
					: flow.averageDepth * (flow.count / count)
			),
			...(maybeAnswer ? [0] : []),
		]) + 1

	return {
		input,
		count,
		maxDepth,
		averageDepth,
		maybeAnswer,
		next,
	}
}

function formatFlow(flow: Flow) {
	if (typeof flow === 'string') return flow

	return {
		guess: `${flow.input} (${flow.count}${flow.maybeAnswer ? '?' : ''})`,
		next: _.mapValues(sortKeysBy(flow.next, getHintHash), formatFlow),
	}
}

function main() {
	const result = solveFlow(ValidWords, Answers)

	if (typeof result === 'string') return

	const { maxDepth, averageDepth } = result

	document.getElementById('output').textContent =
		`# For example, HUMID (6?) means:
# - the best word to guess is "HUMID".
# - the count of remaining candidates at the present is 6
# - "HUMID" also might be an answer (annotated as trailing ? mark)\n\n` +
		YAML.stringify({
			statics: { maxDepth, averageDepth },
			flow: formatFlow(result),
		})
}

setTimeout(main, 10)
