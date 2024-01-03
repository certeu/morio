import path from 'path'

const runNextJsLinter = (filenames) =>
  `next lint --fix --file ${filenames.map((f) => path.relative(process.cwd(), f)).join(' --file ')}`

export default {
  '*': [runNextJsLinter, 'npx prettier --ignore-unknown --write'],
}
