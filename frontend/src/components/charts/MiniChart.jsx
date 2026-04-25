import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function MiniChart({ data = [] }) {
  const ref = useRef();

  useEffect(() => {
    if (!data.length) return;

    const width = 150;
    const height = 50;

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
      .y(d => y(d.price));

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#00E5A0")
      .attr("stroke-width", 2)
      .attr("d", line);

  }, [data]);

  return <svg ref={ref} width={150} height={50} />;
}