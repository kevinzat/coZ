import React, { ChangeEvent } from 'react';
import { Proposition, Variable, Negation, Operator } from './props';
import * as props from './props';
import { Equivalence } from './equivs';
import * as equivs from './equivs';
import grammar from './prop_parser.js';
import * as nearley from 'nearley';
import './EquivalenceChain.css';


// A pair of successive rules can be of the forms -> ->, <- <-, or -> <- but not
// <- -> since that would require the rule in the middle to be applied in two
// directions (whereas only one, forward or backward, is allowed).
//
// A consequence of this is that there can be, at most, one place where the
// direction changes in the proof.

// Represents an individual line in the chain. Each has a proposition and a rule
// that attempts to generate that proposition from the previous one or vice versa.
class Line {
  prop: Proposition;
  equiv: Equivalence;
  matchNumber: number;               // use -1 for all
  forward: boolean;                  // forward or backward reasoning
  genFrom: Proposition | undefined;  // indicates the line whose updates can
                                     // change this one
  editable: boolean;                 // show editing even if correct

  constructor(prop: Proposition, equiv?: Equivalence, matchNumber?: number,
      forward?: boolean, editable?: boolean, genFrom?: Proposition | undefined) {
    this.prop = prop;
    this.equiv = (equiv === undefined) ? new Equivalence(equivs.RULE_UNKNOWN) : equiv;
    this.matchNumber = (matchNumber === undefined) ? -1 : matchNumber;
    this.forward = (forward === undefined) ? true : forward;
    this.editable = (editable === undefined) ? false : editable;
    this.genFrom = genFrom;
  }

  // Returns a new line with the same contents as this one.
  copy() : Line {
    return new Line(this.prop, this.equiv, this.matchNumber,
        this.forward, this.editable, this.genFrom);
  }

  // Returns the number of matches of the equivalence to the relevant proposition.
  matchCount(prevProp: Proposition) : number {
    if (!this.equiv.isComplete()) {
      return 0;
    } else if (this.forward) {
      return this.equiv.matchCount(prevProp);
    } else {
      return this.equiv.matchCount(this.prop);
    }
  }

  // Returns a set containing all the (strict) sub-propositions of the given
  // proposition where the rule would be applied.
  matchSet(prop: Proposition) : Set<Proposition> {
    if (!this.equiv.isComplete())
      return new Set();
    
    const matches = this.equiv.matches(prop);
    if (this.matchNumber < 0) {
      return new Set(matches.filter(p => p !== prop))
    } else if (this.matchNumber < matches.length) {
      const match = matches[this.matchNumber];
      return new Set((match === prop) ? [] : [match]);
    } else {
      return new Set();
    }
  }

  // Determines whether this rule can be applied.
  isApplicable(prevProp: Proposition) : boolean {
    if (!this.equiv.isComplete())
      return false;

    const count = this.matchCount(prevProp);
    if ((count === 0) || (this.matchNumber >= count))
      return false;

    return true;
  }

  // Returns the result of applying this rule or undefined if incorrect.
  apply(prevProp: Proposition) : Proposition {
    if (!this.isApplicable(prevProp))
      throw new Error("not applicable");

    const prop = this.forward ? prevProp : this.prop;
    return (this.matchNumber < 0) ? this.equiv.applyAll(prop) :
        this.equiv.applyOnce(prop, this.matchNumber);
  }

  // Determines whether this rule correctly produces the other proposition.
  isCorrect(prevProp: Proposition) : boolean {
    if (!this.isApplicable(prevProp))
      return false;

    let result = this.apply(prevProp);
    if (this.forward) {
      return this.prop.equals(result);
    } else {
      return prevProp.equals(result);
    }
  }

  // Returns a description of the rule being applied. Note that this is the same
  // whether the rule is read forward or backward.
  ruleName() : string {
    switch (this.equiv.rule) {
      case equivs.RULE_IDENTITY:             return "Identity";
      case equivs.RULE_DOMINATION:           return "Domination";
      case equivs.RULE_IDEMPOTENCY:          return "Idempotency";
      case equivs.RULE_COMMUTATIVITY:        return "Commutativity";
      case equivs.RULE_ASSOCIATIVITY:        return "Associativity";
      case equivs.RULE_DISTRIBUTIVITY:       return "Distributivity";
      case equivs.RULE_ABSORPTION:           return "Absorption";
      case equivs.RULE_NEGATION:             return "Negation";
      case equivs.RULE_DE_MORGAN:            return "De Morgan";
      case equivs.RULE_DOUBLE_NEGATION:      return "Double Negation";
      case equivs.RULE_LAW_OF_IMPLICATION:   return "Law of Implication";
      case equivs.RULE_CONTRAPOSITIVE:       return "Contrapositive";
      default: throw new Error("Bad rule: " + this.equiv.rule);
    }
  }
}


export interface EquivalenceChainProps {
  value: string,  // JSON storing initial state
  onChange?: (value: string) => void
}

interface EquivalenceChainState {
  startProp: Proposition,
  endProp: Proposition,
  lines: Array<Line>,  // does not include startProp
}


export default class EquivalenceChain
    extends React.Component<EquivalenceChainProps, EquivalenceChainState> {

  constructor(props: EquivalenceChainProps) {
    super(props);

    const data = JSON.parse(this.props.value);
    const startProp = ParseProp((data.startProp !== undefined) ?
        data.startProp as string : "P implies Q implies R");
    const endProp = ParseProp((data.endProp !== undefined) ?
        data.endProp as string : "Q implies P implies R");

    const lines = [];
    if (data.lines !== undefined && data.lines.length) {
      for (let i = 0; i < data.lines.length; i++) {
        lines.push(new Line(
          ParseProp(data.lines[i].prop),
          new Equivalence(data.lines[i].rule,
              data.lines[i].leftToRight, data.lines[i].version),
          data.lines[i].matchNumber, data.lines[i].forward));
      }
    } else {
      lines.push(new Line(endProp));
    }

    this.state = { startProp: startProp, endProp: endProp, lines: lines };
  }

  sendChange(lines: Array<Line>) {
    if (this.props.onChange === undefined)
      return;

    const lineData : Array<any> = [];
    for (const line of lines) {
      lineData.push({
          prop: StringifyProp(line.prop),
          rule: line.equiv.rule,
          leftToRight: line.equiv.leftToRight,
          version: line.equiv.version,
          matchNumber: line.matchNumber,
          forward: line.forward,
        });
    }

    this.props.onChange(JSON.stringify({
        startProp: StringifyProp(this.state.startProp),
        endProp: StringifyProp(this.state.startProp),
        lines: lineData
      }));
  }

  render() {
    const lines = this.state.lines;

    const rows : Array<JSX.Element> = [];
    for (let i = 0; i < lines.length; i++) {

      // Construct a set of sub-propositions where the forward rule (from the
      // next line) applies.
      let fwdMatches = (i + 1 < lines.length && lines[i+1].forward) ?
          lines[i+1].matchSet(lines[i].prop) : new Set<Proposition>();

      // Construct a set of sub-propositions where the backward rule applies.
      let backMatches = !lines[i].forward ?
          lines[i].matchSet(lines[i].prop) : new Set<Proposition>();

      const prevProp = (i == 0) ? this.state.startProp : lines[i-1].prop;
      if (this.state.lines[i].isCorrect(prevProp) &&
          !this.state.lines[i].editable) {
        rows.push(
          <tr>
            <td className="prop-elem"><span>&equiv;</span>{' '}
              {FormatProp(this.state.lines[i].prop, fwdMatches, backMatches)}</td>
            <td className="rule">
              {this.state.lines[i].ruleName()}
              <button className="btn-edit" onClick={this.handleEdit.bind(this, i)}>
                <i className="fa fa-edit"></i>
              </button>
            </td>
          </tr>);
      } else {
        const error = this.state.lines[i].equiv.isComplete() &&
            !this.state.lines[i].isCorrect(prevProp);
        rows.push(
          <tr>
            <td className="prop-elem"><span>&equiv;</span>{' '}
              {FormatProp(this.state.lines[i].prop, fwdMatches, backMatches)}</td>
            <td className={'rule' + (error ? ' prop-error' : '')}>
              {this.formatRule(i)}
            </td>
          </tr>);
      }
    }

    let fwdMatches = (0 < lines.length && lines[0].forward) ?
        lines[0].matchSet(this.state.startProp) : new Set<Proposition>();

    return (
        <table>
          <tbody>
            <tr>
              <td className="prop-elem">
                {FormatProp(this.state.startProp, fwdMatches, new Set())}
              </td>
              <td></td>
            </tr>
            {rows}
          </tbody>
        </table>);
  }

  formatRule(index: number) : JSX.Element {
    const equiv = this.state.lines[index].equiv;
    const prevProp =
        (index == 0) ? this.state.startProp : this.state.lines[index-1].prop;

    let version : JSX.Element | string = '';
    if (equiv.hasVersion()) {
      version = (
          <select onChange={this.handleVersion.bind(this, index)}
              value={equiv.version}>
            <option value={equivs.RULE_VERSION_UNKNOWN}>Choose</option>
            <option value={equivs.RULE_VERSION_AND}>AND</option>
            <option value={equivs.RULE_VERSION_OR}>OR</option>
          </select>);
    }

    let matchNumber : JSX.Element | string = '';
    const matchCount = this.state.lines[index].matchCount(prevProp);
    if (matchCount > 1) {
      let options = [];
      for (let i = 0; i < matchCount; i++) {
        options.push(<option value={i}>{i+1}</option>);
      }
      matchNumber = (
          <select onChange={this.handleMatchNumber.bind(this, index)}
              value={this.state.lines[index].matchNumber}>
            <option value={-1}>All</option>
            {options}
          </select>);
    }

    let dir : JSX.Element | undefined;
    if (this.state.lines[index].forward) {
      dir = (<span className="dir-btns">
          <button className="dir-btn-on"><i className="fa fa-angle-double-down"></i></button>
          <button className="dir-btn-off"
              onClick={this.handleForward.bind(this, index)}>
            <i className="fa fa-angle-double-up"></i>
          </button>
        </span>);
    } else {
      dir = (<span className="dir-btns">
          <button className="dir-btn-off"
              onClick={this.handleForward.bind(this, index)}>
            <i className="fa fa-angle-double-down"></i>
          </button>
          <button className="dir-btn-on"><i className="fa fa-angle-double-up"></i></button>
        </span>);
    }

    let options : Array<JSX.Element> = [];
    if (this.state.lines[index].editable) {
      options.push(
          <button className="btn-collapse"
              onClick={this.handleEdit.bind(this, index)}>
            <i className="fa fa-minus-square"></i>
          </button>);
    }
    if (index + 1 < this.state.lines.length) {
      options.push(
          <button className="btn-close"
              onClick={this.handleDelete.bind(this, index)}>
            <i className="fa fa-window-close"></i>
          </button>);
    }

    return (
        <div>
          {dir}
          <select onChange={this.handleRule.bind(this, index)}
              value={equiv.rule}>
            <option value="0">Choose</option>
            <option value="1">Identity</option>
            <option value="2">Domination</option>
            <option value="3">Idempotency</option>
            <option value="4">Commutativity</option>
            <option value="5">Associativity</option>
            <option value="6">Distributivity</option>
            <option value="7">Absorption</option>
            <option value="8">Negation</option>
            <option value="9">De Morgan</option>
            <option value="10">Double Negation</option>
            <option value="11">Law of Implication</option>
            <option value="12">Contrapositive</option>
          </select>
          <select onChange={this.handleLeftToRight.bind(this, index)}
              value={equiv.leftToRight ? '1' : '0'}>
            <option value="1">left-to-right</option>
            <option value="0">right-to-left</option>
          </select>
          {version}
          {matchNumber}
          <span className="options">{options}</span>
        </div>);
  }

  handleForward(index: number) {
    const lines = this.state.lines.slice(0);
    const line = this.state.lines[index].copy();

    if (line.forward) {
      line.genFrom = undefined;  // break any link
      line.forward = false;
      lines[index] = line;

    } else {
      if ((index - 1 >= 0) && (lines[index-1].genFrom === line.prop)) {
        lines[index-1] = lines[index-1].copy();
        lines[index-1].genFrom = undefined;  // break the link
      }

      line.forward = true;
      lines[index] = line;
    }

    this.setState({lines: lines});
    this.sendChange(lines);
  }

  handleEdit(index: number) {
    const lines = this.state.lines.slice(0);
    const line = this.state.lines[index].copy();
    line.editable = !line.editable;
    lines[index] = line;

    this.setState({lines: lines});
    this.sendChange(lines);
  }
  
  handleDelete(index: number) {
    const line = this.state.lines[index];

    const lines = this.state.lines.slice(0);
    lines.splice(index, 1);

    if (index - 1 >= 0 && lines[index-1].genFrom == line.prop) {
      lines[index-1] = lines[index-1].copy();
      lines[index-1].genFrom = undefined;
    }
    if (index < lines.length && lines[index].genFrom == line.prop) {
      lines[index] = lines[index-1].copy();
      lines[index].genFrom = undefined;
    }

    this.setState({lines: lines});
    this.sendChange(lines);
  }
  
  handleRule(index: number, evt: ChangeEvent<HTMLSelectElement>) {
    const equiv = this.state.lines[index].equiv.copy();
    equiv.rule = parseInt(evt.target.value);
    this.updateLine(index, equiv, this.state.lines[index].matchNumber);
  }

  handleLeftToRight(index: number, evt: ChangeEvent<HTMLSelectElement>) {
    const equiv = this.state.lines[index].equiv.copy();
    equiv.leftToRight = evt.target.value === "1";
    this.updateLine(index, equiv, this.state.lines[index].matchNumber);
  }

  handleVersion(index: number, evt: ChangeEvent<HTMLSelectElement>) {
    const equiv = this.state.lines[index].equiv.copy();
    equiv.version = parseInt(evt.target.value);
    this.updateLine(index, equiv, this.state.lines[index].matchNumber);
  }

  handleMatchNumber(index: number, evt: ChangeEvent<HTMLSelectElement>) {
    const matchNumber = parseInt(evt.target.value);
    this.updateLine(index, this.state.lines[index].equiv.copy(), matchNumber);
  }

  // Replaces the rule at the given index with the new one, updating the
  // rules around so as to maintain invariants.
  updateLine(index: number, equiv: Equivalence, matchNumber: number) {
    const lines = this.state.lines.slice(0);
    const prevProp =
        (index == 0) ? this.state.startProp : this.state.lines[index-1].prop;

    let line = lines[index].copy();
    line.equiv = equiv;
    line.matchNumber = matchNumber;

    // If the rule doesn't match at all, then update nothing else. (We leave
    // leave genFrom as is, so the prop can still change-in-place later.)
    if (!line.isApplicable(prevProp)) {
      lines[index] = line;

    } else  {
      const newProp = line.apply(prevProp);

      if (lines[index].forward) {
        // If the current value is from the previous proposition and the next
        // proposition is not from this one, then we can replace the prop too.
        if ((line.genFrom === prevProp) &&
            (index + 1 === this.state.lines.length ||
             this.state.lines[index+1].genFrom !== line.prop)) {
          line.prop = newProp;
          lines[index] = line;

        // If the generated prop matches this line, then we can fill this as the
        // exlpanation. However, we leave an existing explanation in place.
        } else if (this.state.lines[index].prop.equals(newProp)) {
          if (line.genFrom === undefined)
            line.genFrom = prevProp;
          lines[index] = line;

        // Otherwise, we insert the new proposition so that nothing is lost.
        } else {
          line.prop = newProp;
          line.genFrom = prevProp;
          lines.splice(index, 0, line);

          // No more change-in-place for the old version.
          if (lines[index+1].genFrom === prevProp)
            lines[index+1].genFrom = undefined;
        }

      } else {  // backward

        // If the previous prop is from this one and that one does not generate
        // the one prior, then we can change in place.
        if ((index - 1 >= 0) && 
            (lines[index-1].genFrom === line.prop) &&
            ((index - 2 < 0) ||
             (lines[index-2].genFrom !== lines[index-1].prop))) {

          lines[index-1] = lines[index-1].copy();
          lines[index-1].prop = newProp;

          lines[index] = line;

        // If the generated prop matches the previous prop, then we can fill
        // this as the exlpanation. However, we leave an existing explanation.
        } else if (prevProp.equals(newProp)) {

          if (lines[index-1].genFrom === undefined) {
            lines[index-1] = lines[index-1].copy();
            lines[index-1].genFrom = line.prop;
          }

          lines[index] = line;

        // Otherwise, we insert the new proposition so that nothing is lost.
        } else {

          lines.splice(index, 0, new Line(newProp));
          lines[index].genFrom = line.prop;
          lines[index].forward = false;  // assume they want to continue backward

          lines[index+1] = line;

          // Separate the ones that are two links apart.
          if ((index - 1 >= 0) && lines[index-1].genFrom === line.prop)
            lines[index-1].genFrom = undefined;
        }
      }
    }

    this.setState({lines: lines});
    this.sendChange(lines);
  }
}

/** Produces a span displaying the given proposition. */
export function FormatProp(prop: Proposition,
    fwd?: Set<Proposition>, back?: Set<Proposition>)
    : JSX.Element {

  fwd = (fwd === undefined) ? new Set() : fwd;
  back = (back === undefined) ? new Set() : back;

  let suffix = '';
  if (fwd.has(prop))
    suffix += ' prop-fwd-match';
  if (back.has(prop))
    suffix += ' prop-back-match';

  if (prop.variety === props.PROP_TRUE) {
    return <span className={"prop-const"+suffix}>T</span>;
  } else if (prop.variety === props.PROP_FALSE) {
    return <span className={"prop-const"+suffix}>F</span>;
  } else if (prop.variety === props.PROP_VARIABLE) {
    return <span className={"prop-var"+suffix}>{(prop as Variable).name}</span>;
  } else if (prop.variety === props.PROP_NEG) {
    const neg = prop as Negation;
    if (neg.prop.variety > neg.variety) {
      return (<span className={"prop"+suffix}>
          &#xac;({FormatProp(neg.prop, fwd, back)})</span>);
    } else {
      return (<span className={"prop"+suffix}>
          &#xac;{FormatProp(neg.prop, fwd, back)}</span>);
    }
  } else if (prop.variety === props.PROP_AND) {
    const op = prop as Operator;
    if (op.left.variety > props.PROP_NEG && op.right.variety > props.PROP_NEG) {
      return (<span className={"prop"+suffix}>
          ({FormatProp(op.left, fwd, back)}) &#x22C0;{' '}
          ({FormatProp(op.right, fwd, back)})</span>);
    } else if (op.left.variety > props.PROP_NEG && op.right.variety <= props.PROP_NEG) {
      return (<span className={"prop"+suffix}>
          ({FormatProp(op.left, fwd, back)}) &#x22C0;{' '}
          {FormatProp(op.right, fwd, back)}</span>);
    } else if (op.left.variety <= props.PROP_NEG && op.right.variety > props.PROP_NEG) {
      return (<span className={"prop"+suffix}>
          {FormatProp(op.left, fwd, back)} &#x22C0;{' '}
          ({FormatProp(op.right, fwd, back)})</span>);
    } else {
      return (<span className={"prop"+suffix}>
          {FormatProp(op.left, fwd, back)} &#x22C0;{' '}
          {FormatProp(op.right, fwd, back)}</span>);
    }
  } else if (prop.variety === props.PROP_OR) {
    const op = prop as Operator;
    if (op.left.variety > props.PROP_NEG && op.right.variety > props.PROP_NEG) {
      return (<span className={"prop"+suffix}>
          ({FormatProp(op.left, fwd, back)}) &#x22C1;{' '}
          ({FormatProp(op.right, fwd, back)})</span>);
    } else if (op.left.variety > props.PROP_NEG && op.right.variety <= props.PROP_NEG) {
      return (<span className={"prop"+suffix}>
          ({FormatProp(op.left, fwd, back)}) &#x22C1;{' '}
          {FormatProp(op.right, fwd, back)}</span>);
    } else if (op.left.variety <= props.PROP_NEG && op.right.variety > props.PROP_NEG) {
      return (<span className={"prop"+suffix}>
          {FormatProp(op.left, fwd, back)} &#x22C1;{' '}
          ({FormatProp(op.right, fwd, back)})</span>);
    } else {
      return (<span className={"prop"+suffix}>
          {FormatProp(op.left, fwd, back)} &#x22C1;{' '}
          {FormatProp(op.right, fwd, back)}</span>);
    }
  } else if (prop.variety === props.PROP_IMPLIES) {
    const op = prop as Operator;
    if (op.left.variety > props.PROP_NEG && op.right.variety > props.PROP_NEG) {
      return (<span className={"prop"+suffix}>
          ({FormatProp(op.left, fwd, back)}) &#x2192;{' '}
          ({FormatProp(op.right, fwd, back)})</span>);
    } else if (op.left.variety > props.PROP_NEG && op.right.variety <= props.PROP_NEG) {
      return (<span className={"prop"+suffix}>
          ({FormatProp(op.left, fwd, back)}) &#x2192;{' '}
          {FormatProp(op.right, fwd, back)}</span>);
    } else if (op.left.variety <= props.PROP_NEG && op.right.variety > props.PROP_NEG) {
      return (<span className={"prop"+suffix}>
          {FormatProp(op.left, fwd, back)} &#x2192;{' '}
          ({FormatProp(op.right, fwd, back)})</span>);
    } else {
      return (<span className={"prop"+suffix}>
          {FormatProp(op.left, fwd, back)} &#x2192;{' '}
          {FormatProp(op.right, fwd, back)}</span>);
    }
  } else {
    throw Error('unknown prop type: ' + prop.variety);
  }
}

// Parses the given string into a proposition. Throws an exception on error.
export function ParseProp(value: string) : Proposition {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar as any));
  parser.feed(value);
  return parser.results[0];
}

// Converts the given proposition into a string that will parse to it.
export function StringifyProp(prop: Proposition) : string {
  let op;
  switch (prop.variety) {
    case props.PROP_TRUE:
      return "T";

    case props.PROP_FALSE:
      return "F"; 

    case props.PROP_VARIABLE:
      return (prop as Variable).name; 

    case props.PROP_NEG:
      const neg = prop as Negation;
      return "not " + _MaybeWrap(neg.prop, props.PROP_NEG);

    case props.PROP_AND:
      op = prop as Operator;
      return _MaybeWrap(op.left, props.PROP_AND) + " and " +
          _MaybeWrap(op.right, props.PROP_AND);

    case props.PROP_OR:
      op = prop as Operator;
      return _MaybeWrap(op.left, props.PROP_OR) + " or " +
          _MaybeWrap(op.right, props.PROP_OR);

    case props.PROP_IMPLIES:
      op = prop as Operator;
      return _MaybeWrap(op.left, props.PROP_IMPLIES) + " implies " +
          _MaybeWrap(op.right, props.PROP_IMPLIES);

    default:
      throw new Error("bad variety: " + prop.variety);
  }
}

function _MaybeWrap(prop: Proposition, outerVariety: number) {
  if (prop.variety < outerVariety) {
    return StringifyProp(prop);
  } else {
    return "(" + StringifyProp(prop) + ")";
  }
}