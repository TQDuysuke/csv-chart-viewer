import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import "./chart.css"; // Import your CSS file for styling
export default function Chart({ data, visibleRange, showValue, handleScroll }) {
  const [pointer1, setPointer1] = useState(visibleRange[0]);
  const [pointer2, setPointer2] = useState(visibleRange[1]);
  const [activePointer, setActivePointer] = useState(1); // Track which pointer is active

  useEffect(() => {
    // Remove restriction of pointers to the visible range
    setPointer1((prev) => (prev < 0 ? 0 : prev >= data.length ? data.length - 1 : prev));
    setPointer2((prev) => (prev < 0 ? 0 : prev >= data.length ? data.length - 1 : prev));
  }, [data]);

  const handleChartClick = (e) => {
    if (e && e.activeLabel != null) {
      const clickedIndex = data.findIndex((d) => d[data[0]?.t ? "t" : "time"] === e.activeLabel);
      if (clickedIndex !== -1) {
        if (activePointer === 1) {
          setPointer1(clickedIndex);
        } else {
          setPointer2(clickedIndex);
        }
      }
    }
  };

  const samplesBetweenPointers = Math.abs(pointer2 - pointer1);
  const timeBetweenPointers = (samplesBetweenPointers * 2) ; // Convert to seconds
  const sampleCount = visibleRange[1] - visibleRange[0];

  return (
    <div className="chart-container h-[400px] overflow-y-auto" onWheel={handleScroll}>
      <div className="info-section text-sm text-gray-600 mb-2">
        Pointer 1: {pointer1}, Pointer 2: {pointer2} <br/>
        Time between pointers: {timeBetweenPointers.toFixed(3)} miliseconds
      </div>
      <div className="controls-section mb-2 flex gap-2">
        <button
          onClick={() => setActivePointer(1)}
          className={`pointer1-button px-4 py-2 rounded ${activePointer === 1 ? "bg-red-500 text-white" : "bg-gray-200"}`}
        >
          Select Pointer 1
        </button>
        <button
          onClick={() => setActivePointer(2)}
          className={`pointer2-button px-4 py-2 rounded ${activePointer === 2 ? "bg-green-500 text-white" : "bg-gray-200"}`}
        >
          Select Pointer 2
        </button>
        <button
          onClick={() => {
            const middle = Math.floor((visibleRange[0] + visibleRange[1]) / 2);
            setPointer1(Math.max(visibleRange[0], middle - 250));
            setPointer2(Math.min(visibleRange[1] - 1, middle + 250));
          }}
          className="reset-button px-4 py-2 rounded bg-blue-500 text-white"
        >
          Reset Pointers
        </button>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data.slice(visibleRange[0], visibleRange[1])}
          onClick={handleChartClick}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={data[0]?.t ? "t" : "time"}
            interval={Math.max(1, Math.floor(showValue / 10))}
            angle={-30}
            height={60}
            tick={{ fontSize: 10 }}
          />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="transparent"
            dot={(dotProps) => {
              const globalIndex = visibleRange[0] + dotProps.index; // Map the local index to the global dataset
              return globalIndex === pointer1 ? (
                <circle cx={dotProps.cx} cy={dotProps.cy} r={5} fill="red" />
              ) : globalIndex === pointer2 ? (
                <circle cx={dotProps.cx} cy={dotProps.cy} r={5} fill="green" />
              ) : null;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
