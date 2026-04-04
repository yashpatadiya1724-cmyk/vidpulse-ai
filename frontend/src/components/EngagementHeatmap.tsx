"use client";
import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { AttentionPoint } from "@/types";

interface Props {
  timeline: AttentionPoint[];
  onSeek?: (t: number) => void;
}

export function EngagementHeatmap({ timeline, onSeek }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !timeline.length) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const W = ref.current.clientWidth || 600;
    const H = 56;
    const cellW = Math.max(2, W / timeline.length);
    const colorScale = d3.scaleSequential().domain([0, 1]).interpolator(d3.interpolateRdYlGn);

    svg.attr("width", W).attr("height", H);

    // Background
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#111827").attr("rx", 8);

    svg.selectAll("rect.cell")
      .data(timeline)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", (_, i) => i * cellW)
      .attr("y", 0)
      .attr("width", Math.max(1, cellW - 0.5))
      .attr("height", H)
      .attr("fill", d => colorScale(d.score))
      .attr("opacity", 0.85)
      .style("cursor", "pointer")
      .on("click", (_, d) => onSeek?.(d.second))
      .on("mouseover", function() { d3.select(this).attr("opacity", 1); })
      .on("mouseout",  function() { d3.select(this).attr("opacity", 0.85); })
      .append("title")
      .text(d => `${d.second}s — ${(d.score * 100).toFixed(0)}% — ${d.label}`);
  }, [timeline, onSeek]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white">Engagement Heatmap</p>
        <p className="text-xs text-gray-500">Click to seek</p>
      </div>
      <svg ref={ref} className="w-full rounded-lg overflow-hidden" style={{ height: 56 }} />
      <div className="flex justify-between text-xs text-gray-600 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#ef4444" }} /> Low
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#eab308" }} /> Medium
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#22c55e" }} /> High
        </span>
      </div>
    </div>
  );
}
