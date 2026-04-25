import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function Sparkline({ data = [] }) {
  const ref = useRef();

  useEffect(() => {
    if (!data.length) return;

    const width = 100;
    const height = 40;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const x = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain(d3.extent(data, d => d.price))
      .range([height, 0]);

    const line = d3.line()
      .x((d, i) => x(i))
      .y(d => y(d.price))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#00D4FF")
      .attr("stroke-width", 2)
      .attr("d", line);

  }, [data]);

  return <svg ref={ref} width={100} height={40} />;
}