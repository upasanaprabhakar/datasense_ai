import { useEffect, useRef } from "react";
import * as d3 from "d3";

export function LineageGraph({ fields, onSelectField }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!fields || fields.length === 0) return;

    let simulation;

    const draw = () => {
      if (!svgRef.current || !containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = 500;

      if (width === 0) return;

      d3.select(svgRef.current).selectAll("*").remove();

      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height);

      // ── Defs ──────────────────────────────────────────────────────────────
      const defs = svg.append("defs");

      const bgGrad = defs
        .append("radialGradient")
        .attr("id", "bgGrad")
        .attr("cx", "50%").attr("cy", "50%").attr("r", "70%");
      bgGrad.append("stop").attr("offset", "0%").attr("stop-color", "#0f0f2a");
      bgGrad.append("stop").attr("offset", "100%").attr("stop-color", "#07070f");

      const glowFilter = defs.append("filter").attr("id", "glow");
      glowFilter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
      const fm1 = glowFilter.append("feMerge");
      fm1.append("feMergeNode").attr("in", "coloredBlur");
      fm1.append("feMergeNode").attr("in", "SourceGraphic");

      const goldGlow = defs.append("filter").attr("id", "goldGlow");
      goldGlow.append("feGaussianBlur").attr("stdDeviation", "5").attr("result", "coloredBlur");
      const fm2 = goldGlow.append("feMerge");
      fm2.append("feMergeNode").attr("in", "coloredBlur");
      fm2.append("feMergeNode").attr("in", "SourceGraphic");

      defs
        .append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 28).attr("refY", 0)
        .attr("markerWidth", 6).attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#8b5cf6");

      // ── Background ────────────────────────────────────────────────────────
      svg.append("rect").attr("width", width).attr("height", height).attr("fill", "url(#bgGrad)");

      const gridG = svg.append("g").attr("opacity", 0.04);
      for (let x = 0; x < width; x += 40) {
        gridG.append("line").attr("x1", x).attr("y1", 0).attr("x2", x).attr("y2", height)
          .attr("stroke", "#6366f1").attr("stroke-width", 1);
      }
      for (let y = 0; y < height; y += 40) {
        gridG.append("line").attr("x1", 0).attr("y1", y).attr("x2", width).attr("y2", y)
          .attr("stroke", "#6366f1").attr("stroke-width", 1);
      }

      // ── Data ──────────────────────────────────────────────────────────────
      const nodes = fields.map((f) => ({
        id: f.fieldName,
        field: f,
        isPrimaryKey: f.isPrimaryKey,
        isForeignKey: f.isForeignKey,
        type: f.detectedType,
        quality: f.qualityScore,
        hasPII: f.hasPII,
      }));

      const primaryKeys = nodes.filter((n) => n.isPrimaryKey);
      const links = [];

      nodes.forEach((n) => {
        if (!n.isForeignKey) return;
        const base = n.id.replace(/_id$/i, "");
        const target =
          primaryKeys.find((pk) => pk.id === `${base}_id` || pk.id === base || pk.id === "id") ||
          (primaryKeys.length > 0 ? primaryKeys[0] : null);
        if (target && target.id !== n.id) {
          links.push({ source: n.id, target: target.id });
        }
      });

      // ── Simulation ────────────────────────────────────────────────────────
      if (simulation) simulation.stop();

      simulation = d3
        .forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d) => d.id).distance(110).strength(0.8))
        .force("charge", d3.forceManyBody().strength(-180))
        .force("center", d3.forceCenter(width / 2, height / 2).strength(0.8))
        .force("collision", d3.forceCollide().radius(50).strength(0.9))
        .force("x", d3.forceX(width / 2).strength(0.08))
        .force("y", d3.forceY(height / 2).strength(0.08))
        .alphaDecay(0.02);

      // ── Links ─────────────────────────────────────────────────────────────
      const link = svg
        .append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#8b5cf6")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5,3")
        .attr("marker-end", "url(#arrow)");

      // ── Nodes ─────────────────────────────────────────────────────────────
      const node = svg
        .append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .style("cursor", "pointer")
        .call(
          d3.drag()
            .on("start", (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x; d.fy = d.y;
            })
            .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on("end", (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null; d.fy = null;
            })
        )
        .on("click", (event, d) => {
          event.stopPropagation();
          if (onSelectField) onSelectField(d.id);
        });

      // PK outer ring
      node.filter((d) => d.isPrimaryKey)
        .append("circle").attr("r", 30).attr("fill", "none")
        .attr("stroke", "#f59e0b").attr("stroke-width", 1).attr("stroke-opacity", 0.3);

      // Main circle
      node.append("circle")
        .attr("r", (d) => (d.isPrimaryKey ? 22 : 16))
        .attr("fill", (d) => {
          if (d.isPrimaryKey) return "#1e1630";
          if (d.hasPII) return "#2d1b1b";
          return "#111128";
        })
        .attr("stroke", (d) => {
          if (d.isPrimaryKey) return "#f59e0b";
          if (d.hasPII) return "#ef4444";
          if (d.isForeignKey) return "#8b5cf6";
          return d.quality >= 85 ? "#22c55e" : d.quality >= 60 ? "#f59e0b" : "#ef4444";
        })
        .attr("stroke-width", (d) => (d.isPrimaryKey ? 2.5 : 1.5))
        .attr("filter", (d) => (d.isPrimaryKey ? "url(#goldGlow)" : "url(#glow)"));

      // Icons
      node.filter((d) => d.isPrimaryKey)
        .append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
        .attr("font-size", "14px").text("🔑");

      node.filter((d) => d.isForeignKey && !d.isPrimaryKey)
        .append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
        .attr("font-size", "11px").text("🔗");

      node.filter((d) => d.hasPII && !d.isPrimaryKey && !d.isForeignKey)
        .append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
        .attr("font-size", "11px").text("⚠");

      // Type dot for regular nodes
      node.filter((d) => !d.isPrimaryKey && !d.isForeignKey && !d.hasPII)
        .append("circle").attr("r", 5)
        .attr("fill", (d) => {
          const colors = { integer: "#8b5cf6", string: "#6366f1", datetime: "#14b8a6", decimal: "#f97316", boolean: "#ec4899", email: "#3b82f6" };
          return colors[d.type] || "#6366f1";
        });

      // Field name
      node.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", (d) => (d.isPrimaryKey ? 36 : 28))
        .attr("font-size", "10px").attr("font-family", "monospace").attr("fill", "#94a3b8")
        .text((d) => (d.id.length > 14 ? d.id.substring(0, 12) + "…" : d.id));

      // Quality score
      node.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", (d) => (d.isPrimaryKey ? 48 : 40))
        .attr("font-size", "9px")
        .attr("fill", (d) => (d.quality >= 85 ? "#22c55e" : d.quality >= 60 ? "#f59e0b" : "#ef4444"))
        .text((d) => `${d.quality}%`);

      // ── Tick ──────────────────────────────────────────────────────────────
      simulation.on("tick", () => {
        link
          .attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);

        node.attr("transform", (d) =>
          `translate(${Math.max(40, Math.min(width - 40, d.x))},${Math.max(40, Math.min(height - 40, d.y))})`
        );
      });
    };

    draw();

    // ResizeObserver redraws the graph when the sidebar opens/closes,
    // which fixes the black dot artifact caused by stale SVG dimensions.
    const observer = new ResizeObserver(() => {
      if (simulation) simulation.stop();
      draw();
    });
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      if (simulation) simulation.stop();
      observer.disconnect();
    };
  }, [fields, onSelectField]);

  return (
    <div
      ref={containerRef}
      className="w-full border border-ds-border rounded-xl overflow-hidden"
      style={{ background: "#07070f" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-ds-border"
        style={{ background: "#0c0c1e" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ds-text-primary">Field Lineage Graph</span>
          <span className="text-xs text-ds-text-muted">Click a node to inspect · Drag to rearrange</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-ds-text-muted">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-yellow-400 inline-block" />Primary Key</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-purple-400 inline-block" />Foreign Key</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-red-400 inline-block" />PII Field</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-green-400 inline-block" />Clean Field</span>
        </div>
      </div>
      {/* display:block removes the inline bottom gap that causes the black line */}
      <svg ref={svgRef} className="w-full" style={{ height: 500, display: "block" }} />
    </div>
  );
}