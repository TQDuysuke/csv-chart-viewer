import React, { useState, useEffect } from "react";
import "./App.css"; // Import your CSS file here
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const applyKalmanFilter = (data, q, r, p, k) => {
  let x = data[0]?.value || 0;
  let p_now = p;
  return data.map((point) => {
    p_now += q;
    k = p_now / (p_now + r);
    x += k * (point.value - x);
    p_now *= (1 - k);
    return { ...point, value: x };
  });
};

export default function CSVChartApp() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [visibleRange, setVisibleRange] = useState([0, 1000]);
  const [showValue, setShowValue] = useState(1000);
  const [kalmanParams, setKalmanParams] = useState({ q: 1, r: 1, p: 1, k: 1 });
  const [isLiveView, setIsLiveView] = useState(true); // State to toggle between live and replay views
  const [selectedDate, setSelectedDate] = useState(""); // State for the selected date

  useEffect(() => {
    setVisibleRange(([start]) => {
      const newStart = Math.max(0, Math.min(start, data.length - showValue));
      return [newStart, newStart + showValue];
    });
  }, [showValue, data.length]);

  useEffect(() => {
    if (isLiveView) {
      const interval = setInterval(fetchData, 3000); // Fetch data every 3 seconds in live view
      return () => clearInterval(interval); // Cleanup interval on component unmount
    }
  }, [isLiveView, showValue, kalmanParams]); // Dependencies to ensure the latest values are used

  useEffect(() => {
    if (!isLiveView && selectedDate) {
      fetchData(); // Fetch data when a date is selected in replay mode
    }
  }, [selectedDate, isLiveView]); // Dependencies to trigger on date or view mode change

  const fetchData = async () => {
    try {
      const response = await fetch("https://database.tqduy.id.vn/", {
        headers: {
          "x-api-key": "IzUKf0FyBbktDiRxgry6fpRg8NTpxmb8XU777DDhwqDVnuUbolhSYxSUsijwBkN2", // API key from environment variables
          "x-uid": "EDS",         // UID from environment variables
        },
      });
      const jsonData = await response.json();

      // Lấy key đầu tiên (ví dụ: "10.2.39.72")
      const ipKey = Object.keys(jsonData)[0];
      const dateKey = isLiveView ? Object.keys(jsonData[ipKey])[0] : selectedDate; // Use selected date in replay mode
      if (!jsonData[ipKey][dateKey]) {
        console.error("No data available for the selected date");
        setData([]);
        setFilteredData([]);
        return;
      }
      const rawData = jsonData[ipKey][dateKey];

      // Extract the starting timestamp from the first chunk
      const startingTimestamp = JSON.parse(rawData[0]).t;

      // Chuyển đổi chuỗi dữ liệu thành mảng giá trị
      const parsedData = rawData.flatMap((chunk, chunkIndex) => {
        const { values } = JSON.parse(chunk); // Extract 'values' and 't'
        return values.map((value, index) => {
          const totalIndex = chunkIndex * values.length + index;
          const currentTimestamp = startingTimestamp + totalIndex * 2; // Increment by 2ms for each sample
          const date = new Date(currentTimestamp + 20 * 60 * 60 * 1000); // Adjust to UTC+7

          const hours = date.getUTCHours().toString().padStart(2, "0");
          const minutes = date.getUTCMinutes().toString().padStart(2, "0");
          const seconds = date.getUTCSeconds().toString().padStart(2, "0");
          const milliseconds = date.getUTCMilliseconds().toString().padStart(3, "0");

          return {
            time: `${hours}:${minutes}:${seconds}.${milliseconds}`, // Format time using the adjusted timestamp
            value: value || 0, // Ensure value is not NaN
          };
        });
      });

      setData(parsedData);
      const startIndex = Math.max(parsedData.length - showValue, 0);
      setFilteredData(applyKalmanFilter(parsedData, kalmanParams.q, kalmanParams.r, kalmanParams.p, kalmanParams.k));
      setVisibleRange([startIndex, startIndex + showValue]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleApplyFilter = () => {
    setFilteredData(applyKalmanFilter(data, kalmanParams.q, kalmanParams.r, kalmanParams.p, kalmanParams.k));
  };

  const handleNext = () => {
    setVisibleRange(([start]) => {
      const newStart = Math.min(start + showValue, data.length - showValue);
      return [newStart, newStart + showValue];
    });
  };

  const handlePrev = () => {
    setVisibleRange(([start]) => {
      const newStart = Math.max(start - showValue, 0);
      return [newStart, newStart + showValue];
    });
  };

  const handleScroll = (event) => {
    setVisibleRange(([start, end]) => {
      const step = Math.max(100, showValue / 10);
      const newStart = event.deltaY > 0 ? Math.min(start + step, data.length - showValue) : Math.max(start - step, 0);
      return [newStart, newStart + showValue];
    });
  };

  const handleJumpToStart = () => {
    setVisibleRange([0, showValue]);
  };

  const handleJumpToEnd = () => {
    const startIndex = Math.max(data.length - showValue, 0);
    setVisibleRange([startIndex, startIndex + showValue]);
  };

  const handleRangeChange = ([start, end]) => {
    setVisibleRange([start, end]);
  };

  const handleRangeDrag = (delta) => {
    setVisibleRange(([start, end]) => {
      const rangeLength = end - start;
      const newStart = Math.max(0, start + delta);
      const newEnd = Math.min(data.length, newStart + rangeLength);
      return [newStart, newEnd];
    });
  };

  const handleShowValueChange = (newShowValue) => {
    setShowValue(newShowValue);
    setVisibleRange(([start]) => {
      const newStart = Math.max(0, Math.min(start, data.length - newShowValue));
      return [newStart, newStart + newShowValue];
    });
  };

  const handleSlider2Change = (start) => {
    setVisibleRange([start, start + showValue]);
  };

  const handleSlider1Change = (value) => {
    handleShowValueChange(value);
  };

  const handleExportData = () => {
    if (!selectedDate || !data.length) {
      console.error("No data available to export.");
      return;
    }

    const csvContent = [
      ["Time", "Value"], // CSV header
      ...data.map((row) => [row.time, row.value]), // Map data to CSV rows
    ]
      .map((e) => e.join(",")) // Join each row with commas
      .join("\n"); // Join rows with newlines

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data_${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setIsLiveView(true)}
          className={`button-primary ${isLiveView ? "bg-blue-500" : "bg-gray-300"}`}
        >
          Live View
        </button>

        <button
          onClick={() => setIsLiveView(false)}
          className={`button-primary ${!isLiveView ? "bg-blue-500" : "bg-gray-300"}`}
        >
          Replay View
        </button>
      </div>

      {!isLiveView && (
        <div className="mb-4">
          <label htmlFor="date-picker" className="block mb-2">Select Date:</label>
          <input
            type="date"
            id="date-picker"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border rounded w-full sm:w-auto"
          />
        </div>
      )}
      
      <div className="mb-4">
        <span className={`status-indicator ${isLiveView ? "status-live" : "status-replay"}`}>
          {isLiveView ? "Live View Active" : "Replay View Active"}
        </span>
      </div>

      <div className="h-[400px] overflow-y-auto" onWheel={handleScroll}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={filteredData.slice(visibleRange[0], visibleRange[1])}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" interval={Math.max(1, Math.floor(showValue / 10))} angle={-30} height={60} tick={{ fontSize: 10 }} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        <label className="block mb-2">Adjust Visible Range:</label>
        <Slider
          min={1}
          max={20000}
          value={showValue}
          onChange={handleSlider1Change}
          trackStyle={[{ backgroundColor: "#8884d8" }]}
          handleStyle={[{ borderColor: "#8884d8" }]}
        />
        <div className="mt-2 flex justify-between text-sm">
          <span>Show Value: {showValue}</span>
        </div>
      </div>

      {!isLiveView && (
        <div className="mt-4">
          <label className="block mb-2">Adjust Start Time:</label>
          <Slider
            min={0}
            max={data.length - showValue}
            value={visibleRange[0]}
            onChange={handleSlider2Change}
            trackStyle={[{ backgroundColor: "#82ca9d" }]}
            handleStyle={[{ borderColor: "#82ca9d" }]}
          />
          <div className="mt-2 flex justify-between text-sm">
            <span>
              Start Time: {filteredData[visibleRange[0]]?.time || "N/A"}
            </span>
            <span> - </span>
            <span>
              End Time: {filteredData[visibleRange[1] - 1]?.time || "N/A"}
            </span>
          </div>
        </div>
      )}

        {!isLiveView && (
          <>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={handleJumpToStart} className="button-primary w-full sm:w-auto">Jump to Start</button>
            <button onClick={handlePrev} className="button-primary w-full sm:w-auto">Prev {showValue}</button>
            <button onClick={handleNext} className="button-primary w-full sm:w-auto">Next {showValue}</button>
            <button onClick={handleJumpToEnd} className="button-primary w-full sm:w-auto">Jump to End</button>
          </div>
            <div className="mt-4">
              <button onClick={handleExportData} className="button-primary w-full sm:w-auto">
                Export Data as CSV
              </button>
            </div>
          </>
        )}

      <h2 className="text-lg font-semibold">Kalman Filter Parameters:</h2>
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <label className="w-full sm:w-auto">Q: </label>
        <input type="number" step="0.1" value={kalmanParams.q} onChange={(e) => setKalmanParams({ ...kalmanParams, q: Number(e.target.value) })} className="p-2 border rounded w-full sm:w-auto" />
        <label className="w-full sm:w-auto">R: </label>
        <input type="number" step="0.1" value={kalmanParams.r} onChange={(e) => setKalmanParams({ ...kalmanParams, r: Number(e.target.value) })} className="p-2 border rounded w-full sm:w-auto" />
        <label className="w-full sm:w-auto">P: </label>
        <input type="number" step="0.1" value={kalmanParams.p} onChange={(e) => setKalmanParams({ ...kalmanParams, p: Number(e.target.value) })} className="p-2 border rounded w-full sm:w-auto" />
        <label className="w-full sm:w-auto">K: </label>
        <input type="number" step="0.1" value={kalmanParams.k} onChange={(e) => setKalmanParams({ ...kalmanParams, k: Number(e.target.value) })} className="p-2 border rounded w-full sm:w-auto" />
        <button onClick={handleApplyFilter} className="button-primary w-full sm:w-auto">Apply Filter</button>
      </div>
    </div>
  );
}
