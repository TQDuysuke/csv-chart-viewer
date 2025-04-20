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
  const [isLiveView, setIsLiveView] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState(""); // State to store error messages
  const [pointer1, setPointer1] = useState(0); // Pointer 1 state
  const [pointer2, setPointer2] = useState(200); // Pointer 2 state

  useEffect(() => {
    // Check for existing login credentials in cookies
    const savedUID = Cookies.get("UID");
    const savedApiKey = Cookies.get("apiKey");
    const savedTheme = Cookies.get("isDarkMode"); // Load theme state from cookies
    if (savedUID && savedApiKey) {
      setCredentials({ UID: savedUID, apiKey: savedApiKey });
      setIsAuthenticated(true);
    }
    if (savedTheme) {
      setIsDarkMode(savedTheme === "true"); // Convert string to boolean
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      Cookies.set("isDarkMode", newMode, { expires: 7 }); // Save theme state to cookies
      return newMode;
    });
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
    fetchData(); // Fetch data immediately on the first load
    const interval = setInterval(fetchData, 20000); // Then fetch every 10 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated, isLiveView, showValue, kalmanParams]);

  useEffect(() => {
    if (!isAuthenticated || isLiveView || !selectedDate) return; // Pause data fetching if not authenticated
    fetchData();
  }, [isAuthenticated, selectedDate, isLiveView]);

  const fetchData = async () => {
    if (!isAuthenticated) return; // Ensure no data fetching occurs if not authenticated
    try {
      const url = new URL("https://database.tqduy.id.vn");
      if (!isLiveView && selectedDate) {
        url.searchParams.append("date", selectedDate);
      } else if (isLiveView) {
        const currentDate = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
        url.searchParams.append("date", currentDate);
      }

      const requestHeaders = {
        "Content-Type": "application/json",
        "x-api-key": credentials.apiKey, // Add API key to header
        "x-uid": credentials.UID,       // Add UID to header
      };

      console.log("Request Command:", {
        url: url.toString(),
        headers: requestHeaders,
      }); // Log the request command

      const response = await fetch(url, {
        method: "GET",
        headers: requestHeaders,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const jsonData = await response.json();
      console.log("Response Data:", jsonData); // Log the full response for debugging

      if (jsonData.status === "success" && jsonData.data) {
        const rawData = jsonData.data.map((chunk) => ({
          t: chunk.t, // Extract the 't' value
          values: chunk.values.map((value, index) => ({
            time: index + 1, // Use sample index as the time
            value: value || 0,
          })),
        }));

        const firstTimestamp = new Date(rawData[0]?.t).getTime(); // Use the first 't' value of the entire dataset
        console.log("First timestamp of dataset:", firstTimestamp); // Log the first timestamp

        const parsedData = rawData.flatMap(({ values }, chunkIndex) =>
          values.map((value, index) => ({
            ...value,
            time: firstTimestamp + (chunkIndex * values.length + index) * 2, // Calculate time relative to the first timestamp
          }))
        );

        setData(parsedData);
        const startIndex = Math.max(parsedData.length - showValue, 0);
        setFilteredData(applyKalmanFilter(parsedData, kalmanParams.q, kalmanParams.r, kalmanParams.p, kalmanParams.k));
        setVisibleRange([startIndex, startIndex + showValue]);
        setError(""); // Clear any previous errors
      } else {
        throw new Error("Unexpected server response format");
      }
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
        handleSlider2Change={(start) => {
          setVisibleRange([start, start + showValue]);
          // Keep pointers unchanged when adjusting the visible range
        }}
        filteredData={filteredData}
        handleJumpToStart={() => setVisibleRange([0, showValue])}
        handlePrev={() => {
          setVisibleRange(([start]) => {
            const newStart = Math.max(start - showValue, 0);
            return [newStart, newStart + showValue];
          });
          // Keep pointers unchanged when navigating
        }}
        handleNext={() => {
          setVisibleRange(([start]) => {
            const newStart = Math.min(start + showValue, data.length - showValue);
            return [newStart, newStart + showValue];
          });
          // Keep pointers unchanged when navigating
        }}
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
