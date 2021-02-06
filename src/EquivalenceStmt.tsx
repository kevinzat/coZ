import React, { ChangeEvent } from 'react';
import { Proposition } from './props';
import grammar from './prop_parser.js';
import * as nearley from 'nearley';


interface EquivalenceStmtProps {
    onStmt: (startProp: string, endProp: string) => any
}

interface EquivalenceStmtState {
    startText: string;
    startProp: Proposition | undefined;
    endText: string;
    endProp: Proposition | undefined;
}


export default class EquivalenceStmt
    extends React.Component<EquivalenceStmtProps, EquivalenceStmtState> {

  constructor(props: EquivalenceStmtProps) {
    super(props);
    this.state = {
        startText: "", startProp: undefined,
        endText: "", endProp: undefined
      };
  }

  render() {
    const startError = (this.state.startText.length > 0) &&
        (this.state.startProp === undefined);
    const endError = (this.state.endText.length > 0) &&
        (this.state.endProp === undefined);
    const ok = this.state.startText.length > 0 && !startError &&
        this.state.endText.length > 0 && !endError;

    return (
        <div>
          <p>Fill in the equivalence you want to prove:</p>
          <div style={{padding: '5px', backgroundColor: startError ? '#FF7373' : 'white'}}>
            <input type="text" width="40"
                value={this.state.startText} placeholder="e.g., not P implies (Q or T)"
                onChange={this.handleStartChange.bind(this)}>
            </input>
          </div>
          <div style={{padding: '5px', backgroundColor: endError ? '#FF7373' : 'white'}}>
            &equiv;{' '}
            <input type="text" width="40"
                value={this.state.endText} placeholder="e.g., not P implies (Q or T)"
                onChange={this.handleEndChange.bind(this)}>
            </input>
          </div>
          <p><button type="button" disabled={!ok}
                onClick={this.handleDone.bind(this)}>Start Proof</button></p>
        </div>);
  }

  handleStartChange(evt: ChangeEvent<HTMLInputElement>) {
    const startParser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar as any));
    let startProp = undefined;
    try {
      startParser.feed(evt.target.value);
      if (startParser.results.length === 1)
        startProp = startParser.results[0];
    } catch (e) { /* error */ }

    this.setState({startText: evt.target.value, startProp: startProp});
  }

  handleEndChange(evt: ChangeEvent<HTMLInputElement>) {
    const endParser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar as any));
    let endProp = undefined;
    try {
      endParser.feed(evt.target.value);
      if (endParser.results.length === 1)
        endProp = endParser.results[0];
    } catch (e) { /* error */ }

    this.setState({endText: evt.target.value, endProp: endProp});
  }

  handleDone() {
    if (this.state.startProp !== undefined && this.state.endProp !== undefined) {
      this.props.onStmt(this.state.startText, this.state.endText);
    }
  }
}
