// Generated automatically by nearley, version 2.13.0
// http://github.com/Hardmath123/nearley
(function () {
const props = require('./props');
const moo = require('moo');
const lexer = moo.compile({
  WS: /[ \t\r]+/,
  NL: { match: /\n/, lineBreaks: true },
  true: /T/,
  false: /F/,
  lparen: /\(/,
  rparen: /\)/,
  not: /not/,
  and: /and/,
  or: /or/,
  implies: /implies/,
  prop: /[A-Z][a-zA-Z0-9]*/,
});
const lexer2 = {
  save: () => lexer.save(),
  reset: (chunk, info) => lexer.reset(chunk, info),
  formatError: (tok) => lexer.formatError(tok),
  has: (name) => lexer.has(name),
  next: () => {
    let tok;
    do {
      tok = lexer.next();
    } while (tok !== undefined && (tok.type === 'WS' || tok.type === 'NL'));
    return tok;
  }
};
var grammar = {
    Lexer: lexer2,
    ParserRules: [
    {"name": "Prop", "symbols": ["Disj", (lexer2.has("implies") ? {type: "implies"} : implies), "Prop"], "postprocess": ([a, b, c]) => props.Operator.implication(a, c)},
    {"name": "Prop", "symbols": ["Disj"], "postprocess": ([a]) => a},
    {"name": "Disj", "symbols": ["Disj", (lexer2.has("or") ? {type: "or"} : or), "Conj"], "postprocess": ([a, b, c]) => props.Operator.disjunction(a, c)},
    {"name": "Disj", "symbols": ["Conj"], "postprocess": ([a]) => a},
    {"name": "Conj", "symbols": ["Conj", (lexer2.has("and") ? {type: "and"} : and), "Atom"], "postprocess": ([a, b, c]) => props.Operator.conjunction(a, c)},
    {"name": "Conj", "symbols": ["Atom"], "postprocess": ([a]) => a},
    {"name": "Atom", "symbols": [(lexer2.has("not") ? {type: "not"} : not), "Atom"], "postprocess": ([a, b]) => props.Negation.of(b)},
    {"name": "Atom", "symbols": ["Prim"], "postprocess": ([a]) => a},
    {"name": "Prim", "symbols": [(lexer2.has("lparen") ? {type: "lparen"} : lparen), "Prop", (lexer2.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([a, b, c]) => b},
    {"name": "Prim", "symbols": [(lexer2.has("true") ? {type: "true"} : true)], "postprocess": ([a]) => props.TRUE},
    {"name": "Prim", "symbols": [(lexer2.has("false") ? {type: "false"} : false)], "postprocess": ([a]) => props.FALSE},
    {"name": "Prim", "symbols": [(lexer2.has("prop") ? {type: "prop"} : prop)], "postprocess": ([a]) => props.Variable.of(a.text)}
]
  , ParserStart: "Prop"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
