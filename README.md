# Functional Programming Workshop

This repository contains:

1. Several branches, two for each stage of the workshop (starting point, reference solution). Their
   names and details are given in the sections for each of the stages.
1. Each branch will contain all the tests needed to verify the work required for completing that
   stage.

## Available Resources and Tools

This repository already has the following NPM modules installed:

* lodash - You know what this is. Be careful of the helpers that do mutate data.
* ramda - Like lodash, but more FP-oriented.
* [crocks](https://evilsoft.github.io/crocks/docs/getting-started.html) - ADTs (Maybe, Result, etc.)
  and helpers for easier and cleaner compositions.

## Workshop Stages

The exercises in this repository are all themed around creating a REST API service for serving blog
post data for a personal blogging site.
In each stage, implement the minimum required to get the tests suite to pass. Do not plan ahead or
future-proof your code. The only thing you're encouraged to do in that regard is to zealously apply
the following FP principle:

* Immutability
* Pure functions
* Declarative style
* Currying
* Partial application
* and Composition

Pay attention to change names as needed to keep the code clean and clear.

Finally, when starting each stage, feel free to solve it in whatever style you feel more comfortable
with, and only refactor it to use the required FP principles after you have a working solution. I
encourage you to break your code down to multiple small functions, and look for abstractions that
can be further extracted to additional functions.

## Get Started

Run `npm i && npm start`, this will create a new branch called `workspace` with the first stage of
the workshop.

After each stage you complete (all tests are green), make sure all your code is committed, then move
to the next stage using `npm run next`.
