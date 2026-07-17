import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, RefreshCcw } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { EmptyState } from './EmptyState';
import { Tooltip } from './Tooltip';
import './ForceGraph.css';

interface GraphNode {
  id: string;
  label?: string;
  type?: 'user' | 'device' | 'policy' | 'session' | 'threat' | 'file';
  risk_score?: number;
  connections?: number;
  is_red?: boolean;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  strength?: number;
  timestamp?: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface ForceGraphEnhancedProps {
  data: GraphData;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
}

const NODE_COLORS = {
  user: { fill: '#3b82f6', stroke: '#60a5fa', gradient: ['rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.1)'] },
  device: { fill: '#22c55e', stroke: '#4ade80', gradient: ['rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 0.1)'] },
  policy: { fill: '#8b5cf6', stroke: '#a78bfa', gradient: ['rgba(139, 92, 246, 0.8)', 'rgba(139, 92, 246, 0.1)'] },
  session: { fill: '#06b6d4', stroke: '#22d3ee', gradient: ['rgba(6, 182, 212, 0.8)', 'rgba(6, 182, 212, 0.1)'] },
  threat: { fill: '#ef4444', stroke: '#f87171', gradient: ['rgba(239, 68, 68, 0.9)', 'rgba(239, 68, 68, 0.15)'] },
};

export function ForceGraphEnhanced({ data, height = 400, onNodeClick }: ForceGraphEnhancedProps) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [pinnedNode, setPinnedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [width, setWidth] = useState(800);


  useEffect(() => {
    if (containerRef.current) setWidth(containerRef.current.offsetWidth);
    const handleResize = () => {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasFit = useRef(false);

  // Auto-center ONCE when nodes first appear - never again (prevents zoom loop)
  useEffect(() => {
    if (data.nodes.length > 0 && fgRef.current && !hasFit.current) {
      hasFit.current = true;
      // Delay so D3 warmup ticks finish before we fit
      setTimeout(() => {
        fgRef.current?.zoomToFit(600, 80);
      }, 1200);
    }
  }, [data.nodes.length]);

  // Calculate node size - bigger so labels are readable
  const getNodeSize = useCallback(() => {
    return 6;
  }, []);

  // Get node color by user request
  const getNodeColor = useCallback((node: GraphNode) => {
    // Files are yellow
    const isFile = (node.id && node.id.includes('file')) || node.type === 'file';
    if (isFile) {
      return { fill: '#eab308', stroke: '#a16207' }; // yellow
    }

    // Malicious activity -> red
    const isMalicious = node.is_red || (node.risk_score && node.risk_score > 0.5);
    if (isMalicious) {
      return { fill: '#ef4444', stroke: '#991b1b' }; // red
    }

    // Valid users / everything else -> blue
    return { fill: '#3b82f6', stroke: '#1d4ed8' }; // blue
  }, []);

  // Highlight connected nodes on hover
  const getLinkColor = useCallback((link: any) => {
    if (hoveredNode) {
      const isHighlighted = link.source.id === hoveredNode.id || link.target.id === hoveredNode.id;
      return isHighlighted ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.02)';
    }
    return 'rgba(255, 255, 255, 0.04)';
  }, [hoveredNode]);

  const getLinkWidth = useCallback((link: any) => {
    if (hoveredNode) {
      const isHighlighted = link.source.id === hoveredNode.id || link.target.id === hoveredNode.id;
      return isHighlighted ? 1.5 : 0.3;
    }
    return 0.4;
  }, [hoveredNode]);

  // Node render with clear circles
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

    const radius = getNodeSize();
    const label = (node.label || node.id || '').substring(0, 12);

    // Draw Node shape (Circle)
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.is_red ? '#ef4444' : (node.type === 'file' ? '#f59e0b' : '#3b82f6');
    ctx.fill();
    
    // Node outline
    ctx.lineWidth = 1.5 / globalScale; // Thinner lines when zoomed out
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Only draw text if we are reasonably zoomed in, OR if it's a critical threat
    // This saves MASSIVE amounts of CPU and completely eliminates canvas rendering lag
    if (globalScale > 0.8 || node.is_red) {
      ctx.font = `${6}px Inter`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(label, node.x, node.y + radius + 3);
    }

    // Highlight pinned node
    if (pinnedNode && pinnedNode.id === node.id) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 1.8, 0, 2 * Math.PI, false);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }
  }, [getNodeColor, getNodeSize, pinnedNode]);

  // Highlight logic
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
    document.body.style.cursor = node ? 'pointer' : 'default';
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (pinnedNode?.id === node.id) {
      // Unpin
      setPinnedNode(null);
      node.fx = undefined;
      node.fy = undefined;
    } else {
      // Pin
      setPinnedNode(node);
      node.fx = node.x;
      node.fy = node.y;
      fgRef.current?.centerAt(node.x, node.y, 1000);
    }
    onNodeClick?.(node);
  }, [pinnedNode, onNodeClick]);

  const handleBackgroundClick = useCallback(() => {
    if (pinnedNode) {
      (pinnedNode as any).fx = undefined;
      (pinnedNode as any).fy = undefined;
      setPinnedNode(null);
    }
  }, [pinnedNode]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.3, 5);
    fgRef.current?.zoom(newZoom, 500);
    setZoom(newZoom);
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom / 1.3, 0.3);
    fgRef.current?.zoom(newZoom, 500);
    setZoom(newZoom);
  }, [zoom]);

  const handleReset = useCallback(() => {
    fgRef.current?.zoomToFit(500, 30);
    setZoom(1);
    if (pinnedNode) {
      (pinnedNode as any).fx = undefined;
      (pinnedNode as any).fy = undefined;
      setPinnedNode(null);
    }
  }, [pinnedNode]);

  // Node type counts for legend
  const nodeTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.nodes.forEach(node => {
      const type = node.type || (node.is_red ? 'threat' : 'device');
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [data.nodes]);

  if (!data.nodes || data.nodes.length === 0) {
    return (
      <div className="force-graph-container" style={{ height }}>
        <EmptyState
          variant="graph"
          heading="No network data"
          description="Graph data is being generated or no connections detected"
        />
      </div>
    );
  }

  useEffect(() => {
    if (fgRef.current) {
      // Configure built-in forces for a slow, organic "discrete mathematics" graph layout
      const charge = fgRef.current.d3Force('charge');
      // Gentle repulsion to keep nodes comfortably apart without causing physics stuttering
      if (charge) charge.strength(-60).distanceMax(250);
      
      const link = fgRef.current.d3Force('link');
      // Standard link distance
      if (link) link.distance(60).strength(0.8);
      
      // Gentle center force to keep everything from drifting infinitely
      const center = fgRef.current.d3Force('center');
      if (center) center.strength(0.02);
      
      // Disable custom forces
      fgRef.current.d3Force('centerRed', null);
      fgRef.current.d3Force('grid', null);
    }
  }, []);
  
  // Removed manual d3ReheatSimulation so new nodes spawn gently without boiling the physics engine

  return (
    <div className="force-graph-container" style={{ height }} ref={containerRef}>
      <div className="force-graph-canvas-wrapper">
        <ForceGraph2D
          ref={fgRef}
          width={width}
          graphData={data as any}
          backgroundColor="transparent"
          nodeRelSize={6}
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode={() => 'replace'}
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          linkDirectionalArrowLength={0}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.01}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleColor={() => "rgba(255,255,255,0.7)"}
          d3VelocityDecay={0.85}
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
        />

        {/* Hover tooltip */}
        {hoveredNode && (
          <div
            className="force-graph-tooltip"
            style={{
              left: (hoveredNode.x || 0) + 20,
              top: hoveredNode.y || 0,
            }}
          >
            <div className="force-graph-tooltip__title">{hoveredNode.label || hoveredNode.id}</div>
            <div className="force-graph-tooltip__row">
              <span className="force-graph-tooltip__label">Type:</span>
              <span className="force-graph-tooltip__value">{hoveredNode.type || 'device'}</span>
            </div>
            {hoveredNode.risk_score !== undefined && (
              <div className="force-graph-tooltip__row">
                <span className="force-graph-tooltip__label">Risk:</span>
                <span className="force-graph-tooltip__value">{(hoveredNode.risk_score * 100).toFixed(0)}%</span>
              </div>
            )}
            {hoveredNode.connections !== undefined && (
              <div className="force-graph-tooltip__row">
                <span className="force-graph-tooltip__label">Connections:</span>
                <span className="force-graph-tooltip__value">{hoveredNode.connections}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="force-graph-controls">
        <Tooltip content="Zoom in" position="left">
          <Button variant="secondary" size="sm" onClick={handleZoomIn}><ZoomIn size={14} /></Button>
        </Tooltip>
        <Tooltip content="Zoom out" position="left">
          <Button variant="secondary" size="sm" onClick={handleZoomOut}><ZoomOut size={14} /></Button>
        </Tooltip>
        <Tooltip content="Reset view" position="left">
          <Button variant="secondary" size="sm" onClick={handleReset}><RefreshCcw size={14} /></Button>
        </Tooltip>
      </div>

      {/* Legend */}
      <div className="force-graph-legend">
        <div className="force-graph-legend__title">Node Types</div>
        {Object.entries(NODE_COLORS).map(([type, colors]) => {
          const count = nodeTypeCounts[type] || 0;
          if (count === 0) return null;
          return (
            <div key={type} className="force-graph-legend__item">
              <span
                className="force-graph-legend__color"
                style={{ background: colors.fill, borderColor: colors.stroke }}
              />
              <span className="force-graph-legend__label">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
              <Badge variant="neutral" size="sm">{count}</Badge>
            </div>
          );
        })}
        <div className="force-graph-legend__divider" />
        <div className="force-graph-legend__item">
          <span className="force-graph-legend__size-label">Size = Risk Level</span>
        </div>
      </div>
    </div>
  );
}
