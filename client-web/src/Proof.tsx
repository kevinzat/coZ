
import React, { ChangeEvent } from 'react';
import { Proposition } from './props';
import { Inference } from './infers';
import * as infers from './infers';
import * as equivs from './equivs';
import { FormatProp, ParseProp, StringifyProp } from './EquivalenceChain';
import './EquivalenceChain.css';


// Represents an individual line of the proof.
class Line {
  prop: Proposition;
  infer: Inference;
  fixed: boolean;                    // do not allow the user to delete or change direction
  editable: boolean;                 // do not allow the user to edit or delete
  editing: boolean;                  // show editing even if correct
  args: Array<Array<number> | undefined>; // indices of the inputs (forward)
  genFrom: Proposition | undefined;  // prop from line that produced the prop in this line

  constructor(prop: Proposition, infer: Inference, fixed: boolean, editable: boolean) {
    this.prop = prop;
    this.infer = infer;
    this.fixed = fixed;
    this.editable = editable;
    this.editing = false;
    this.args = new Array(
        this.infer.forward ? this.infer.numInputs() : this.infer.numOutputs());
  }

  copy() {
    const line = new Line(this.prop, this.infer.copy(), this.fixed, this.editable);
    line.editing = this.editing;
    line.args = this.args.slice(0);
    line.genFrom = this.genFrom;
    return line;
  }

  // Retrieves the inference rule number.
  get rule() : number {
    return this.infer.rule;
  }

  // Updates the inference rule number and the arguments to match.
  set rule(value: number) {
    this.infer = this.infer.copy()
    this.infer.rule = value;

    // Fix the args length
    const newLen = this.infer.forward ? this.infer.numInputs() : this.infer.numOutputs();
    while (this.args.length > newLen)
      this.args.pop();
    while (this.args.length < newLen)
      this.args.push(undefined);
  }

  // Retrieves the inference direction.
  get forward() : boolean {
    return this.infer.forward;
  }

  // Updates the inference rule direction and the arguments to match.
  set forward(value: boolean) {
    this.infer = this.infer.copy()
    this.infer.forward = value;

    // Fix the args length
    const newLen = this.infer.forward ? this.infer.numInputs() : this.infer.numOutputs();
    while (this.args.length > newLen)
      this.args.pop();
    while (this.args.length < newLen)
      this.args.push(undefined);
  }

  // Determines whether all the information needed to apply the rule is in place.
  isComplete() {
    if (!this.infer.isComplete())
      return false;

    // When working forward, args stores inputs that must be provided. (When
    // working backward, it stores outputs we produce.)
    if (this.infer.forward) {
      const len = this.infer.numInputs();
      if (len !== this.args.length)
        throw new Error("wrong argument length: " + len + " vs " + this.args.length);

      for (let x of this.args) {
        if (x === undefined)
          return false;
      }
    }

    return true;
  }
}


interface ProofProps {
  value: string,  // JSON storing initial state
  onChange?: (value: string) => void
}

interface ProofState {
  startProp: Proposition;
  endProp: Proposition;
  labels: Array<Array<number>>  // labels shown on the individual lines
  lines: Array<Line>,           // content of the lines
}


export default class Proof
    extends React.Component<ProofProps, ProofState> {

  constructor(props: ProofProps) {
    super(props);

    const data = JSON.parse(this.props.value);
    const startProp = ParseProp((data.startProp !== undefined) ?
        data.startProp as string : "P implies Q implies R");
    const endProp = ParseProp((data.endProp !== undefined) ?
        data.endProp as string : "Q implies P implies R");

    let labels : Array<Array<number>> = [];
    let lines = [];
    if (data.lines !== undefined && data.lines.length &&
        data.labels !== undefined && data.labels.length) {
      for (let i = 0; i < Math.min(data.lines.length, data.labels.length); i++) {
        labels.push(ParseLabel(data.labels[i]));
        const line = new Line(
            ParseProp(data.lines[i].prop),
            new Inference(data.lines[i].rule, data.lines[i].forward, data.lines[i].version),
            data.lines[i].fixed, data.lines[i].editable);
        line.editing = data.lines[i].editing;
        line.args = data.lines[i].args;
        lines.push(line); 
        if (data.lines[i].equiv !== undefined) {
          line.infer.equiv = new equivs.Equivalence(
              data.lines[i].equiv, data.lines[i].leftToRight,
              data.lines[i].version);
          line.infer.matchNumber = (data.lines[i].matchNumber !== undefined) ?
              parseInt(data.lines[i].matchNumber) : -1;
        }

      }
    } else {
      labels = [[1], [2]];
      lines = [
        new Line(startProp, new Inference(infers.RULE_ASSUMPTION, false), true, false),
        new Line(endProp, new Inference(infers.RULE_UNKNOWN, true), true, true)
      ];
    }

    this.state = { startProp: startProp, endProp: endProp, lines: lines, labels: labels };
  }

  sendChange(lines: Array<Line>, labels: Array<Array<number>>) {
    if (this.props.onChange === undefined)
      return;

    const lineData : Array<any> = [];
    for (const line of lines) {
      const obj : any = {
          prop: StringifyProp(line.prop),
          rule: line.infer.rule,
          forward: line.infer.forward,
          version: line.infer.version,
          fixed: line.fixed,
          editable: line.editable,
          editing: line.editing,
          args: line.args
        };
      if (line.infer.equiv !== undefined) {
        obj.equiv = line.infer.equiv.rule;
        obj.leftToRight = line.infer.equiv.leftToRight;
        obj.version = line.infer.equiv.version;
      }
      lineData.push(obj);
    }

    const labelData = labels.map(v => v.join("."));
    this.props.onChange(JSON.stringify({
        startProp: StringifyProp(this.state.startProp),
        endProp: StringifyProp(this.state.endProp),
        lines: lineData,
        labels: labelData
      }));
  }

  // Returns the line with the given label, which must exist.
  findLine(label: Array<number>) : Line {
    // TODO(future): speed this up with a reverse map.
    const str = label.join(".");
    for (let i = 0; i < this.state.labels.length; i++) {
      if (this.state.labels[i].join(".") === str)
        return this.state.lines[i];
    }

    throw new Error("no such line: " + label.join("."));
  }

  // Returns a list of all the labels before the given one.
  findLabelsBefore(label: Array<number>) : Array<Array<number>> {
    const labels = [];
    const end = this.findLabel(label);
    for (let i = 0; i < end; i++) {
      if (LabelInScope(this.state.labels[i], label))
        labels.push(this.state.labels[i]);
    }
    return labels;
  }

  // Returns the index of the given label.
  findLabel(label: Array<number>) : number {
    const str = label.join(".");
    for (let i = 0; i < this.state.labels.length; i++) {
      if (str === this.state.labels[i].join("."))
        return i;
    }

    throw new Error("No labels matching: " + label.join("."))
  }

  // Returns the index of the first label matching the given prefix.
  findFirstLabelMatching(label: Array<number>) : number {
    const str = label.join(".");
    const str2 = str + ".";
    for (let i = 0; i < this.state.labels.length; i++) {
      const lbl = this.state.labels[i].join(".");
      if (lbl === str || lbl.startsWith(str2))
        return i;
    }

    throw new Error("No labels matching: " + label.join("."))
  }

  // Returns a list of all the lines generated (recursively) from the given one.
  allGenFrom(prop: Proposition) : Array<number> {
    let results : Array<number> = [];
    for (let i = 0; i < this.state.lines.length; i++) {
      if (this.state.lines[i].genFrom == prop)
        results.push(i);
    }
    for (let index of results.slice(0)) {
      if (prop !== this.state.lines[index].prop) {
        for (let i of this.allGenFrom(this.state.lines[index].prop)) {
          results.push(i);
        }
      }
    }
    return results;
  }

  render() {
    return <table>{this.renderRows()}</table>;
  }

  renderRows() : Array<JSX.Element> {
    if (this.state.lines.length !== this.state.labels.length)
      throw new Error("lines and labels do not have equal length")

    // Calculate the maximum depth of labels (subproofs).
    const maxDepth = this.state.labels.map(v => v.length)
        .reduce((acc, cur) => Math.max(acc, cur));

    let rows : Array<JSX.Element> = [];
    for (let i = 0; i < this.state.lines.length; i++) {
      const label = this.state.labels[i];
      const line = this.state.lines[i];

      let cols : Array<JSX.Element> = [];

      for (let j = 1; j < label.length; j++) {
        cols.push(<td>&nbsp;</td>);
      }

      cols.push(<td style={{width: '20px'}}>{label.join(".")}.</td>);

      cols.push(
        <td className="prop-elem" colSpan={maxDepth - label.length + 1}
            style={{minWidth: '350px'}}>
          {FormatProp(line.prop)}
        </td>);

      // Show in collapsed form if correct and not actively editing
      const collapsed = !line.editing && this.isCorrect(i);

      // Show in red if complete but not correct.
      const error = line.isComplete() && !this.isCorrect(i);

      cols.push(
        <td className={"rule" + (error ? " prop-error" : "")}>
          {collapsed ? this.formatCollapsedInference(i)
                     : this.formatExpandedInference(i)}
        </td>);

      rows.push(<tr>{cols}</tr>);
    }

    return rows;
  }

  /** Determines whether the line is correct. */
  isCorrect(index: number) : boolean {
    const line = this.state.lines[index];
    if (!line.isComplete())
      return false;

    // Forward reasoning is correct if it produces the proposition listed.
    if (line.forward) {
      const props = line.args.map(lbl => this.findLine(lbl!).prop);
      return line.infer.matches(props) &&
          line.prop.equals(line.infer.applyForward(props));

    // Backward can only take the current proposition as input. Its outputs
    // should match the propositions from the arguments. (Those aren't set by
    // the user, so it is a bug if they don't match.)
    } else {
      if (!line.infer.matches([line.prop]))
        return false;

      const props = line.infer.applyBackward([line.prop]);
      if (props.length !== line.args.length)
        throw new Error("incorrect argument length (backward)")
      for (let i = 0; i < props.length; i++) {
        if (!props[i].equals(this.findLine(line.args[i]!).prop)) {
          console.log(props[i]);
          console.log(this.findLine(line.args[i]!).prop);
          throw new Error("argument does not match");
        }
      }

      return true;
    }
  }

  // Produces UI for an inference rule in collapsed form.
  formatCollapsedInference(index: number) : JSX.Element {
    const line = this.state.lines[index];

    let edit : JSX.Element | string = "";
    if (line.editable) {
      edit = (
        <button className="btn-collapse"
            onClick={this.handleEdit.bind(this, index)}>
          <i className="fa fa-minus-square"></i>
        </button>);
    }

    let close : JSX.Element | string = "";
    if (!line.fixed) {
      close = (
        <button className="btn-close"
            onClick={this.handleDelete.bind(this, index)}>
          <i className="fa fa-window-close"></i>
        </button>);
    }

    return (
      <div>
        {RuleName(line.infer)}{line.args.length > 0 ? ': ' : ''}
        {line.args.map(A => A!.join(".")).join(", ")}
        {edit}
        {close}
      </div>);
  }

  // Produces UI for an inference rule in expanded form.
  formatExpandedInference(index: number) : JSX.Element {
    const line = this.state.lines[index];

    let dir : JSX.Element;
    if (line.forward) {
      let off : JSX.Element;
      if (!line.editable) {
        off = (
            <button className="dir-btn-off-fixed">
              <i className="fa fa-angle-double-up"></i>
            </button>);
      } else {
        off = (
            <button className="dir-btn-off"
                onClick={this.handleForward.bind(this, index)}>
              <i className="fa fa-angle-double-up"></i>
            </button>);
      }
      dir = (<span className="dir-btns">
          <button className="dir-btn-on">
            <i className="fa fa-angle-double-down"></i>
          </button>
          {off}
        </span>);
    } else {
      let off : JSX.Element;
      if (!line.editable) {
        off = (
            <button className="dir-btn-off-fixed">
              <i className="fa fa-angle-double-down"></i>
            </button>);
      } else {
        off = (
            <button className="dir-btn-off"
                onClick={this.handleForward.bind(this, index)}>
              <i className="fa fa-angle-double-down"></i>
            </button>);
      }
      dir = (<span className="dir-btns">
          {off}
          <button className="dir-btn-on">
            <i className="fa fa-angle-double-up"></i>
          </button>
        </span>);
    }

    const dp = line.forward ? "" : <option value="1">Direct Proof</option>;
    const rule = (
        <select onChange={this.handleRule.bind(this, index)} value={line.rule}>
          <option value="0">Choose</option>
          {dp}
          <option value="2">Modus Ponens</option>
          <option value="3">Intro &#x22C0;</option>
          <option value="4">Elim &#x22C0;</option>
          <option value="5">Intro &#x22C1;</option>
          <option value="6">Elim &#x22C1;</option>
          <option value="7">Equivalence</option>
        </select>);

    const options : Array<JSX.Element> = [];
    if (line.editing) {
      options.push(
          <button className="btn-collapse"
              onClick={this.handleEdit.bind(this, index)}>
            <i className="fa fa-minus-square"></i>
          </button>);
    }
    if (!line.fixed) {
      options.push(
          <button className="btn-close"
              onClick={this.handleDelete.bind(this, index)}>
            <i className="fa fa-window-close"></i>
          </button>);
    }

    let version : JSX.Element | string = '';
    if (line.infer.hasVersion()) {
      version = (
          <select onChange={this.handleVersion.bind(this, index)}
              value={line.infer.version}>
            <option value={infers.RULE_VERSION_UNKNOWN}>Choose</option>
            <option value={infers.RULE_VERSION_FIRST}>left</option>
            <option value={infers.RULE_VERSION_SECOND}>right</option>
          </select>);
    }

    let equiv : JSX.Element | string = '';
    if ((line.rule === infers.RULE_EQUIVALENCE) &&
        (line.infer.equiv !== undefined)) {
      let equivVersion : JSX.Element | string = '';
      if (line.infer.equiv.hasVersion()) {
        equivVersion = (
            <select onChange={this.handleVersion.bind(this, index)}
                value={line.infer.equiv.version}>
              <option value={equivs.RULE_VERSION_UNKNOWN}>Choose</option>
              <option value={equivs.RULE_VERSION_AND}>AND</option>
              <option value={equivs.RULE_VERSION_OR}>OR</option>
            </select>);
      }

      equiv = (
        <span>
          <select onChange={this.handleEquivRule.bind(this, index)}
              value={line.infer.equiv.rule}>
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
          <select onChange={this.handleEquivLeftToRight.bind(this, index)}
              value={line.infer.equiv.leftToRight ? '1' : '0'}>
            <option value="1">left-to-right</option>
            <option value="0">right-to-left</option>
          </select>
          {equivVersion}
        </span>);
    }

    let matchNumber : JSX.Element | string = '';
    if ((line.infer.equiv !== undefined) && (line.infer.equiv.isComplete())) {
      const matchCount = line.infer.equiv.matchCount(line.prop);
      if (matchCount > 1) {
        let options = [];
        for (let i = 0; i < matchCount; i++) {
          options.push(<option value={i}>{i+1}</option>);
        }
        matchNumber = (
            <select onChange={this.handleMatchNumber.bind(this, index)}
                value={line.infer.matchNumber}>
              <option value={-1}>All</option>
              {options}
            </select>);
      }
    }

    const args : Array<JSX.Element> = [];
    if (line.forward) {  // users only set forward arguments
      const labels = this.findLabelsBefore(this.state.labels[index]);
      for (let i = 0; i < line.args.length; i++) {
        const nums = [];
        nums.push(<option value="">Choose</option>);
        for (let j = 0; j < labels.length; j++) {
          const str = labels[j].join(".");
          nums.push(<option value={str}>{str}</option>);
        }
        const val = (line.args[i] !== undefined) ? line.args[i]!.join(".") : "";
        args.push(
          <select value={val} onChange={this.handleArg.bind(this, index, i)}>
            {nums}
          </select>);
      }
    }

    return (
        <div>
          {dir}
          {rule}
          {version}
          {equiv}
          {matchNumber}
          {args}
          <span className="options">{options}</span>
        </div>);
  }

  handleForward(index: number) {
    const lines = this.state.lines.slice(0);
    const line = this.state.lines[index].copy();
    line.forward = !line.forward;
    lines[index] = line;

    // Direct proof is only allowed forward.
    if (line.forward && line.rule === infers.RULE_DIRECT_PROOF)
      line.rule = infers.RULE_UNKNOWN;

    this.updateLine(index, line);
  }

  handleEdit(index: number) {
    const lines = this.state.lines.slice(0);
    const line = this.state.lines[index].copy();
    line.editing = !line.editing;
    lines[index] = line;

    this.setState({lines: lines});
    this.sendChange(lines, this.state.labels);
  }
  
  handleDelete(index: number) {
    const lines = this.state.lines.slice(0);
    const labels = this.state.labels.slice(0);

    const label = labels[index];
    labels.splice(index, 1);
    lines.splice(index, 1);
    ShiftLabelsAt(label, index, -1, labels, lines);

    this.updateState(lines, labels);
  }
  
  handleRule(index: number, evt: ChangeEvent<HTMLSelectElement>) {
    const line = this.state.lines[index].copy();
    line.rule = parseInt(evt.target.value);

    this.updateLine(index, line);
  }

  handleVersion(index: number, evt: ChangeEvent<HTMLSelectElement>) {
    const line = this.state.lines[index].copy();
    line.infer = line.infer.copy();
    line.infer.version = parseInt(evt.target.value);
    this.updateLine(index, line);
  }
  
  handleEquivRule(index: number, evt: ChangeEvent<HTMLSelectElement>) {
    const line = this.state.lines[index].copy();
    line.infer = line.infer.copy();
    line.infer.equiv = line.infer.equiv!.copy();
    line.infer.equiv!.rule = parseInt(evt.target.value);
    this.updateLine(index, line);
  }
  
  handleEquivLeftToRight(index: number, evt: ChangeEvent<HTMLSelectElement>) {
    const line = this.state.lines[index].copy();
    line.infer = line.infer.copy();
    line.infer.equiv = line.infer.equiv!.copy();
    line.infer.equiv!.leftToRight = parseInt(evt.target.value) === 1;
    this.updateLine(index, line);
  }

  handleEquivVersion(index: number, evt: ChangeEvent<HTMLSelectElement>) {
    const line = this.state.lines[index].copy();
    line.infer = line.infer.copy();
    line.infer.equiv = line.infer.equiv!.copy();
    line.infer.equiv!.version = parseInt(evt.target.value);
    this.updateLine(index, line);
  }

  handleMatchNumber(index: number, evt: ChangeEvent<HTMLSelectElement>) {
    const line = this.state.lines[index].copy();
    line.infer = line.infer.copy();
    line.infer.matchNumber = parseInt(evt.target.value);
    this.updateLine(index, line);
  }

  handleArg(index: number, argIndex: number,
      evt: ChangeEvent<HTMLSelectElement>) {
    const line = this.state.lines[index].copy();
    line.args[argIndex] = ParseLabel(evt.target.value);
    this.updateLine(index, line);
  }

  updateLine(index: number, line: Line) {

    let lines = this.state.lines.slice(0);
    let labels = this.state.labels;

    const prevProp = lines[index].prop;
    const nextProp = (index+1 < lines.length) ? lines[index+1].prop : undefined;

    if (!line.isComplete()) {
      lines[index] = line;

    } else if (!line.forward) {
      // If the rule can't be applied, continue waiting for a proper rule.
      if (!line.infer.matches([line.prop])) {
        lines[index] = line;

      } else {
        lines[index] = line;
        labels = labels.slice(0);

        // Remove everything generated from the previous version of this line.
        for (let i of this.allGenFrom(prevProp)) {
          const label = labels[i];
          lines.splice(i, 1);
          labels.splice(i, 1);
          ShiftLabelsAt(label, i, -1, labels, lines);
          if (i < index)
            index -= 1;
        }

        const props = line.infer.applyBackward([line.prop]);

        // For direct proof, we insert the produced propositions as a subproof.
        if (line.infer.rule === infers.RULE_DIRECT_PROOF) {
          const premise = new Line(props[0],
              new Inference(infers.RULE_ASSUMPTION, false), true, false);
          premise.genFrom = line.prop;
          const conclusion = new Line(props[1],
              new Inference(infers.RULE_UNKNOWN, true), true, true);
          conclusion.genFrom = line.prop;

          const plabel = labels[index].slice(0);
          plabel.push(1);
          const clabel = labels[index].slice(0);
          clabel.push(2);

          lines.splice(index, 0, premise, conclusion);
          labels.splice(index, 0, plabel, clabel);
          lines[index+2].args = [plabel, clabel];

        } else {
          let cnt = 0;
          let args = [];

          // Insert the needed propositions directly in front if we cannot find
          // them earlier.
          for (let i = 0; i < props.length; i++) {
            const match = FindProp(props[i], lines);
            if (match !== undefined) {
              args.push(labels[match]);
  
            } else {
              const newLine = new Line(props[i],
                  new Inference(infers.RULE_UNKNOWN, false), true, true);  // no delete
              newLine.genFrom = line.prop;
  
              const label = labels[index];
              lines.splice(index + cnt, 0, newLine);
              labels.splice(index + cnt, 0, LabelAddBefore(label, label, cnt));
              args.push(labels[index + cnt].slice(0));
  
              cnt += 1;
            }
          }

          // Update the indexes after those inserted.
          ShiftLabelsAt(labels[index+cnt], index + cnt, cnt, labels, lines);
          lines[index+cnt].args = args;  // shift would mess this up, so place after
        }
      }

    } else { // forward
      const props = line.args.map(lbl => this.findLine(lbl!).prop);

      // If the rule can't be applied, continue waiting for a proper rule.
      if (!line.infer.matches(props)) {
        lines[index] = line;

      } else {
        const newProp = line.infer.applyForward(props);

        // If the current proposition was generated by this line and no other
        // proposition came from that line, then we can just replace it.
        if ((line.genFrom === prevProp) &&
            (this.allGenFrom(line.prop).length == 1)) {
          line.prop = newProp;
          line.genFrom = newProp;
          lines[index] = line;

        // If the generated prop matches this line, then we can fill this as the
        // explanation. However, we leave an existing explanation in place.
        } else if (line.prop.equals(newProp)) {
          if (line.genFrom === undefined)
            line.genFrom = line.prop;
          lines[index] = line;

        // Otherwise, we insert the new propositions so that nothing is lost.
        } else {
          labels = labels.slice(0);

          line.fixed = false;
          line.editable = true;
          line.prop = newProp;
          line.genFrom = newProp;
          lines.splice(index, 0, line);
          labels.splice(index, 0, labels[index].slice(0));

          // Update any labels after this.
          ShiftLabelsAt(labels[index + 1], index + 1, 1, labels, lines);

          // No more change-in-place for the old versions.
          ClearFrom(prevProp, lines);

          // Reset the rule used on the next line if it's not from a line other
          // than the one right after this (which could only be backward).
debugger;
          if ((lines[index+1].genFrom === undefined) ||
              (lines[index+1].genFrom === nextProp)) {
            lines[index+1] = new Line(lines[index+1].prop,
                new Inference(infers.RULE_UNKNOWN, true),
                lines[index+1].fixed, lines[index+1].editable);
          }
        }
      }
    }

    this.updateState(lines, labels);
  }

  /** Sets the state after removing any subproofs no longer needed. */
  updateState(lines: Array<Line>, labels?: Array<Array<number>>) {
    // NOTE: arguments can only referencing values above and genFrom can only
    //       reference values at the same depth, so neither could be affected
    //       by the removal of a subproof.

    let copied;
    if (labels !== undefined) {
      copied = true;
    } else {
      labels = this.state.labels;
      copied = false;
    }

    let starts = [0];

    for (let i = 1; i < lines.length; i++) {
      while (labels[i].length > starts.length)
        starts.push(i);

      if (labels[i].length < starts.length) {
        if (lines[i].rule !== infers.RULE_DIRECT_PROOF) {
          if (!copied)
            labels = labels.slice(0);

          let start = starts[labels[i].length];
          labels.splice(start, i - start);
          lines.splice(start, i - start);
          starts.pop();
          i = start;
        }

        while (labels[i].length < starts.length)
          starts.pop();
      }
    }

    if (labels === undefined) {
      this.setState({lines: lines});
      this.sendChange(lines, this.state.labels);
    } else {
      this.setState({labels: labels, lines: lines})
      this.sendChange(lines, labels);
    }
  }
}

/** Converts a label string into an array of numbers. */
function ParseLabel(str: string) : Array<number> {
  return str.split(".").map(v => parseInt(v));
}

/** Returns the index of a prop equal to the given one or undefined if none. */
function FindProp(prop: Proposition, lines: Array<Line>) : number | undefined {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].prop.equals(prop))
      return i;
  }
  return undefined;
}

/** Sets to undefined any genFrom's set to the given prop */
function ClearFrom(prop: Proposition, lines: Array<Line>) : void {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].genFrom === prop) {
      lines[i] = lines[i].copy();
      lines[i].genFrom = undefined;
    }
  }
}

/**
 * Update the labels due to the insertion (delta > 0) or deletion (delta < 0)
 * of labels just before the given one.
 */
function ShiftLabelsAt(
    label: Array<number>, start: number, delta: number,
    labels: Array<Array<number>>, lines: Array<Line>) : void {

  // Update all the labels at or after the given one.
  for (let i = start; i < labels.length; i++) {
    labels[i] = LabelAddBefore(labels[i], label, delta);
  }

  // Update all the arguments.
  for (let i = start; i < lines.length; i++) {
    let copied = false;
    for (let j = 0; j < lines[i].args.length; j++) {
      if (lines[i].args[j] !== undefined &&
          !LabelLess(lines[i].args[j]!, label)) {
        if (!copied) {
          lines[i] = lines[i].copy();
          copied = true;
        }
        lines[i].args[j] =
            LabelAddBefore(lines[i].args[j]!, label, delta);
      }
    }
  }
}

/** Determines whether the first label is before the second one. */
function LabelLess(label1: Array<number>, label2: Array<number>) : boolean {
  for (let i = 0; i < label1.length && i < label2.length; i++) {
    if (label1[i] < label2[i])
      return true;
    if (label1[i] > label2[i])
      return false;
  }
  return label1.length > label2.length;  // extra parts means *before*
}

/**
 * Returns the new label after the given number of lines are inserted at the
 * given position.
 */
function LabelAddBefore(
    label: Array<number>, pos: Array<number>, delta: number) : Array<number> {
  for (let i = 0; i < label.length && i < pos.length; i++) {
    if (label[i] < pos[i])
      return label;  // before
    if (label[i] > pos[i]) {
      if (label.length < pos.length) {
        return label;  // insertion was in a sub-proof
      } else {
        let result = label.slice(0);
        result[pos.length-1] += delta;  // part of this shifts down
        return result;
      }
    }
  }
  if (label.length > pos.length) {
    return label;  // before
  } else if (label.length < pos.length) {
    return label;  // insertion was in a sub-proof
  } else {
    let result = label.slice(0);
    result[pos.length-1] += delta;  // part of this shifts down
    return result;
  }
}

/** Determines whether the first label is in scope at the second one. */
function LabelInScope(label: Array<number>, from: Array<number>) : boolean {
  for (let i = 0; i < label.length && i < from.length; i++) {
    if (label[i] < from[i])
      return label.length == i + 1;  // subproof of this would not be in scope
    if (label[i] > from[i])
      return false;
  }
  return false;  // neither can see the other
}

/** Returns the name of this rule. */
function RuleName(infer: Inference) : JSX.Element {
  switch (infer.rule) {
    case infers.RULE_DIRECT_PROOF:   return <span>Direct Proof</span>;
    case infers.RULE_MODUS_PONENS:   return <span>Modus Ponens</span>;
    case infers.RULE_INTRO_AND:      return <span>Intro &#x22C0;</span>;
    case infers.RULE_ELIM_AND:       return <span>Elim &#x22C0;</span>;
    case infers.RULE_INTRO_OR:       return <span>Intro &#x22C1;</span>;
    case infers.RULE_ELIM_OR:        return <span>Elim &#x22C1;</span>
    case infers.RULE_ASSUMPTION:     return <span>Assumption</span>;
    case infers.RULE_EQUIVALENCE:
      switch (infer.equiv!.rule) {
        case equivs.RULE_IDENTITY:            return <span>Identity</span>;
        case equivs.RULE_DOMINATION:          return <span>Domination</span>;
        case equivs.RULE_IDEMPOTENCY:         return <span>Idempotency</span>;
        case equivs.RULE_COMMUTATIVITY:       return <span>Commutativity</span>;
        case equivs.RULE_ASSOCIATIVITY:       return <span>Associativity</span>;
        case equivs.RULE_DISTRIBUTIVITY:      return <span>Distributivity</span>;
        case equivs.RULE_ABSORPTION:          return <span>Absorption</span>;
        case equivs.RULE_NEGATION:            return <span>Negation</span>;
        case equivs.RULE_DE_MORGAN:           return <span>De Morgan</span>;
        case equivs.RULE_DOUBLE_NEGATION:     return <span>Double Negation</span>;
        case equivs.RULE_LAW_OF_IMPLICATION:  return <span>Law of Implication</span>;
        case equivs.RULE_CONTRAPOSITIVE:      return <span>Contrapositive</span>;
      }
    default: throw new Error("Bad rule: " + infer.rule);
  }
}
