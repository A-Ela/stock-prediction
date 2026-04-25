import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function MainChart({ data = [] }) {
  const ref = useRef();

  useEffect(() => {
    if (!data.length) return;

    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.date)))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain(d3.extent(data, d => d.price))
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3.line()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.price))
      .curve(d3.curveMonotoneX);

    // Line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#00D4FF")
      .attr("stroke-width", 2)
      .attr("d", line);

    // X Axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0))
      .attr("color", "#7A9CC8");

    // Y Axis
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr("color", "#7A9CC8");

  }, [data]);

  return (
    <div style={{
      background: "#101828",
      borderRadius: 12,
      padding: 16
    }}>
      <h3>Price Chart</h3>
      <svg ref={ref} width={600} height={300} />
    </div>
  );
}