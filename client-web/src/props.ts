export const PROP_TRUE = 1;
export const PROP_FALSE = 2;
export const PROP_VARIABLE = 3;
export const PROP_NEG = 4;
export const PROP_AND = 5;
export const PROP_OR = 6;
export const PROP_IMPLIES = 7;

/** Base class for all types of propositions. */
export abstract class Proposition {
    variety: number;

    constructor(variety: number) {
        this.variety = variety;
    }

    abstract equals(_: Proposition) : boolean;
}

/** True or False */
export class Constant extends Proposition {
    constructor(variety: number) {
      super(variety);
    }

    equals(p: Proposition) : boolean {
      return p === this;
    }
}

export const TRUE = new Constant(PROP_TRUE);
export const FALSE = new Constant(PROP_FALSE);

/** Variable reference */
export class Variable extends Proposition {
    name: string;

    constructor(name: string) {
        super(PROP_VARIABLE);

        this.name = name;
    }

    static of(name: string) : Variable {
        return new Variable(name);
    }

    equals(prop: Proposition) : boolean {
        return prop.variety === this.variety &&
            this.name === (prop as Variable).name;
    }
}

/** Negation of a proposition. */
export class Negation extends Proposition {
    prop: Proposition;

    constructor(prop: Proposition) {
        super(PROP_NEG);

        this.prop = prop;
    }

    static of(prop: Proposition) : Negation {
        return new Negation(prop);
    }

    equals(prop: Proposition) : boolean {
        return prop.variety === this.variety &&
            this.prop.equals((prop as Negation).prop);
    }
}

/** Binary operator applied to two propositions. */
export class Operator extends Proposition {
    left: Proposition;
    right: Proposition;

    constructor(variety: number, left: Proposition, right: Proposition) {
        super(variety);

        this.left = left;
        this.right = right;
    }

    equals(prop: Proposition) : boolean {
        return prop.variety === this.variety &&
            this.left.equals((prop as Operator).left) &&
            this.right.equals((prop as Operator).right);
    }

    /** Returns the conjugation of the two given propositions. */
    static conjunction(left: Proposition, right: Proposition) : Operator {
        return new Operator(PROP_AND, left, right);
    }

    /** Returns the disjunction of the two given propositions. */
    static disjunction(left: Proposition, right: Proposition) : Operator {
        return new Operator(PROP_OR, left, right);
    }

    /** Returns the implication of the two given propositions. */
    static implication(left: Proposition, right: Proposition) : Operator {
        return new Operator(PROP_IMPLIES, left, right);
    }
}