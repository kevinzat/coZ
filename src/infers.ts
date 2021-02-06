import { Proposition, Negation, Operator } from './props';
import * as props from './props';
import { Equivalence } from './equivs';


export const RULE_UNKNOWN = 0;
export const RULE_DIRECT_PROOF = 1;
export const RULE_MODUS_PONENS = 2;
export const RULE_INTRO_AND = 3;
export const RULE_ELIM_AND = 4;
export const RULE_INTRO_OR = 5;
export const RULE_ELIM_OR = 6;
export const RULE_EQUIVALENCE = 7;
export const RULE_ASSUMPTION = 8;

export const RULE_VERSION_UNKNOWN = 0;
export const RULE_VERSION_FIRST = 1;
export const RULE_VERSION_SECOND = 2;

/**
 * Represents an inference rule. The varieties of rules are listed above.
 * Each rule can be applied forward or backward. For some rules, there are
 * multiple ways to do so, so the "version" indicates which one to use.
 */
export class Inference {
  _rule: number;
  forward: boolean;
  version: number;                 // only for Intro OR backward
  equiv: Equivalence | undefined;  // only for Equivalence (then not undefned)
  matchNumber: number;             // only for Equivalence

  constructor(rule: number, forward?: boolean, version?: number,
        equiv?: Equivalence, matchNumber?: number) {
    this._rule = rule;
    this.forward = (forward === undefined) ? true : forward;
    this.version = (version === undefined) ? RULE_VERSION_UNKNOWN : version;
    if (rule === RULE_EQUIVALENCE) {
      this.equiv = (equiv === undefined) ? new Equivalence(0) : equiv;
    }
    this.matchNumber = (matchNumber === undefined) ? -1 : matchNumber;
  }

  get rule() { return this._rule; }
  set rule(value: number) {
    this._rule = value;
    if ((value === RULE_EQUIVALENCE) && (this.equiv === undefined))
      this.equiv = new Equivalence(0);
  }

  /** Determines whether this rule is the same as the given one. */
  equals(infer: Inference) : boolean {
    if ((this.rule !== infer.rule) || (this.forward !== infer.forward))
      return false;
    if (this.rule === RULE_INTRO_OR) {
      if (this.version !== infer.version)
        return false;
    }
    if (this.rule === RULE_EQUIVALENCE) {
      if ((infer.equiv === undefined) || !this.equiv!.equals(infer.equiv))
        return false;
    }
    return true;
  }

  /** Returns a copy of this object. */
  copy() : Inference {
    return new Inference(this.rule, this.forward, this.version, this.equiv);
  }

  /** Determines whether this has all the information needed to apply the rulej. */
  isComplete() : boolean {
    if (this.rule === RULE_UNKNOWN)
      return false;
    if (this.hasVersion() && (this.version === RULE_VERSION_UNKNOWN))
      return false;
    if ((this.rule === RULE_EQUIVALENCE) && (this.equiv === undefined))
      return false;
    if ((this.rule === RULE_EQUIVALENCE) && !this.equiv!.isComplete())
      return false;
    return true;
  }

  /** Determines whether a version parameter is needed. */
  hasVersion() : boolean {
    return this.forward && this.numOutputs() == 2 ||
        !this.forward && (this.rule === RULE_INTRO_OR);
  }

  /** Returns the number of required inputs when applying the rule. */
  numInputs() : number {
    switch (this.rule) {
      case RULE_UNKNOWN:        return 0;
      case RULE_DIRECT_PROOF:   return 1;
      case RULE_MODUS_PONENS:   return this.forward ? 2 : 1;
      case RULE_INTRO_AND:      return this.forward ? 2 : 1;
      case RULE_ELIM_AND:       return this.forward ? 1 : 2;
      case RULE_INTRO_OR:       return this.forward ? 1 : 2;
      case RULE_ELIM_OR:        return this.forward ? 2 : 1;
      case RULE_EQUIVALENCE:    return 1;
      case RULE_ASSUMPTION:     return 1;
      default: throw new Error("Bad rule: " + this.rule);
    }
  }

  /** Returns the number of outputs when applying the rule. */
  numOutputs() : number {
    switch (this.rule) {
      case RULE_UNKNOWN:        return 0;
      case RULE_DIRECT_PROOF:   return 2;
      case RULE_MODUS_PONENS:   return this.forward ? 1 : 2;
      case RULE_INTRO_AND:      return this.forward ? 1 : 2;
      case RULE_ELIM_AND:       return this.forward ? 2 : 1;
      case RULE_INTRO_OR:       return this.forward ? 2 : 1;
      case RULE_ELIM_OR:        return this.forward ? 1 : 2;
      case RULE_EQUIVALENCE:    return 1;
      case RULE_ASSUMPTION:     return 0;
      default: throw new Error("Bad rule: " + this.rule);
    }
  }

  /** Determines whether this rule can be applied to the given proposition(s). */
  matches(props: Array<Proposition>) : boolean {
    return this.forward ?
        this._matchesForward(props) : this._matchesBackward(props);
  }

  _matchesForward(ps: Array<Proposition>) : boolean {
    switch (this.rule) {
      case RULE_DIRECT_PROOF:
      case RULE_ASSUMPTION:
        return false;  // TODO: implement?

      case RULE_MODUS_PONENS:
        return ps.length === 2 && ps[1].variety === props.PROP_IMPLIES &&
            (ps[1] as Operator).left.equals(ps[0]);

      case RULE_INTRO_AND:
        return ps.length === 2;

      case RULE_ELIM_AND:
        return ps.length === 1 && ps[0].variety === props.PROP_AND;

      case RULE_INTRO_OR:
        return false;  // TODO: implement

      case RULE_ELIM_OR:
        return ps.length === 2 &&
            ps[0].variety === props.PROP_OR &&
            ps[1].variety === props.PROP_NEG &&
            (ps[0] as Operator).left.equals((ps[1] as Negation).prop);

      case RULE_EQUIVALENCE:
        return this._matchesBackward(ps);  // no difference here

      default:
        throw new Error("Bad rule: " + this.rule);
    }
  }

  _matchesBackward(ps: Array<Proposition>) : boolean {
    switch (this.rule) {
      case RULE_DIRECT_PROOF:
        return ps.length === 1 && ps[0].variety === props.PROP_IMPLIES;

      case RULE_MODUS_PONENS:
      case RULE_ELIM_OR:
          return false;  // TODO: implement

      case RULE_INTRO_AND:
          return ps.length === 1 && ps[0].variety === props.PROP_AND;

      case RULE_ELIM_AND:
          return ps.length === 2;

      case RULE_INTRO_OR:
          return ps.length === 1 && ps[0].variety === props.PROP_OR;

      case RULE_EQUIVALENCE:
        if (ps.length !== 1) {
          return false;
        } else {
          let matches = this.equiv!.matches(ps[0]);
          return (matches.length > 0) &&
              (this.matchNumber < 0 || this.matchNumber < matches.length);
        }

      case RULE_ASSUMPTION:
        return true;

      default:
        throw new Error("Bad rule: " + this.rule);
    }
  }

  /** Produces the result of applying the rule forward. */
  // Note: this can be called for backward rules.
  applyForward(ps: Array<Proposition>) : Proposition {
    switch (this.rule) {
      case RULE_MODUS_PONENS:
        return (ps[1] as Operator).right;

      case RULE_INTRO_AND:
        return Operator.conjunction(ps[0], ps[1]);

      case RULE_ELIM_AND:
        return (this.version === RULE_VERSION_FIRST) ?
            (ps[0] as Operator).left : (ps[0] as Operator).right;

      case RULE_ELIM_OR:
        return (ps[0] as Operator).right;

      case RULE_EQUIVALENCE:
        if (this.matchNumber < 0) {
          return this.equiv!.applyAll(ps[0]);
        } else {
          return this.equiv!.applyOnce(ps[0], this.matchNumber!);
        }

      case RULE_DIRECT_PROOF:
      case RULE_ASSUMPTION:
        // should not be used forward

      case RULE_INTRO_OR:   
        // not allowed (for now)

      default:
        throw new Error("Bad rule: " + this.rule);
    }
  }

  /** Produces the results of applying the rule backward. */
  applyBackward(ps: Array<Proposition>) : Array<Proposition> {
    if (this.forward)
      throw new Error("not a backward rule");

    switch (this.rule) {
      case RULE_ASSUMPTION:
        return [];

      case RULE_DIRECT_PROOF:
        return [(ps[0] as Operator).left, (ps[0] as Operator).right];

      case RULE_INTRO_AND:
        return [(ps[0] as Operator).left, (ps[0] as Operator).right];

      case RULE_ELIM_AND:
        return [Operator.conjunction(ps[0], ps[1])];

      case RULE_INTRO_OR:
        return (this.version === RULE_VERSION_FIRST) ?
            [(ps[0] as Operator).left] : [(ps[0] as Operator).right];

      case RULE_EQUIVALENCE:
        return [this.applyForward(ps)];  // no difference here

      case RULE_MODUS_PONENS:
      case RULE_ELIM_OR:
        // not allowed (for now)

      default:
        throw new Error("Bad rule: " + this.rule);
    }
  }
}