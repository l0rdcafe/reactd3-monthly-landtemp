import { useState, useEffect } from "react";
import * as d3 from "d3";
import getTemps from "./get_temps";
import "./App.css";

const padding = {
  left: 144,
  right: 144,
  top: 16,
  bottom: 128,
};

const yValues = {
  0: "January",
  1: "February",
  2: "March",
  3: "April",
  4: "May",
  5: "June",
  6: "July",
  7: "August",
  8: "September",
  9: "October",
  10: "November",
  11: "December",
};

const colorRange = [
  "#5E4FA2",
  "#3288BD",
  "#66C2A5",
  "#ABDDA4",
  "#E6F598",
  "#FFFFBF",
  "#FEE08B",
  "#FDAE61",
  "#F46D43",
  "#D53E4F",
  "#9E0142",
];

const svgHeight = 400;

const xPageOffset = 120;
const yPageOffset = 220;

function App() {
  const [{ height, width }, setDimensions] = useState({
    height: svgHeight,
    width: 900,
  });
  const [temps, setTemps] = useState(null);
  const [{ xTicks, yTicks }, setAxes] = useState({ xTicks: [], yTicks: [] });
  const [data, setData] = useState([]);
  const [hoveredTemp, setHoveredTemp] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    getTemps()
      .then((tmps) => {
        const t = {
          ...tmps,
          monthlyVariance: tmps.monthlyVariance.map((tmp) => ({
            ...tmp,
            month: tmp.month - 1,
          })),
        };
        setTemps(t);
      })
      .catch((err) => {
        console.error({ err });
        setHasError(true);
      });
  }, []);

  useEffect(() => {
    if (temps != null) {
      const width = Math.ceil(temps.monthlyVariance.length / 12) * 3;
      setDimensions({ height: svgHeight, width });

      const nMonths = 12;
      const months = [...Array(nMonths)].map((_, i) => i);
      const yScale = d3.scaleLinear().domain([0, 11]).range([0, height]);
      const yTix = months.map((m) => ({
        value: m,
        yOffset: yScale(m) + svgHeight / 4,
      }));

      const xExtent = d3.extent(temps.monthlyVariance, (m) => m.year);
      const xScale = d3
        .scaleLinear()
        .domain(xExtent)
        .range([0, width + padding.left + 50]);
      // round year tick interval to 10
      const uniqYears = new Set(
        temps.monthlyVariance
          .map((m) => m.year)
          .filter((year) => year % 10 === 0)
      );
      const xTix = [...uniqYears].map((year) => ({
        value: year,
        xOffset: xScale(year),
      }));

      const colorExtent = d3.extent(
        temps.monthlyVariance,
        (m) => m.variance + temps.baseTemperature
      );
      const colorScale = d3
        .scaleQuantile()
        .domain(colorExtent)
        .range(colorRange);

      setAxes({ yTicks: yTix, xTicks: xTix });
      const result = temps.monthlyVariance.map((tmp) => ({
        x: xScale(tmp.year),
        y: yScale(tmp.month),
        month: tmp.month,
        year: tmp.year,
        height: Math.max(1, yTix[1].yOffset - yTix[0].yOffset),
        width: Math.min(4, xTix[1].xOffset - xTix[0].xOffset),
        fill: colorScale(tmp.variance + temps.baseTemperature),
        tempVariance: (tmp.variance + temps.baseTemperature).toFixed(1),
        variance: tmp.variance.toFixed(1),
      }));
      setData(result);
    }
  }, [temps, height]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Monthly Land-Surface Temperature</h1>
        {!hasError && (
          <h4>
            {temps != null
              ? `${temps.monthlyVariance[0].year} – ${
                  temps.monthlyVariance[temps.monthlyVariance.length - 1].year
                }; base temp ${temps.baseTemperature}℃`
              : "Fetching temperatures..."}
          </h4>
        )}
        {hasError && <h5>Could not retrieve temperatures :(</h5>}
      </header>
      <div
        id="tooltip"
        className={hoveredTemp != null ? "open" : ""}
        style={
          hoveredTemp != null
            ? {
                left: hoveredTemp.x + xPageOffset,
                top: hoveredTemp.y + yPageOffset,
              }
            : {}
        }
      >
        {hoveredTemp != null && (
          <>
            <small>
              {hoveredTemp.year} – {hoveredTemp.month}
            </small>
            <br />
            <small>{hoveredTemp.tempVariance}℃</small>
            <br />
            <small>{hoveredTemp.variance}℃</small>
          </>
        )}
      </div>
      {temps != null && data.length > 0 && (
        <svg
          width={width + padding.left + padding.right}
          height={height + padding.top + padding.bottom}
          id="main"
        >
          <path
            d={[
              `M${padding.top * 4},6`,
              "v-6",
              `H${height + padding.top + padding.bottom - 20}`,
              "v6",
            ].join(" ")}
            stroke="currentColor"
            fill="none"
            id="y-axis"
            transform="translate(60,0) rotate(90)"
          />
          {yTicks.map(({ value, yOffset }) => (
            <g key={value} transform={`translate(5,${yOffset})`}>
              <line
                y2="6"
                transform="translate(49,-2) rotate(270)"
                stroke="currentColor"
              />
              <text
                key={value}
                textAnchor="middle"
                transform="translate(22,2)"
                fontSize="10px"
              >
                {yValues[value]}
              </text>
            </g>
          ))}
          <path
            d={[
              "M0,6",
              "v-6",
              `H${height + padding.top + padding.bottom},${
                width + padding.left + 50
              }`,
              "v6",
            ].join(" ")}
            transform={`translate(60,${
              height + padding.top + padding.bottom - 20
            })`}
            fill="none"
            id="x-axis"
            stroke="currentColor"
          />
          {xTicks.map(({ value, xOffset }) => (
            <g
              key={value}
              transform={`translate(${xOffset + 35},${
                height + padding.top + padding.bottom - 10
              })`}
            >
              <line
                y2="6"
                stroke="currentColor"
                transform="translate(25,-10)"
              />
              <text
                key={value}
                textAnchor="middle"
                transform="translate(25,5)"
                fontSize="10px"
              >
                {value}
              </text>
            </g>
          ))}
          <g transform={`translate(60,86.75)`}>
            {data.map((d) => (
              <rect
                onMouseOver={() => {
                  if (hoveredTemp == null) {
                    setHoveredTemp({
                      x: d.x,
                      y: d.y,
                      year: d.year,
                      month: yValues[d.month],
                      tempVariance: d.tempVariance,
                      variance: d.variance,
                    });
                  }
                }}
                onMouseOut={() => {
                  setHoveredTemp(null);
                }}
                stroke={
                  hoveredTemp?.x === d.x && hoveredTemp?.y === d.y
                    ? "#000"
                    : "none"
                }
                fill={d.fill}
                data-month={d.month}
                data-year={d.year}
                data-temp={temps.baseTemperature}
                x={d.x}
                y={d.y}
                height={d.height}
                width={d.width}
              />
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}

export default App;
