import React from 'react';

interface HoveredNodeInfo {
  id: number;
  cluster_id: number;
  resume_id?: number;
}

interface HoverPosition {
  x: number;
  y: number;
}

interface HoverInfoBoxProps {
  hoveredNode: HoveredNodeInfo | null;
  hoverPosition: HoverPosition | null;
}

const HoverInfoBox: React.FC<HoverInfoBoxProps> = ({ hoveredNode, hoverPosition }) => {
  if (!hoveredNode || !hoverPosition) {
    return null;
  }

  return (
    <div
      className="absolute z-10 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md max-w-xs"
      style={{
        left: `${hoverPosition.x}px`,
        top: `${hoverPosition.y}px`,
        transform: "translate(0, -100%)", // Position above and to the right of the cursor/node
      }}
    >
      <h3 className="text-sm font-semibold text-gray-800">
        Node Information
      </h3>
      <div className="text-sm text-gray-600 mt-1">
        <p>ID: {hoveredNode.id}</p>
        <p>Cluster: {hoveredNode.cluster_id}</p>
        {hoveredNode.resume_id !== undefined && <p>Resume ID: {hoveredNode.resume_id}</p>}
      </div>
    </div>
  );
};

export default HoverInfoBox; 