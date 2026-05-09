import type { VariableType } from "../models/VariableType";

export interface ProgramNode {
  type: "program";
  name: string;
  body: StatementNode[];
}

export type StatementNode =
  | DefineStatementNode
  | DimensionStatementNode
  | WriteStatementNode
  | ReadStatementNode
  | AssignmentStatementNode
  | IfStatementNode
  | WhileStatementNode
  | ForStatementNode;

export interface VariableReferenceNode {
  name: string;
  indexExpression: string | null;
}

export interface DefineStatementNode {
  type: "define";
  variables: string[];
  variableType: VariableType;
  line: number;
}

export interface DimensionStatementNode {
  type: "dimension";
  variable: string;
  sizeExpression: string;
  line: number;
}

export interface WriteStatementNode {
  type: "write";
  args: string[];
  line: number;
}

export interface ReadStatementNode {
  type: "read";
  target: VariableReferenceNode;
  line: number;
}

export interface AssignmentStatementNode {
  type: "assign";
  target: VariableReferenceNode;
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