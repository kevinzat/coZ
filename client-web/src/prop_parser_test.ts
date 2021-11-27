import * as nearley from 'nearley';
import grammar from './prop_parser.js';
import * as assert from 'assert';
import { Operator, Negation, Variable, TRUE, FALSE } from './props';

describe('prop_parser', function() {
  it('Precedence', function() {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar as any));
    parser.feed("T or F and R");

    assert.equal(parser.results.length, 1);
    assert.equal(parser.results[0].equals(
        Operator.disjunction(TRUE,
            Operator.conjunction(FALSE, Variable.of("R")))),
        true);
  });

  it('Precedence 2', function() {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar as any));
    parser.feed("T and F or R");

    assert.equal(parser.results.length, 1);
    assert.equal(parser.results[0].equals(
        Operator.disjunction(
            Operator.conjunction(TRUE, FALSE),
            Variable.of("R"))),
        true);
  });

  it('Precedence 3', function() {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar as any));
    parser.feed("(T or F) and R");

    assert.equal(parser.results.length, 1);
    assert.equal(parser.results[0].equals(
        Operator.conjunction(
            Operator.disjunction(TRUE, FALSE),
            Variable.of("R"))),
        true);
  });

  it('Precedence 4', function() {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar as any));
    parser.feed("T and (F or P)");

    assert.equal(parser.results.length, 1);
    assert.equal(parser.results[0].equals(
        Operator.conjunction(TRUE,
            Operator.disjunction(FALSE, Variable.of("P")))),
        true);
  });

  it('Precedence 5', function() {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar as any));
    parser.feed("P implies Q implies R");

    assert.equal(parser.results.length, 1);
    assert.equal(parser.results[0].equals(
        Operator.implication(Variable.of("P"),
            Operator.implication(Variable.of("Q"), Variable.of("R")))),
        true);
  });

  it('Precedence 6', function() {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar as any));
    parser.feed("not T or not F and not R");

    assert.equal(parser.results.length, 1);
    assert.equal(parser.results[0].equals(
        Operator.disjunction(Negation.of(TRUE),
            Operator.conjunction(
                Negation.of(FALSE),
                Negation.of(Variable.of("R"))))),
        true);
  });

  it('Bug', function() {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar as any));
    parser.feed("not T or not F and not R");

    assert.equal(parser.results.length, 1);
    assert.equal(parser.results[0].equals(
        Operator.disjunction(Negation.of(TRUE),
            Operator.conjunction(
                Negation.of(FALSE),
                Negation.of(Variable.of("R"))))),
        true);
  });
});