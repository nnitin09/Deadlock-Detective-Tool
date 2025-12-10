import { Node, Edge, DeadlockResult, NodeType } from '../types';

export const detectDeadlock = (nodes: Node[], edges: Edge[]): DeadlockResult => {
  // 1. Separate nodes into Processes and Resources
  const processes = nodes.filter(n => n.type === NodeType.PROCESS);
  const resources = nodes.filter(n => n.type === NodeType.RESOURCE);

  // 2. Initialize Data Structures
  // Available: Map<ResourceId, number> (Total Capacity - Currently Allocated)
  const available = new Map<string, number>();
  
  // Allocation: Map<ProcessId, Map<ResourceId, number>> (What process holds)
  const allocation = new Map<string, Map<string, number>>();
  
  // Request: Map<ProcessId, Map<ResourceId, number>> (What process wants)
  const request = new Map<string, Map<string, number>>();

  // Initialize maps
  processes.forEach(p => {
    allocation.set(p.id, new Map());
    request.set(p.id, new Map());
    resources.forEach(r => {
      allocation.get(p.id)!.set(r.id, 0);
      request.get(p.id)!.set(r.id, 0);
    });
  });

  resources.forEach(r => {
    // Calculate currently allocated count based on edges leaving Resource
    const allocatedCount = edges.filter(e => e.source === r.id).length;
    // Cap allocation at maxInstances (though UI prevents over-allocation)
    const capacity = r.maxInstances || 1;
    available.set(r.id, capacity - allocatedCount);
  });

  // Populate Allocation and Request matrices from Edges
  edges.forEach(e => {
    const sourceNode = nodes.find(n => n.id === e.source);
    if (!sourceNode) return;

    if (sourceNode.type === NodeType.RESOURCE) {
      // Resource -> Process (Allocation)
      const rId = e.source;
      const pId = e.target;
      const current = allocation.get(pId)?.get(rId) || 0;
      allocation.get(pId)?.set(rId, current + 1);
    } else {
      // Process -> Resource (Request)
      const pId = e.source;
      const rId = e.target;
      const current = request.get(pId)?.get(rId) || 0;
      request.get(pId)?.set(rId, current + 1);
    }
  });

  // 3. Graph Reduction Algorithm (Similar to Banker's Algorithm Safety Check)
  // We simulate "finishing" processes. A process can finish if its *requests* 
  // can be met by *available* resources.
  
  const finish = new Map<string, boolean>();
  processes.forEach(p => finish.set(p.id, false));
  
  // Work vector (starts as Available)
  const work = new Map(available);
  
  // Track simulation sequence for visualization (optional)
  const safeSequence: string[] = [];
  let progress = true;

  while (progress) {
    progress = false;
    
    // Find a process P such that:
    // 1. Finish[P] == false
    // 2. Request[P] <= Work
    
    for (const p of processes) {
      if (!finish.get(p.id)) {
        let canProceed = true;
        
        // Check if all requests of P can be satisfied by Work
        for (const r of resources) {
          const needed = request.get(p.id)!.get(r.id) || 0;
          const availableCount = work.get(r.id) || 0;
          
          if (needed > availableCount) {
            canProceed = false;
            break;
          }
        }
        
        if (canProceed) {
          // Grant resources, Process finishes, release its held resources
          for (const r of resources) {
            const held = allocation.get(p.id)!.get(r.id) || 0;
            work.set(r.id, (work.get(r.id) || 0) + held);
          }
          
          finish.set(p.id, true);
          safeSequence.push(p.id);
          progress = true;
        }
      }
    }
  }

  // 4. Determine Results
  const deadlockedProcesses = processes.filter(p => !finish.get(p.id)).map(p => p.id);
  const hasDeadlock = deadlockedProcesses.length > 0;

  // Identify involved resources (resources held or requested by deadlocked processes)
  const involvedResources = new Set<string>();
  if (hasDeadlock) {
    deadlockedProcesses.forEach(pId => {
      // Add resources P holds
      allocation.get(pId)?.forEach((count, rId) => {
        if (count > 0) involvedResources.add(rId);
      });
      // Add resources P is waiting for
      request.get(pId)?.forEach((count, rId) => {
        if (count > 0) involvedResources.add(rId);
      });
    });
  }

  // Determine the "Cycle" (Visual Highlight)
  // In Multi-instance, it's not strictly a simple cycle, but a "Knot" or set of blocked edges.
  // We highlight all nodes involved in the deadlock.
  const cycleNodes = [...deadlockedProcesses, ...Array.from(involvedResources)];

  return {
    hasDeadlock,
    cycle: cycleNodes,
    involvedProcesses: deadlockedProcesses,
    involvedResources: Array.from(involvedResources)
  };
};