const { getDiff } = require("./getDiff")

const oldCode = `function greet() { console.log("Hello") }`
const newCode = `function greet() { console.log("Hi there") }`

const diff = getDiff(oldCode, newCode)
console.log(diff)
