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

export interface DefineStatementNode {
  type: "define";
  variables: string[];
  variableType: VariableType;
  line: number;
}

export interface DimensionStatementNode {
  type: "dimension";
  name: string;
  sizeExpression: string;
  line: number;
}

export type TargetNode = VariableTargetNode | ArrayElementTargetNode;

export interface VariableTargetNode {
  kind: "variable";
  name: string;
}

export interface ArrayElementTargetNode {
  kind: "array_element";
  name: string;
  indexExpression: string;
}

export interface WriteStatementNode {
  type: "write";
  args: string[];
  line: number;
}

export interface ReadStatementNode {
  type: "read";
  target: TargetNode;
  line: number;
}

export interface AssignmentStatementNode {
  type: "assign";
  target: TargetNode;
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