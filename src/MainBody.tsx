import React from 'react';
import Proof from './Proof';
import ProofStmt from './ProofStmt';


// Properties of MainBody
interface MainBodyProps {
}

// Internal state of MainBody
interface MainBodyState {
  startProp: string | undefined,
  endProp: string | undefined,
}


export default class MainBody extends React.Component<MainBodyProps, MainBodyState> {
  constructor(props: MainBodyProps) {
    super(props);
    this.state = {startProp: undefined, endProp: undefined};
  }

  render() {
    if (this.state.startProp !== undefined &&
        this.state.endProp !== undefined) {
      const value = { startProp: this.state.startProp, endProp: this.state.endProp };
      return <Proof value={JSON.stringify(value)}/>;

    } else {
      return <ProofStmt onStmt={this.handleStartProof.bind(this)}/>;
    }
  }

  handleStartProof(startProp: string, endProp: string) {
    this.setState({startProp: startProp, endProp: endProp});
  }
}
