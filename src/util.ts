import { sortBy } from 'lodash'

export function sortKeysBy<T>(
	record: Record<string, T>,
	iteratees: (value: string) => number
) {
	const sorted: Record<string, T> = {}
	const keys = sortBy(Object.keys(record), iteratees)
	for (const key of keys) {
		sorted[key] = record[key]
	}
	return sorted
}

export function without<T>(coll: T[], item: T) {
	const removed = [...coll]

	for (let i = 0; i < coll.length; i++) {
		if (coll[i] === item) {
			coll.splice(i, 1)
			return coll
		}
	}

	return coll
}
