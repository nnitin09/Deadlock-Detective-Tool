import { GoogleGenAI } from "@google/genai";
import { Node, Edge, DeadlockResult, NodeType } from '../types';

export const analyzeWithGemini = async (
  nodes: Node[], 
  edges: Edge[], 
  result: DeadlockResult
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const processes = nodes.filter(n => n.type === NodeType.PROCESS).map(n => n.id.split('-')[0]);
    
    // Create detailed resource descriptions (e.g., "R1 (2 instances)")
    const resourceDetails = nodes
      .filter(n => n.type === NodeType.RESOURCE)
      .map(n => `${n.id.split('-')[0]} (Capacity: ${n.maxInstances || 1})`);
    
    const allocations = edges
      .filter(e => nodes.find(n => n.id === e.source)?.type === NodeType.RESOURCE)
      .map(e => {
        const rName = nodes.find(n => n.id === e.source)?.id.split('-')[0];
        const pName = nodes.find(n => n.id === e.target)?.id.split('-')[0];
        return `${rName} -> ${pName}`;
      });
      
    const requests = edges
      .filter(e => nodes.find(n => n.id === e.source)?.type === NodeType.PROCESS)
      .map(e => {
        const pName = nodes.find(n => n.id === e.source)?.id.split('-')[0];
        const rName = nodes.find(n => n.id === e.target)?.id.split('-')[0];
        return `${pName} -> ${rName}`;
      });

    const prompt = `
      Act as an Operating Systems Expert. Analyze the following Multi-Level Resource Allocation Graph (RAG) state.
      Note: This is a multi-instance resource system. A simple cycle is necessary but NOT sufficient for deadlock.

      System State:
      - Processes: ${processes.join(', ')}
      - Resources: ${resourceDetails.join(', ')}
      - Current Allocations (Held by): ${allocations.length > 0 ? allocations.join(', ') : 'None'}
      - Current Requests (Waiting for): ${requests.length > 0 ? requests.join(', ') : 'None'}
      
      Detection Result:
      - Deadlock Detected: ${result.hasDeadlock ? 'YES' : 'NO'}
      ${result.hasDeadlock ? `- Processes in Deadlock: ${result.involvedProcesses.map(p => p.split('-')[0]).join(', ')}` : ''}
      
      Task:
      1. Explain clearly why this state is ${result.hasDeadlock ? 'deadlocked' : 'safe'}. 
         - If safe, explain which process can finish first to release resources.
         - If deadlocked, explain the circular dependency considering the multiple instances.
      2. If a deadlock exists, suggest 3 specific strategies to recover (e.g., which process to kill, which resource to preempt).
      3. Keep the tone educational but technical.
      4. Format the output with clear headings using Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "No analysis could be generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service. Please ensure your API key is configured correctly.";
  }
};