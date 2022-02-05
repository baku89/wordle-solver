# Wordle Solver

Solving [Wordle](https://www.powerlanguage.co.uk/wordle/) can be regarded as building an efficient search tree of words with minimum depth to narrow down an answer. And from that aspect, we're doing the opposite of the Akinator -- guessing an answer that the computer has randomly by hints. The differences are the answer is not a character but a word, and the hint is a series of colored squares instead of 5 options.

The algorithm uses a straightforward strategy of choosing the best guess to maximize the number of groups of candidates for each hint. However, there should be more efficient yet better objective function, like using the average depth of the search tree for the pair of remaining candidates and possible answers.

Special thanks to [@stuartpb](https://twitter.com/stuartpb)'s advisory.

## Setup

```
git clone https://github.com/baku89/wordle-solver
cd wordle-solver
yarn init
yarn serve
```

## Result

**(SPOILER)** You can see the tree data from [flow.yaml](./flow.yaml).

## Statics

- The best first guess: `TRACE`
- The worst first guess: `QAJAQ` (a way to spell kayak)
- The worst first guess that also can be an answer: `FUZZY`
- The maximum number of guess: `5`
- The average number of guess: `2.4393088552915776`
