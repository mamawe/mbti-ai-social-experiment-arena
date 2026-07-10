import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { HistoricalMetric } from "../types";

interface EvolutionTrendChartProps {
  history: HistoricalMetric[];
}

export default function EvolutionTrendChart({ history }: EvolutionTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !history || history.length === 0) return;

    // Get parent container dimensions
    const width = containerRef.current.clientWidth || 300;
    const height = 120; // compact height to fit above timeline feed
    const margin = { top: 10, right: 15, bottom: 20, left: 25 };

    // Clear previous elements
    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll("*").remove();

    // Prepare data
    // Ensure we have at least 2 points to draw a line, if not, duplicate the first one slightly
    const data = history.length === 1 
      ? [...history, { ...history[0], round: 1.1 }] 
      : history;

    // Set up Scales
    // X scale is the round (from 1 to max 12)
    const maxRound = Math.max(12, d3.max(data, d => d.round) || 12);
    const xScale = d3.scaleLinear()
      .domain([1, maxRound])
      .range([margin.left, width - margin.right]);

    // Y scale is 0 to 100 (for Morale, Consensus, and normalized Cash)
    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    // Draw grid lines
    svgElement.append("g")
      .attr("class", "grid text-slate-800 opacity-20")
      .attr("transform", `translate(0, 0)`)
      .call(d3.axisLeft(yScale)
        .tickValues([20, 50, 80])
        .tickSize(-width)
        .tickFormat(() => "")
      );

    // Draw Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(12, maxRound))
      .tickFormat(d => `R${d}`);

    const yAxis = d3.axisLeft(yScale)
      .tickValues([0, 50, 100])
      .tickFormat(d => `${d}%`);

    svgElement.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .attr("class", "text-slate-500 font-mono text-[9px]")
      .call(xAxis)
      .selectAll("path, line")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1);

    svgElement.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .attr("class", "text-slate-500 font-mono text-[9px]")
      .call(yAxis)
      .selectAll("path, line")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1);

    // Define line generator
    const lineGenerator = (valueKey: "teamMorale" | "consensusLevel" | "cashDaysNormalized") => {
      return d3.line<any>()
        .curve(d3.curveMonotoneX)
        .x(d => xScale(d.round))
        .y(d => {
          if (valueKey === "cashDaysNormalized") {
            // Normalize cashDays (30 days = 100%)
            const val = (d.cashDays / 30) * 100;
            return yScale(Math.min(100, Math.max(0, val)));
          }
          return yScale(Math.min(100, Math.max(0, d[valueKey])));
        });
    };

    // 1. Draw Cash Flow Area / Line (Emerald)
    const cashLine = lineGenerator("cashDaysNormalized");
    
    // Add gradient for cash flow area
    const cashGradId = "cash-gradient";
    const defs = svgElement.append("defs");
    const cashGrad = defs.append("linearGradient")
      .attr("id", cashGradId)
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
    cashGrad.append("stop").attr("offset", "0%").attr("stop-color", "#10b981").attr("stop-opacity", 0.15);
    cashGrad.append("stop").attr("offset", "100%").attr("stop-color", "#10b981").attr("stop-opacity", 0.0);

    const cashAreaGenerator = d3.area<any>()
      .curve(d3.curveMonotoneX)
      .x(d => xScale(d.round))
      .y0(height - margin.bottom)
      .y1(d => yScale(Math.min(100, (d.cashDays / 30) * 100)));

    svgElement.append("path")
      .datum(data)
      .attr("fill", `url(#${cashGradId})`)
      .attr("d", cashAreaGenerator);

    svgElement.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#10b981")
      .attr("stroke-width", 2)
      .attr("d", cashLine);

    // 2. Draw Morale Line (Amber)
    const moraleLine = lineGenerator("teamMorale");
    svgElement.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#f59e0b")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "1,0")
      .attr("d", moraleLine);

    // 3. Draw Consensus Line (Sky)
    const consensusLine = lineGenerator("consensusLevel");
    svgElement.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 2)
      .attr("d", consensusLine);

    // Add interactive hover dots
    const latest = data[data.length - 1];
    const addDot = (val: number, color: string) => {
      svgElement.append("circle")
        .attr("cx", xScale(latest.round))
        .attr("cy", yScale(Math.min(100, Math.max(0, val))))
        .attr("r", 3.5)
        .attr("fill", color)
        .attr("stroke", "#0b0f19")
        .attr("stroke-width", 1.5);
    };

    addDot((latest.cashDays / 30) * 100, "#10b981");
    addDot(latest.teamMorale, "#f59e0b");
    addDot(latest.consensusLevel, "#38bdf8");

  }, [history]);

  return (
    <div ref={containerRef} className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex flex-col gap-2 relative">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
          📈 演化趋势概览 / EVOLUTION TRENDS
        </span>
        
        {/* Legends */}
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            <span className="text-slate-300">现金储备</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
            <span className="text-slate-300">团队士气</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span>
            <span className="text-slate-300">共识一致度</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[100px]">
        <svg ref={svgRef} className="w-full h-full overflow-visible" />
      </div>
    </div>
  );
}
