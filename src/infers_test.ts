import * as assert from 'assert';
import { Variable, Negation, Operator } from './props';
import * as props from './props';
import { Inference } from './infers';
import * as infers from './infers';
import { Equivalence } from './equivs';
import * as equivs from './equivs';

describe('inferences', function() {
  it('Direct Proof (backward)', function() {
    const infer = new Inference(infers.RULE_DIRECT_PROOF, false);
    const prop1 = Operator.implication(props.FALSE, Variable.of("P"));

    assert.equal(infer.matches([prop1]), true);
    assert.equal(infer.applyBackward([prop1]).length, 0);
  });

  it('Modus Ponens (forward)', function() {
    const infer = new Inference(infers.RULE_MODUS_PONENS);
    const prop1 = Variable.of("P")
    const prop2 = Operator.implication(Variable.of("P"), Variable.of("Q"));
    const prop3 = Variable.of("Q");

    assert.equal(infer.matches([prop1, prop2]), true);
    assert.equal(infer.applyForward([prop1, prop2]).equals(prop3), true);
  });

  it('Intro AND (forward)', function() {
    const infer = new Inference(infers.RULE_INTRO_AND);
    const prop1 = Variable.of("P")
    const prop2 = Variable.of("Q");
    const prop3 = Operator.conjunction(Variable.of("P"), Variable.of("Q"));

    assert.equal(infer.matches([prop1, prop2]), true);
    assert.equal(infer.applyForward([prop1, prop2]).equals(prop3), true);
  });

  it('Intro AND (backward)', function() {
    const infer = new Inference(infers.RULE_INTRO_AND, false);
    const prop1 = Variable.of("P")
    const prop2 = Variable.of("Q");
    const prop3 = Operator.conjunction(Variable.of("P"), Variable.of("Q"));

    assert.equal(infer.matches([prop3]), true);
    assert.equal(infer.applyBackward([prop3]).length, 2);
    assert.equal(infer.applyBackward([prop3])[0].equals(prop1), true);
    assert.equal(infer.applyBackward([prop3])[1].equals(prop2), true);
  });

  it('Elim AND (forward)', function() {
    const infer1 = new Inference(infers.RULE_ELIM_AND, true, 1);
    const prop1 = Variable.of("P")
    const prop2 = Variable.of("Q");
    const prop3 = Operator.conjunction(Variable.of("P"), Variable.of("Q"));

    assert.equal(infer1.matches([prop3]), true);
    assert.equal(infer1.applyForward([prop3]).equals(prop1), true);

    const infer2 = new Inference(infers.RULE_ELIM_AND, true, 2);
    assert.equal(infer2.matches([prop3]), true);
    assert.equal(infer2.applyForward([prop3]).equals(prop2), true);
  });

  it('Elim AND (backward)', function() {
    const infer = new Inference(infers.RULE_ELIM_AND, false);
    const prop1 = Variable.of("P")
    const prop2 = Variable.of("Q");
    const prop3 = Operator.conjunction(Variable.of("P"), Variable.of("Q"));

    assert.equal(infer.matches([prop1, prop2]), true);
    assert.equal(infer.applyBackward([prop1, prop2]).length, 1);
    assert.equal(infer.applyBackward([prop1, prop2])[0].equals(prop3), true);
  });

  it('Intro OR (backward)', function() {
    const infer1 = new Inference(infers.RULE_INTRO_OR, false, 1);
    const prop1 = Variable.of("P")
    const prop2 = Variable.of("Q");
    const prop3 = Operator.disjunction(prop1, prop2);

    assert.equal(infer1.matches([prop3]), true);
    assert.equal(infer1.applyBackward([prop3]).length, 1);
    assert.equal(infer1.applyBackward([prop3])[0].equals(prop1), true);

    const infer2 = new Inference(infers.RULE_INTRO_OR, false, 2);

    assert.equal(infer2.matches([prop3]), true);
    assert.equal(infer2.applyBackward([prop3]).length, 1);
    assert.equal(infer2.applyBackward([prop3])[0].equals(prop2), true);
  });

  it('Elim OR (forward)', function() {
    const infer = new Inference(infers.RULE_ELIM_OR);
    const prop1 = Operator.disjunction(Variable.of("P"), Variable.of("Q"));
    const prop2 = Negation.of(Variable.of("P"));
    const prop3 = Variable.of("Q");

    assert.equal(infer.matches([prop1, prop2]), true);
    assert.equal(infer.applyForward([prop1, prop2]).equals(prop3), true);
  });

  it('Equivalence', function() {
    const infer1 = new Inference(infers.RULE_EQUIVALENCE, true, 0,
        new Equivalence(equivs.RULE_LAW_OF_IMPLICATION));
    const prop1 = Operator.implication(Variable.of("P"), Variable.of("Q"));
    const prop2 = Operator.disjunction(
        Negation.of(Variable.of("P")), Variable.of("Q"));

    assert.equal(infer1.matches([prop1]), true);
    assert.equal(infer1.applyForward([prop1]).equals(prop2), true);

    const infer2 = new Inference(infers.RULE_EQUIVALENCE, true, 0,
        new Equivalence(equivs.RULE_LAW_OF_IMPLICATION, false));

    assert.equal(infer2.matches([prop2]), true);
    assert.equal(infer2.applyForward([prop2]).equals(prop1), true);

    const infer3 = new Inference(infers.RULE_EQUIVALENCE, false, 0,
        new Equivalence(equivs.RULE_LAW_OF_IMPLICATION));

    assert.equal(infer3.matches([prop1]), true);
    assert.equal(infer3.applyBackward([prop1]).length, 1);
    assert.equal(infer3.applyBackward([prop1])[0].equals(prop2), true);
  });

  it('Equivalence w/ version', function() {
    const infer1 = new Inference(infers.RULE_EQUIVALENCE, true, 0,
        new Equivalence(equivs.RULE_LAW_OF_IMPLICATION));
    const prop1 = Operator.conjunction(
        Operator.implication(Variable.of("P"), Variable.of("Q")),
        Operator.implication(Variable.of("P"), Variable.of("Q")));
    const prop2 = Operator.conjunction(
        Operator.disjunction(
            Negation.of(Variable.of("P")), Variable.of("Q")),
        Operator.disjunction(
            Negation.of(Variable.of("P")), Variable.of("Q")));

    assert.equal(infer1.matches([prop1]), true);
    assert.equal(infer1.applyForward([prop1]).equals(prop2), true);

    const infer2 = new Inference(infers.RULE_EQUIVALENCE, true, 0,
        new Equivalence(equivs.RULE_LAW_OF_IMPLICATION), 1);
    const prop3 = Operator.conjunction(
        Operator.implication(Variable.of("P"), Variable.of("Q")),
        Operator.disjunction(
            Negation.of(Variable.of("P")), Variable.of("Q")));

    assert.equal(infer2.matches([prop1]), true);
    assert.equal(infer2.applyForward([prop1]).equals(prop3), true);
  });
});