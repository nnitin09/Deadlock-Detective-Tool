import React from 'react';
import { Cpu, Server, Plus, Minus } from 'lucide-react';
import { NodeType, Node, Edge } from '../types';

interface ControlPanelProps {
  onAddNode: (type: NodeType) => void;
  onUpdateNode: (id: string, updates: Partial<Node>) => void;
  nodes: Node[];
  edges: Edge[];
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onAddNode, onUpdateNode, nodes, edges }) => {
  const processCount = nodes.filter(n => n.type === NodeType.PROCESS).length;
  const resourceCount = nodes.filter(n => n.type === NodeType.RESOURCE).length;
  const resources = nodes.filter(n => n.type === NodeType.RESOURCE);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onAddNode(NodeType.PROCESS)}
          className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all group"
        >
          <div className="bg-emerald-500/10 p-2 rounded-full mb-2 group-hover:bg-emerald-500/20">
            <Cpu className="w-6 h-6 text-emerald-500" />
          </div>
          <span className="text-sm font-medium text-emerald-100">Add Process</span>
        </button>

        <button
          onClick={() => onAddNode(NodeType.RESOURCE)}
          className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all group"
        >
          <div className="bg-sky-500/10 p-2 rounded-full mb-2 group-hover:bg-sky-500/20">
            <Server className="w-6 h-6 text-sky-500" />
          </div>
          <span className="text-sm font-medium text-sky-100">Add Resource</span>
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase">Resource Capacity</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {resources.length === 0 && <p className="text-xs text-slate-600 italic">No resources added</p>}
          {resources.map(res => {
             const allocated = edges.filter(e => e.source === res.id).length;
             return (
              <div key={res.id} className="flex justify-between items-center p-2 bg-slate-800/50 rounded border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-sm text-sky-400 font-mono">{res.id.split('-')[0]}</span>
                  <span className="text-[10px] text-slate-500">Allocated: {allocated}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const current = res.maxInstances || 1;
                      if(current > 1 && current > allocated) onUpdateNode(res.id, { maxInstances: current - 1 });
                    }}
                    className={`p-1 rounded ${allocated >= (res.maxInstances || 1) ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    disabled={allocated >= (res.maxInstances || 1)}
                    title={allocated >= (res.maxInstances || 1) ? "Cannot reduce below currently allocated amount" : "Decrease capacity"}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{res.maxInstances || 1}</span>
                  <button 
                     onClick={() => {
                      const current = res.maxInstances || 1;
                      if(current < 9) onUpdateNode(res.id, { maxInstances: current + 1 });
                    }}
                    className="p-1 text-slate-400 hover:bg-slate-700 hover:text-white rounded"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-3 border-t border-slate-800 pt-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase">System Stats</h3>
        <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded border border-slate-800">
          <span className="text-sm text-slate-400">Total Processes</span>
          <span className="font-mono text-emerald-400 font-bold">{processCount}</span>
        </div>
        <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded border border-slate-800">
          <span className="text-sm text-slate-400">Total Resources</span>
          <span className="font-mono text-sky-400 font-bold">{resourceCount}</span>
        </div>
      </div>
    </div>
  );
};