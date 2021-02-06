@{%
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
%}

@lexer lexer2

Prop ->
      Disj %implies Prop
      {% ([a, b, c]) => Operator.implication(a, c) %}
    | Disj
      {% ([a]) => a %}

Disj ->
      Disj %or Conj
      {% ([a, b, c]) => Operator.disjunction(a, c) %}
    | Conj
      {% ([a]) => a %}

Conj ->
      Conj %and Atom
      {% ([a, b, c]) => Operator.conjunction(a, c) %}
    | Atom
      {% ([a]) => a %}

Atom -> %not Atom               
      {% ([a, b]) => Negation.of(b) %}
    | Prim
      {% ([a]) => a %}

Prim -> %lparen Prop %rparen          {% ([a, b, c]) => b %}
    | %true                           {% TRUE %}
    | %false                          {% FALSE %}
    | %prop                           {% Variable.of(a.text) %}
