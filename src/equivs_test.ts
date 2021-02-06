import { Variable, Negation, Operator } from './props';
import * as props from './props';
import { Equivalence } from './equivs';
import * as equivs from './equivs';
import * as assert from 'assert';

describe('equivalences', function() {
  it('Identity AND', function(){
    const equiv1 = new Equivalence(equivs.RULE_IDENTITY);
    const prop1 = Operator.conjunction(new Variable("P"), props.TRUE);
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(new Variable("P")), true);

    const equiv2 = new Equivalence(equivs.RULE_IDENTITY, false, equivs.RULE_VERSION_AND);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('Identity OR', function(){
    const equiv1 = new Equivalence(equivs.RULE_IDENTITY);
    const prop1 = Operator.disjunction(new Variable("P"), props.FALSE);
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(new Variable("P")), true);

    const equiv2 = new Equivalence(equivs.RULE_IDENTITY, false, equivs.RULE_VERSION_OR);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('Domination AND', function(){
    const equiv1 = new Equivalence(equivs.RULE_DOMINATION);
    const prop1 = Operator.conjunction(new Variable("P"), props.FALSE);
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(props.FALSE), true);
  });

  it('Domination OR', function(){
    const equiv1 = new Equivalence(equivs.RULE_DOMINATION);
    const prop1 = Operator.disjunction(new Variable("P"), props.TRUE);
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(props.TRUE), true);
  });

  it('Idempotency AND', function(){
    const equiv1 = new Equivalence(equivs.RULE_IDEMPOTENCY);
    const prop1 = Operator.conjunction(new Variable("P"), new Variable("P"));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(new Variable("P")), true);

    const equiv2 = new Equivalence(equivs.RULE_IDEMPOTENCY, false, equivs.RULE_VERSION_AND);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('Idempotency OR', function(){
    const equiv1 = new Equivalence(equivs.RULE_IDEMPOTENCY);
    const prop1 = Operator.disjunction(new Variable("P"), new Variable("P"));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(new Variable("P")), true);

    const equiv2 = new Equivalence(equivs.RULE_IDEMPOTENCY, false, equivs.RULE_VERSION_OR);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('Commutativity AND', function(){
    const equiv1 = new Equivalence(equivs.RULE_COMMUTATIVITY);
    const prop1 = Operator.conjunction(new Variable("P"), new Variable("Q"));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(
            Operator.conjunction(new Variable("Q"), new Variable("P"))),
        true);

    const equiv2 = new Equivalence(equivs.RULE_COMMUTATIVITY, false);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('Commutativity OR', function(){
    const equiv1 = new Equivalence(equivs.RULE_COMMUTATIVITY);
    const prop1 = Operator.disjunction(new Variable("P"), new Variable("Q"));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(
            Operator.disjunction(new Variable("Q"), new Variable("P"))),
        true);

    const equiv2 = new Equivalence(equivs.RULE_COMMUTATIVITY, false);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('Associativity AND', function(){
    const equiv1 = new Equivalence(equivs.RULE_ASSOCIATIVITY);
    const prop1 = Operator.conjunction(
        Operator.conjunction(new Variable("P"), new Variable("Q")),
        new Variable("R"));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(
            Operator.conjunction(new Variable("P"),
                Operator.conjunction(new Variable("Q"), new Variable("R")))),
        true);

    const equiv2 = new Equivalence(equivs.RULE_ASSOCIATIVITY, false);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('Associativity OR', function(){
    const equiv1 = new Equivalence(equivs.RULE_ASSOCIATIVITY);
    const prop1 = Operator.disjunction(
        Operator.disjunction(new Variable("P"), new Variable("Q")),
        new Variable("R"));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(
            Operator.disjunction(new Variable("P"),
                Operator.disjunction(new Variable("Q"), new Variable("R")))),
        true);

    const equiv2 = new Equivalence(equivs.RULE_ASSOCIATIVITY, false);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('Distributivity AND', function(){
    const equiv1 = new Equivalence(equivs.RULE_DISTRIBUTIVITY);
    const prop1 = Operator.conjunction(new Variable("P"),
        Operator.disjunction(new Variable("Q"), new Variable("R")));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(
            Operator.disjunction(
                Operator.conjunction(new Variable("P"), new Variable("Q")),
                Operator.conjunction(new Variable("P"), new Variable("R")))),
        true);

    const equiv2 = new Equivalence(equivs.RULE_DISTRIBUTIVITY, false);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('Distributivity OR', function(){
    const equiv1 = new Equivalence(equivs.RULE_DISTRIBUTIVITY);
    const prop1 = Operator.disjunction(new Variable("P"),
        Operator.conjunction(new Variable("Q"), new Variable("R")));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(
            Operator.conjunction(
                Operator.disjunction(new Variable("P"), new Variable("Q")),
                Operator.disjunction(new Variable("P"), new Variable("R")))),
        true);

    const equiv2 = new Equivalence(equivs.RULE_DISTRIBUTIVITY, false);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('Absorption AND', function(){
    const equiv1 = new Equivalence(equivs.RULE_ABSORPTION);
    const prop1 = Operator.conjunction(new Variable("P"),
        Operator.disjunction(new Variable("P"), new Variable("Q")));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(new Variable("P")), true);
  });

  it('Absorption OR', function(){
    const equiv1 = new Equivalence(equivs.RULE_ABSORPTION);
    const prop1 = Operator.disjunction(new Variable("P"),
        Operator.conjunction(new Variable("P"), new Variable("Q")));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(new Variable("P")), true);
  });

  it('Negation AND', function(){
    const equiv1 = new Equivalence(equivs.RULE_NEGATION);
    const prop1 = Operator.conjunction(new Variable("P"),
        Negation.of(new Variable("P")));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(props.FALSE), true);
  });

  it('Negation OR', function(){
    const equiv1 = new Equivalence(equivs.RULE_NEGATION);
    const prop1 = Operator.disjunction(new Variable("P"),
        Negation.of(new Variable("P")));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(props.TRUE), true);
  });

  it('De Morgan AND', function(){
    const equiv1 = new Equivalence(equivs.RULE_DE_MORGAN);
    const prop1 = Negation.of(
        Operator.conjunction(new Variable("P"), new Variable("Q")));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(Operator.disjunction(
            Negation.of(new Variable("P")), Negation.of(new Variable("Q")))),
        true);

    const equiv2 = new Equivalence(equivs.RULE_DE_MORGAN, false);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('De Morgan OR', function(){
    const equiv1 = new Equivalence(equivs.RULE_DE_MORGAN);
    const prop1 = Negation.of(
        Operator.disjunction(new Variable("P"), new Variable("Q")));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(Operator.conjunction(
            Negation.of(new Variable("P")), Negation.of(new Variable("Q")))),
        true);

    const equiv2 = new Equivalence(equivs.RULE_DE_MORGAN, false);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('Double Negation', function(){
    const equiv1 = new Equivalence(equivs.RULE_DOUBLE_NEGATION);
    const prop1 = Negation.of(Negation.of(new Variable("P")));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(new Variable("P")), true);

    const equiv2 = new Equivalence(equivs.RULE_DOUBLE_NEGATION, false);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('Law of Implication', function(){
    const equiv1 = new Equivalence(equivs.RULE_LAW_OF_IMPLICATION);
    const prop1 = Operator.implication(new Variable("P"), new Variable("Q"));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(
        Operator.disjunction(Negation.of(new Variable("P")), new Variable("Q"))),
        true);

    const equiv2 = new Equivalence(equivs.RULE_LAW_OF_IMPLICATION, false);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('Contrapositive', function(){
    const equiv1 = new Equivalence(equivs.RULE_CONTRAPOSITIVE);
    const prop1 = Operator.implication(new Variable("P"), new Variable("Q"));
    assert.equal(equiv1.matchCount(prop1), 1);

    const prop2 = equiv1.applyOnce(prop1, 0);
    assert.equal(prop2.equals(Operator.implication(
        Negation.of(new Variable("Q")), Negation.of(new Variable("P")))),
        true);

    const equiv2 = new Equivalence(equivs.RULE_CONTRAPOSITIVE, false);
    assert.equal(equiv2.matchCount(prop2), 1);

    const prop3 = equiv2.applyOnce(prop2, 0);
    assert.equal(prop3.equals(prop1), true);

//    assert.equal(equiv1.reverse(prop1, 0).equiv.equals(equiv2), true);
//    assert.equal(equiv1.reverse(prop1, 0).matchNumber, 0);

//    assert.equal(equiv2.reverse(prop2, 0).equiv.equals(equiv1), true);
//    assert.equal(equiv2.reverse(prop2, 0).matchNumber, 0);
  });

  it('applyAll', function(){
    const equiv = new Equivalence(equivs.RULE_DOUBLE_NEGATION);
    const prop = Operator.conjunction(
        Operator.disjunction(
            Negation.of(Negation.of(new Variable("P"))), new Variable("Q")),
        Operator.disjunction(new Variable("Q"),
            Negation.of(Negation.of(new Variable("P")))));
    assert.equal(equiv.matchCount(prop), 2);

    const prop2 = equiv.applyAll(prop);
    assert.equal(prop2.equals(Operator.conjunction(
            Operator.disjunction(new Variable("P"), new Variable("Q")),
            Operator.disjunction(new Variable("Q"), new Variable("P")))),
        true);
  });

  it('applyOnce', function(){
    const equiv = new Equivalence(equivs.RULE_DOUBLE_NEGATION);
    const prop = Operator.conjunction(
        Operator.disjunction(
            Negation.of(Negation.of(new Variable("P"))), new Variable("Q")),
        Operator.disjunction(new Variable("Q"),
            Negation.of(Negation.of(new Variable("P")))));
    assert.equal(equiv.matchCount(prop), 2);

    const prop2 = equiv.applyOnce(prop, 0);
    assert.equal(prop2.equals(Operator.conjunction(
            Operator.disjunction(new Variable("P"), new Variable("Q")),
            Operator.disjunction(new Variable("Q"),
                Negation.of(Negation.of(new Variable("P")))))),
        true);

    const prop3 = equiv.applyOnce(prop, 1);
    assert.equal(prop3.equals(Operator.conjunction(
            Operator.disjunction(
                Negation.of(Negation.of(new Variable("P"))), new Variable("Q")),
            Operator.disjunction(new Variable("Q"), new Variable("P")))),
        true);
  });

  it('applyOnce 2', function(){
    const equiv = new Equivalence(equivs.RULE_COMMUTATIVITY);
    const prop = Operator.conjunction(
        Operator.disjunction(new Variable("P"), new Variable("Q")),
        Operator.disjunction(new Variable("Q"), new Variable("P")));
    assert.equal(equiv.matchCount(prop), 3);

    const prop2 = equiv.applyOnce(prop, 0);
    assert.equal(prop2.equals(Operator.conjunction(
            Operator.disjunction(new Variable("Q"), new Variable("P")),
            Operator.disjunction(new Variable("P"), new Variable("Q")))),
        true);

    const prop3 = equiv.applyOnce(prop, 1);
    assert.equal(prop3.equals(Operator.conjunction(
            Operator.disjunction(new Variable("Q"), new Variable("P")),
            Operator.disjunction(new Variable("Q"), new Variable("P")))),
        true);

    const prop4 = equiv.applyOnce(prop, 2);
    assert.equal(prop4.equals(Operator.conjunction(
            Operator.disjunction(new Variable("P"), new Variable("Q")),
            Operator.disjunction(new Variable("P"), new Variable("Q")))),
        true);
  });

  it('applyOnce 3', function(){
    const equiv = new Equivalence(equivs.RULE_LAW_OF_IMPLICATION);
    const prop = Operator.implication(new Variable("P"),
        Operator.implication(new Variable("Q"), new Variable("R")));
    assert.equal(equiv.matchCount(prop), 2);

    const prop2 = equiv.applyOnce(prop, 0);
    assert.equal(prop2.equals(Operator.disjunction(
            Negation.of(new Variable("P")),
            Operator.implication(new Variable("Q"), new Variable("R")))),
        true);

    const prop3 = equiv.applyOnce(prop, 1);
    assert.equal(prop3.equals(Operator.implication(new Variable("P"),
            Operator.disjunction(
                  Negation.of(new Variable("Q")), new Variable("R")))),
        true);
  });

  /*
  it('reverse', function(){
    const equiv = new Equivalence(equivs.RULE_IDENTITY);
    const prop = Operator.conjunction(
        Operator.disjunction(new Variable("P"), props.FALSE),
        Operator.disjunction(new Variable("Q"), props.FALSE));
    assert.equal(equiv.matchCount(prop), 2);

    const prop2 = equiv.applyOnce(prop, 0);
    const rev2 = equiv.reverse(prop, 0);
    assert.equal(prop.equals(rev2.equiv.applyOnce(prop2, rev2.matchNumber)),
        true);

    const prop3 = equiv.applyOnce(prop, 1);
    const rev3 = equiv.reverse(prop, 1);
    assert.equal(prop.equals(rev3.equiv.applyOnce(prop3, rev3.matchNumber)),
        true);
  });

  it('reverse 2', function(){
    const equiv = new Equivalence(equivs.RULE_COMMUTATIVITY);
    const prop = Operator.conjunction(
        Operator.disjunction(new Variable("P"), new Variable("Q")),
        Operator.disjunction(new Variable("Q"), new Variable("P")));
    assert.equal(equiv.matchCount(prop), 3);

    const prop2 = equiv.applyOnce(prop, 0);
    const rev2 = equiv.reverse(prop, 0);
    assert.equal(prop.equals(rev2.equiv.applyOnce(prop2, rev2.matchNumber)),
        true);

    const prop3 = equiv.applyOnce(prop, 1);
    const rev3 = equiv.reverse(prop, 1);
    assert.equal(prop.equals(rev3.equiv.applyOnce(prop3, rev3.matchNumber)),
        true);

    const prop4 = equiv.applyOnce(prop, 0);
    const rev4 = equiv.reverse(prop, 0);
    assert.equal(prop.equals(rev4.equiv.applyOnce(prop4, rev4.matchNumber)),
        true);
  });

  it('reverse 3', function(){
    const equiv = new Equivalence(equivs.RULE_LAW_OF_IMPLICATION);
    const prop = Operator.implication(new Variable("P"),
        Operator.implication(new Variable("Q"), new Variable("R")));
    assert.equal(equiv.matchCount(prop), 2);

    const prop2 = equiv.applyOnce(prop, 0);
    const rev2 = equiv.reverse(prop, 0);
    assert.equal(prop.equals(rev2.equiv.applyOnce(prop2, rev2.matchNumber)),
        true);

    const prop3 = equiv.applyOnce(prop, 1);
    const rev3 = equiv.reverse(prop, 1);
    assert.equal(prop.equals(rev3.equiv.applyOnce(prop3, rev3.matchNumber)),
        true);
  });
  */

});
