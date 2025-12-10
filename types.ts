export enum NodeType {
  PROCESS = 'PROCESS',
  RESOURCE = 'RESOURCE'
}

export interface Node {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  maxInstances?: number; // Only for RESOURCES: Total capacity (e.g., 3 printers)
}

export interface Edge {
  id: string;
  source: string; // ID of source node
  target: string; // ID of target node
}

export interface DeadlockResult {
  hasDeadlock: boolean;
  cycle: string[]; // In multi-instance, this represents the set of deadlocked processes/resources
  involvedProcesses: string[];
  involvedResources: string[];
  unsafeAllocations?: string[]; // Optional: Help visualize where things got stuck
}