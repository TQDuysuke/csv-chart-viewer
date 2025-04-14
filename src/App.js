import React, { useState, useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import DatePicker from "./components/DatePicker";
import StatusIndicator from "./components/StatusIndicator";
import Chart from "./components/Chart";
import KalmanFilterControls from "./components/KalmanFilterControls";
import RangeControls from "./components/RangeControls";
import AppHeader from "./components/AppHeader";
import AppFooter from "./components/AppFooter";
import Login from "./components/Login";
import Cookies from "js-cookie"; // Import js-cookie for managing cookies

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ UID: "", apiKey: "" });
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [visibleRange, setVisibleRange] = useState([0, 1000]);
  const [showValue, setShowValue] = useState(1000);
  const [kalmanParams, setKalmanParams] = useState({ q: 1, r: 1, p: 1, k: 1 });
  const [isLiveView, setIsLiveView] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState(""); // State to store error messages

  useEffect(() => {
    // Check for existing login credentials in cookies
    const savedUID = Cookies.get("UID");
    const savedApiKey = Cookies.get("apiKey");
    if (savedUID && savedApiKey) {
      setCredentials({ UID: savedUID, apiKey: savedApiKey });
      setIsAuthenticated(true);
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleLogin = ({ UID, apiKey }) => {
    setCredentials({ UID, apiKey });
    setIsAuthenticated(true);
    // Save login credentials to cookies
    Cookies.set("UID", UID, { expires: 7 }); // Expires in 7 days
    Cookies.set("apiKey", apiKey, { expires: 7 });
  };

  const handleLogout = () => {
    // Clear cookies and reset authentication state
    Cookies.remove("UID");
    Cookies.remove("apiKey");
    setIsAuthenticated(false);
    setCredentials({ UID: "", apiKey: "" });
    window.location.reload(); // Reload the page to reset the app state
  };

  useEffect(() => {
    if (!isAuthenticated) return; // Pause data fetching if not authenticated
    setVisibleRange(([start]) => {
      const newStart = Math.max(0, Math.min(start, data.length - showValue));
      return [newStart, newStart + showValue];
    });
  }, [showValue, data.length, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !isLiveView) return; // Pause data fetching if not authenticated
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isLiveView, showValue, kalmanParams]);

  useEffect(() => {
    if (!isAuthenticated || isLiveView || !selectedDate) return; // Pause data fetching if not authenticated
    fetchData();
  }, [isAuthenticated, selectedDate, isLiveView]);

  const fetchData = async () => {
    if (!isAuthenticated) return; // Ensure no data fetching occurs if not authenticated
    try {
      const response = await fetch("https://database.tqduy.id.vn/", {
        headers: {
          "x-api-key": credentials.apiKey,
          "x-uid": credentials.UID,
        },
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const jsonData = await response.json();

      const ipKey = Object.keys(jsonData)[0];
      const dateKey = isLiveView ? Object.keys(jsonData[ipKey])[0] : selectedDate;
      if (!jsonData[ipKey][dateKey]) {
        throw new Error("No data available for the selected date");
      }
      const rawData = jsonData[ipKey][dateKey];

      const startingTimestamp = JSON.parse(rawData[0]).t;

      const parsedData = rawData.flatMap((chunk, chunkIndex) => {
        const { values } = JSON.parse(chunk);
        return values.map((value, index) => {
          const totalIndex = chunkIndex * values.length + index;
          const currentTimestamp = startingTimestamp + totalIndex * 2;
          const date = new Date(currentTimestamp + 20 * 60 * 60 * 1000);

          const hours = date.getUTCHours().toString().padStart(2, "0");
          const minutes = date.getUTCMinutes().toString().padStart(2, "0");
          const seconds = date.getUTCSeconds().toString().padStart(2, "0");
          const milliseconds = date.getUTCMilliseconds().toString().padStart(3, "0");

          return {
            time: `${hours}:${minutes}:${seconds}.${milliseconds}`,
            value: value || 0,
          };
        });
      });

      setData(parsedData);
      const startIndex = Math.max(parsedData.length - showValue, 0);
      setFilteredData(applyKalmanFilter(parsedData, kalmanParams.q, kalmanParams.r, kalmanParams.p, kalmanParams.k));
      setVisibleRange([startIndex, startIndex + showValue]);
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message); // Set the error message
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={`p-4 max-w-4xl mx-auto ${isDarkMode ? "dark" : "light"}`}>
      <AppHeader UID={credentials.UID} onLogout={handleLogout} />
      <Header
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isLiveView={isLiveView}
        setIsLiveView={setIsLiveView}
      />
      {!isLiveView && <DatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
      <StatusIndicator isLiveView={isLiveView} />
      {error ? ( // Conditionally render error message or chart
        <div className="text-red-500 text-center mt-4">
          <p>Error: {error}</p>
        </div>
      ) : (
        <Chart
          data={filteredData}
          visibleRange={visibleRange}
          showValue={showValue}
          handleScroll={(e) => {
            setVisibleRange(([start, end]) => {
              const step = Math.max(100, showValue / 10);
              const newStart = e.deltaY > 0 ? Math.min(start + step, data.length - showValue) : Math.max(start - step, 0);
              return [newStart, newStart + showValue];
            });
          }}
        />
      )}
      <RangeControls
        showValue={showValue}
        handleSlider1Change={(value) => {
          setShowValue(value);
          setVisibleRange(([start]) => {
            const newStart = Math.max(0, Math.min(start, data.length - value));
            return [newStart, newStart + value];
          });
        }}
        visibleRange={visibleRange}
        handleSlider2Change={(start) => setVisibleRange([start, start + showValue])}
        filteredData={filteredData}
        handleJumpToStart={() => setVisibleRange([0, showValue])}
        handlePrev={() => setVisibleRange(([start]) => [Math.max(start - showValue, 0), Math.max(start, showValue)])}
        handleNext={() => setVisibleRange(([start]) => [Math.min(start + showValue, data.length - showValue), Math.min(start + 2 * showValue, data.length)])}
        handleJumpToEnd={() => setVisibleRange([Math.max(data.length - showValue, 0), data.length])}
        isLiveView={isLiveView}
        handleExportData={() => {
          if (!selectedDate || !data.length) return;
          const csvContent = [["Time", "Value"], ...data.map((row) => [row.time, row.value])].map((e) => e.join(",")).join("\n");
          const blob = new Blob([csvContent], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `data_${selectedDate}.csv`;
          link.click();
          URL.revokeObjectURL(url);
        }}
      />
      <KalmanFilterControls
        kalmanParams={kalmanParams}
        setKalmanParams={setKalmanParams}
        handleApplyFilter={() => setFilteredData(applyKalmanFilter(data, kalmanParams.q, kalmanParams.r, kalmanParams.p, kalmanParams.k))}
      />
      <AppFooter />
    </div>
  );
}
