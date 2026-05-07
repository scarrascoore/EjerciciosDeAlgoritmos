export interface ProgramNode {
    type: "Program";
    name: string;
    body: StatementNode[];
}

export type StatementNode = 
    |WriteStatementNode
    | ReadStatementNode
    | AssignmentStatementNode;

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
    value: string;
    line: number;
}
