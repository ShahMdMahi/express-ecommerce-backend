export interface Node {
  type: string;
  loc: SourceLocation;
}

export interface Expression extends Node {
  type: string;
}

export interface SourceLocation {
  start: Position;
  end: Position;
  source?: string;
}

export interface Position {
  line: number;
  column: number;
}

export interface Program extends Node {
  type: 'Program';
  body: Statement[];
  blockParams: string[];
}

export interface Statement extends Node {}

export interface MustacheStatement extends Statement {
  type: 'MustacheStatement';
  path: PathExpression;
  params: Expression[];
  hash: HashNode;
  escaped: boolean;
}

export interface BlockStatement extends Statement {
  type: 'BlockStatement';
  path: PathExpression;
  params: Expression[];
  hash: HashNode;
  program: Program;
  inverse: Program | null;
}

export interface PathExpression extends Expression {
  type: 'PathExpression';
  data: boolean;
  depth: number;
  parts: string[];
  original: string;
}

export interface HashNode extends Node {
  type: 'Hash';
  pairs: HashPair[];
}

export interface HashPair extends Node {
  type: 'HashPair';
  key: string;
  value: Expression;
}
