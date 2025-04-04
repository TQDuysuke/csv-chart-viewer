import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

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
  const [visibleRange, setVisibleRange] = useState([0, 5000]);
  const [zoom, setZoom] = useState(1);
  const [showValue, setShowValue] = useState(5000);
  const [kalmanParams, setKalmanParams] = useState({ q: 1, r: 1, p: 1, k: 1 });

  useEffect(() => {
    setVisibleRange([0, showValue]);
  }, [showValue]);

  const fetchData = async () => {
    try {
      const response = await fetch("http://10.2.39.172:3000/"); // Thay bằng URL của bạn
      const jsonData = await response.json();

      // Lấy key đầu tiên (ví dụ: "10.2.39.72")
      const ipKey = Object.keys(jsonData)[0];
      const dateKey = Object.keys(jsonData[ipKey])[0];
      const rawData = jsonData[ipKey][dateKey];

      // Chuyển đổi chuỗi dữ liệu thành mảng giá trị
      const parsedData = rawData.flatMap((chunk, chunkIndex) => {
        const values = chunk
          .replace(/{|}/g, "") // Loại bỏ dấu ngoặc nhọn
          .split(",") // Tách các giá trị
          .map((value) => parseFloat(value)); // Chuyển thành số

        return values.map((value, index) => {
          const totalIndex = chunkIndex * values.length + index;
          const totalMinutes = Math.floor(totalIndex / 500);
          const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
          const minutes = (totalMinutes % 60).toString().padStart(2, "0");
          const seconds = ((totalIndex % 500) * 60 / 500).toFixed(0).padStart(2, "0");

          return {
            time: `${hours}:${minutes}:${seconds}`,
            value: value || 0, // Đảm bảo giá trị không phải NaN
          };
        });
      });

      setData(parsedData);
      setFilteredData(applyKalmanFilter(parsedData, kalmanParams.q, kalmanParams.r, kalmanParams.p, kalmanParams.k));
      setVisibleRange([0, showValue]);
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

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button onClick={fetchData} className="p-2 bg-blue-500 text-white rounded mb-4">Fetch Data</button>

      <div className="h-400px overflow-y-auto" onWheel={handleScroll}>
        <ResponsiveContainer width="100%" height={400 * zoom}>
          <LineChart data={filteredData.slice(visibleRange[0], visibleRange[1])}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" interval={Math.max(1, Math.floor(showValue / 10))} angle={-30} height={60} tick={{ fontSize: 10 }} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={handlePrev} className="p-2 bg-gray-500 text-white rounded">Prev {showValue}</button>
        <button onClick={handleNext} className="p-2 bg-green-500 text-white rounded">Next {showValue}</button>
      </div>

      <div className="mt-4 flex gap-2">
        <label>Zoom: </label>
        <input type="number" step="0.1" min="0.5" max="2" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="p-2 border rounded" />
        <label>Show Values: </label>
        <input type="number" step="100" value={showValue} onChange={(e) => setShowValue(Number(e.target.value))} className="p-2 border rounded" />
      </div>

      <div className="mt-4 flex gap-2">
        <label>Q: </label>
        <input type="number" step="0.1" value={kalmanParams.q} onChange={(e) => setKalmanParams({ ...kalmanParams, q: Number(e.target.value) })} className="p-2 border rounded" />
        <label>R: </label>
        <input type="number" step="0.1" value={kalmanParams.r} onChange={(e) => setKalmanParams({ ...kalmanParams, r: Number(e.target.value) })} className="p-2 border rounded" />
        <label>P: </label>
        <input type="number" step="0.1" value={kalmanParams.p} onChange={(e) => setKalmanParams({ ...kalmanParams, p: Number(e.target.value) })} className="p-2 border rounded" />
        <label>K: </label>
        <input type="number" step="0.1" value={kalmanParams.k} onChange={(e) => setKalmanParams({ ...kalmanParams, k: Number(e.target.value) })} className="p-2 border rounded" />
        <button onClick={handleApplyFilter} className="p-2 bg-purple-500 text-white rounded">Apply Filter</button>
      </div>
    </div>
  );
}
