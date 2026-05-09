export interface ProgramNode {
  type: "program";
  name: string;
  body: StatementNode[];
}

export type StatementNode =
  | WriteStatementNode
  | ReadStatementNode
  | AssignmentStatementNode
  | IfStatementNode
  | WhileStatementNode
  | ForStatementNode;

export interface WriteStatementNode {
  type: "write";
  args: string[];
  line: number;
}

export interface ReadStatementNode {
  type: "read";
  variable: string;
  line: number;
}

export interface AssignmentStatementNode {
  type: "assign";
  variable: string;
  expression: string;
  line: number;
}

export interface IfStatementNode {
  type: "if";
  condition: string;
  thenBranch: StatementNode[];
  elseBranch: StatementNode[];
  line: number;
}

export interface WhileStatementNode {
  type: "while";
  condition: string;
  body: StatementNode[];
  line: number;
}

export interface ForStatementNode {
  type: "for";
  variable: string;
  startExpression: string;
  endExpression: string;
  stepExpression: string | null;
  body: StatementNode[];
  line: number;
}