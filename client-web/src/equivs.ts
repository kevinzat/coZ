import { Proposition, Negation, Operator } from './props';
import * as props from './props';


export const RULE_UNKNOWN = 0;
export const RULE_IDENTITY = 1;
export const RULE_DOMINATION = 2;
export const RULE_IDEMPOTENCY = 3;
export const RULE_COMMUTATIVITY = 4;
export const RULE_ASSOCIATIVITY = 5;
export const RULE_DISTRIBUTIVITY = 6;
export const RULE_ABSORPTION = 7;
export const RULE_NEGATION = 8;
export const RULE_DE_MORGAN = 9;
export const RULE_DOUBLE_NEGATION = 10;
export const RULE_LAW_OF_IMPLICATION = 11;
export const RULE_CONTRAPOSITIVE = 12;

export const RULE_VERSION_UNKNOWN = 0;
export const RULE_VERSION_AND = 1;
export const RULE_VERSION_OR = 2;


/**
 * Represents an equivalence rule. The varieties of rules are listed above.
 * Each rule can be applied left-to-right or right-to-left. For some rules,
 * when being applied right-to-left, there are multiple ways to do so, so the
 * "version" indicates which one to use.
 */
export class Equivalence {
  rule: number;
  leftToRight: boolean;  // no right-to-left for domination, absorption, negation
  version: number;       // for right-to-left with identity, idempotency, absorption

  constructor(rule: number, leftToRight?: boolean, version?: number) {
    this.rule = rule;
    this.leftToRight = (leftToRight === undefined) ? true : leftToRight;
    this.version = (version === undefined) ? 0 : version;
  }

  /** Determines whether this rule is the same as the given one. */
  equals(equiv: Equivalence) : boolean {
    return (this.rule === equiv.rule) &&
        (this.leftToRight === equiv.leftToRight) &&
        (this.version === equiv.version);
  }

  /** Returns a copy of this object. */
  copy() : Equivalence {
    return new Equivalence(this.rule, this.leftToRight, this.version);
  }

  // Determines whether this rule needs a version.
  hasVersion() : boolean {
    return !this.leftToRight &&
        (this.rule === RULE_IDENTITY || this.rule == RULE_IDEMPOTENCY);
  }

  /** Determines whether this has all the information needed to apply the rulej. */
  isComplete() : boolean {
    if (this.rule === RULE_UNKNOWN)
      return false;
    if (this.hasVersion() && (this.version === RULE_VERSION_UNKNOWN))
      return false;
    return true;
  }

  /** Returns the number of locations where the rule matches in the proposition. */
  matchCount(prop: Proposition) : number {
    return this.matches(prop).length;
  }

  /** Returns a list of the subexpressions where this rule applies. */
  matches(prop: Proposition) : Array<Proposition> {
    const result : Array<Proposition> = [];
    this._addMatches(prop, result);
    return result;
  }

  // Helper for "matches" above.
  _addMatches(prop: Proposition, matches: Array<Proposition>) {
    if (this._matchesAt(prop))
      matches.push(prop);

    if (prop.variety === props.PROP_VARIABLE ||
        prop.variety === props.PROP_TRUE ||
        prop.variety === props.PROP_FALSE) {
      // no children

    } else if (prop.variety === props.PROP_NEG) {
      const neg = prop as Negation;
      this._addMatches(neg.prop, matches);

    } else {
      const op = prop as Operator;
      this._addMatches(op.left, matches);
      this._addMatches(op.right, matches);
    }
  }

  /** 
   * Returns the result of replacing each (non-overlapping) match in the
   * proposition with the result of the rule.
   */
  applyAll(prop: Proposition) : Proposition {
    if (this._matchesAt(prop)) {
      return this._applyAt(prop);

    } else if (prop.variety === props.PROP_VARIABLE ||
               prop.variety === props.PROP_TRUE ||
               prop.variety === props.PROP_FALSE) {
      return prop;

    } else if (prop.variety === props.PROP_NEG) {
      const neg = prop as Negation;
      return Negation.of(this.applyAll(neg.prop));

    } else {
      const op = prop as Operator;
      if (op.variety === props.PROP_AND) {
        return Operator.conjunction(
            this.applyAll(op.left), this.applyAll(op.right));
      } else if (op.variety === props.PROP_OR) {
        return Operator.disjunction(
            this.applyAll(op.left), this.applyAll(op.right));
      } else if (op.variety === props.PROP_IMPLIES) {
        return Operator.implication(
            this.applyAll(op.left), this.applyAll(op.right));
      } else {
        throw new Error("bad variety: " + op.variety);
      }
    }
  }

  /** Returns the result of applying the rule a single time at the given match number. */
  applyOnce(prop: Proposition, matchNumber: number) : Proposition {
    const val = this._applyOnce(prop, matchNumber, 0);
    return val.result;
  }

  // Implements applyOnce recursively. The object returned includes the result,
  // the number of matches found so far, and the specific replacement made where
  // the rule was applied (if any).
  _applyOnce(prop: Proposition, matchNumber: number, beforeCount: number)
      : {result: Proposition, matchCount: number, replacement?: Proposition} {
    const cnt = this._matchesAt(prop) ? 1 : 0;

    if (cnt === 1 && (beforeCount === matchNumber)) {
      const repl = this._applyAt(prop);
      return {result: repl, matchCount: 1, replacement: repl};

    } else if (prop.variety === props.PROP_VARIABLE ||
               prop.variety === props.PROP_TRUE ||
               prop.variety === props.PROP_FALSE) {
      return {result: prop, matchCount: cnt};

    } else if (prop.variety === props.PROP_NEG) {
      const neg = prop as Negation;
      const sub = this._applyOnce(neg.prop, matchNumber, beforeCount);
      return {result: Negation.of(sub.result),
              matchCount: cnt + sub.matchCount,
              replacement: sub.replacement};

    } else {
      const op = prop as Operator;
      const sub1 = this._applyOnce(op.left, matchNumber, cnt + beforeCount);
      const sub2 = this._applyOnce(op.right, matchNumber,
          cnt + beforeCount + sub1.matchCount);
      if (op.variety === props.PROP_AND) {
        return {result: Operator.conjunction(sub1.result, sub2.result),
                matchCount: cnt + sub1.matchCount + sub2.matchCount,
                replacement: sub1.replacement || sub2.replacement};
      } else if (op.variety === props.PROP_OR) {
        return {result: Operator.disjunction(sub1.result, sub2.result),
                matchCount: cnt + sub1.matchCount + sub2.matchCount,
                replacement: sub1.replacement || sub2.replacement};
      } else if (op.variety === props.PROP_IMPLIES) {
        return {result: Operator.implication(sub1.result, sub2.result),
                matchCount: cnt + sub1.matchCount + sub2.matchCount,
                replacement: sub1.replacement || sub2.replacement};
      } else {
        throw new Error("bad variety: " + op.variety);
      }
    }
  }

  /** Determines whether this rule matches the whole proposition. */
  _matchesAt(prop: Proposition) : boolean {
    if (this.rule === 0)
      return false;

    return this.leftToRight ?
        this._matchesLeftToRight(prop) : this._matchesRightToLeft(prop);
  }

  /** Returns the result of applying it to the entire proposition given. */
  _applyAt(prop: Proposition) : Proposition {
    return this.leftToRight ?
        this._applyLeftToRight(prop) : this._applyRightToLeft(prop);
  }

  _matchesLeftToRight(prop: Proposition) : boolean {
    switch (this.rule) {
      case RULE_IDENTITY:
        return (
            prop.variety === props.PROP_AND &&
            (prop as Operator).right.variety === props.PROP_TRUE ||
            prop.variety === props.PROP_OR &&
            (prop as Operator).right.variety === props.PROP_FALSE);

      case RULE_DOMINATION:
        return (
            prop.variety === props.PROP_OR &&
            (prop as Operator).right.variety === props.PROP_TRUE ||
            prop.variety === props.PROP_AND &&
            (prop as Operator).right.variety === props.PROP_FALSE);

      case RULE_IDEMPOTENCY:
        return (
            (prop.variety === props.PROP_OR ||
             prop.variety === props.PROP_AND) &&
            (prop as Operator).left.equals((prop as Operator).right));

      case RULE_COMMUTATIVITY:
        return (prop.variety === props.PROP_OR ||
                prop.variety === props.PROP_AND);

      case RULE_ASSOCIATIVITY:
        return (prop.variety === props.PROP_OR) &&
            ((prop as Operator).left.variety === props.PROP_OR) ||
            (prop.variety === props.PROP_AND) &&
            ((prop as Operator).left.variety === props.PROP_AND);

      case RULE_DISTRIBUTIVITY:
        return (prop.variety === props.PROP_AND) &&
            ((prop as Operator).right.variety === props.PROP_OR) ||
            (prop.variety === props.PROP_OR) &&
            ((prop as Operator).right.variety === props.PROP_AND);

      case RULE_ABSORPTION:
        return (
            ((prop.variety === props.PROP_OR &&
              (prop as Operator).right.variety === props.PROP_AND) ||
             (prop.variety === props.PROP_AND &&
              (prop as Operator).right.variety === props.PROP_OR)) &&
            (prop as Operator).left.equals(
                ((prop as Operator).right as Operator).left));

      case RULE_NEGATION:
        return (
            (prop.variety === props.PROP_OR || prop.variety === props.PROP_AND) &&
            (prop as Operator).right.variety === props.PROP_NEG &&
            (prop as Operator).left.equals(
                ((prop as Operator).right as Negation).prop));

      case RULE_DE_MORGAN:
        return (
            prop.variety === props.PROP_NEG &&
            ((prop as Negation).prop.variety === props.PROP_OR ||
             (prop as Negation).prop.variety === props.PROP_AND));

      case RULE_DOUBLE_NEGATION:
        return (
            prop.variety === props.PROP_NEG &&
            (prop as Negation).prop.variety === props.PROP_NEG);

      case RULE_LAW_OF_IMPLICATION:
        return prop.variety === props.PROP_IMPLIES;

      case RULE_CONTRAPOSITIVE:
        return prop.variety === props.PROP_IMPLIES;

      default: throw new Error("Bad rule variety: " + this.rule);
    }
  }

  _applyLeftToRight(prop: Proposition) : Proposition {
    let op, op2, neg;
    switch (this.rule) {
      case RULE_IDENTITY:
        return (prop as Operator).left;

      case RULE_DOMINATION:
        return (prop.variety === props.PROP_OR) ? props.TRUE : props.FALSE;

      case RULE_IDEMPOTENCY:
        op = prop as Operator;
        return op.left;

      case RULE_COMMUTATIVITY:
        op = prop as Operator;
        return new Operator(op.variety, op.right, op.left);

      case RULE_ASSOCIATIVITY:
        op = prop as Operator;
        op2 = op.left as Operator;
        if (prop.variety === props.PROP_OR) {
          return Operator.disjunction(op2.left,
              Operator.disjunction(op2.right, op.right));
        } else {
          return Operator.conjunction(op2.left,
              Operator.conjunction(op2.right, op.right));
        }

      case RULE_DISTRIBUTIVITY:
        op = prop as Operator;
        op2 = op.right as Operator;
        if (prop.variety === props.PROP_AND) {
          return Operator.disjunction(
              Operator.conjunction(op.left, op2.left),
              Operator.conjunction(op.left, op2.right));
        } else {
          return Operator.conjunction(
              Operator.disjunction(op.left, op2.left),
              Operator.disjunction(op.left, op2.right));
        }

      case RULE_ABSORPTION:
        return (prop as Operator).left;

      case RULE_NEGATION:
        return (prop.variety === props.PROP_OR) ? props.TRUE : props.FALSE;

      case RULE_DE_MORGAN:
        neg = prop as Negation;
        op = neg.prop as Operator;
        return (op.variety === props.PROP_OR) ?
            Operator.conjunction(Negation.of(op.left), Negation.of(op.right)) :
            Operator.disjunction(Negation.of(op.left), Negation.of(op.right));

      case RULE_DOUBLE_NEGATION:
        neg = prop as Negation;
        neg = neg.prop as Negation;
        return neg.prop;

      case RULE_LAW_OF_IMPLICATION:
        op = prop as Operator;
        return Operator.disjunction(Negation.of(op.left), op.right);

      case RULE_CONTRAPOSITIVE:
        op = prop as Operator;
        return Operator.implication(
            Negation.of(op.right), Negation.of(op.left));

      default: throw new Error("Bad rule variety: " + this.rule);
    }
  }

  _matchesRightToLeft(prop: Proposition) : boolean {
    switch (this.rule) {
      case RULE_IDENTITY:
      case RULE_IDEMPOTENCY:
        return this.version !== 0;

      case RULE_COMMUTATIVITY:
        return prop.variety === props.PROP_AND || prop.variety === props.PROP_OR;

      case RULE_ASSOCIATIVITY:
        return (prop.variety === props.PROP_OR) &&
            ((prop as Operator).right.variety === props.PROP_OR) ||
            (prop.variety === props.PROP_AND) &&
            ((prop as Operator).right.variety === props.PROP_AND);

      case RULE_DISTRIBUTIVITY:
        return (prop.variety === props.PROP_OR) &&
            ((prop as Operator).left.variety === props.PROP_AND) &&
            ((prop as Operator).right.variety === props.PROP_AND) &&
            ((prop as Operator).left as Operator).left.equals(
                ((prop as Operator).right as Operator).left) ||
            (prop.variety === props.PROP_AND) &&
            ((prop as Operator).left.variety === props.PROP_OR) &&
            ((prop as Operator).right.variety === props.PROP_OR) &&
            ((prop as Operator).left as Operator).left.equals(
                ((prop as Operator).right as Operator).left);

      case RULE_DOMINATION:
      case RULE_ABSORPTION:
      case RULE_NEGATION:
        return false;  // cannot do these without knowing p/q

      case RULE_DE_MORGAN:
        return (prop.variety === props.PROP_AND ||
                prop.variety === props.PROP_OR) &&
            ((prop as Operator).left.variety === props.PROP_NEG) &&
            ((prop as Operator).right.variety === props.PROP_NEG);

      case RULE_DOUBLE_NEGATION:
        return true;

      case RULE_LAW_OF_IMPLICATION:
        return (prop.variety === props.PROP_OR) &&
            ((prop as Operator).left.variety === props.PROP_NEG);

      case RULE_CONTRAPOSITIVE:
        return (prop.variety === props.PROP_IMPLIES) &&
            ((prop as Operator).left.variety === props.PROP_NEG) &&
            ((prop as Operator).right.variety === props.PROP_NEG);

      default: throw new Error("Bad rule variety: " + this.rule);
    }
  }

  _applyRightToLeft(prop: Proposition) : Proposition {
    let op, op2;
    switch (this.rule) {
      case RULE_IDENTITY:
        if (this.version === RULE_VERSION_AND) {
          return Operator.conjunction(prop, props.TRUE);
        } else {
          return Operator.disjunction(prop, props.FALSE);
        }

      case RULE_IDEMPOTENCY:
        if (this.version === RULE_VERSION_AND) {
          return Operator.conjunction(prop, prop);
        } else {
          return Operator.disjunction(prop, prop);
        }

      case RULE_COMMUTATIVITY:
        op = prop as Operator;
        if (prop.variety === props.PROP_AND) {
          return Operator.conjunction(op.right, op.left);
        } else {
          return Operator.disjunction(op.right, op.left);
        }

      case RULE_ASSOCIATIVITY:
        op = prop as Operator;
        op2 = op.right as Operator;
        if (prop.variety === props.PROP_OR) {
          return Operator.disjunction(
              Operator.disjunction(op.left, op2.left), op2.right);
        } else {
          return Operator.conjunction(
              Operator.conjunction(op.left, op2.left), op2.right);
        }

      case RULE_DISTRIBUTIVITY:
        op = prop as Operator;
        op2 = op.left as Operator;
        if (prop.variety == props.PROP_OR) {
          return Operator.conjunction(op2.left,
              Operator.disjunction(op2.right, (op.right as Operator).right));
        } else {
          return Operator.disjunction(op2.left,
              Operator.conjunction(op2.right, (op.right as Operator).right));
        }

      case RULE_DOMINATION:
      case RULE_ABSORPTION:
      case RULE_NEGATION:
        throw new Error("impossible");

      case RULE_DE_MORGAN:
        op = prop as Operator;
        if (prop.variety === props.PROP_AND) {
          return Negation.of(Operator.disjunction(
              (op.left as Negation).prop, (op.right as Negation).prop));
        } else {
          return Negation.of(Operator.conjunction(
              (op.left as Negation).prop, (op.right as Negation).prop));
        }

      case RULE_DOUBLE_NEGATION:
        return Negation.of(Negation.of(prop));

      case RULE_LAW_OF_IMPLICATION:
        op = prop as Operator;
        return Operator.implication((op.left as Negation).prop, op.right);

      case RULE_CONTRAPOSITIVE:
        op = prop as Operator;
        return Operator.implication(
            (op.right as Negation).prop, (op.left as Negation).prop);

      default: throw new Error("Bad rule variety: " + this.rule);
    }
  }

  /** 
   * Returns a rule that can be applied to the <b>result</b> of applying this
   * rule to the given proposition (at the given match) in order to get back
   * the given proposition.
   *
  reverse(prop: Proposition, matchNumber: number) :
      {equiv: Equivalence, matchNumber: number} {

    const fwdMatches = this.matches(prop);
    const replaced = fwdMatches[matchNumber];

    // Apply the rule to get the forward result.
    const val = this._applyOnce(prop, matchNumber, 0);
    if (!val.replacement)
      throw new Error("rule does not apply");

    // Construct a rule that would turn replacement back to replaced.
    const rev = new Equivalence(this.rule, !this.leftToRight);
    if (!rev.isComplete()) {
      rev.version = (replaced.variety === props.PROP_AND) ?
          RULE_VERSION_AND : RULE_VERSION_OR;
    }

    // The reverse rule should match the replacement in the result above. Find
    // the number of that match, so we can return it.
    const revMatches = rev.matches(val.result);
    const revMatchNumber = revMatches.indexOf(val.replacement);

    return {equiv: rev, matchNumber: revMatchNumber};
  }
  */
}

