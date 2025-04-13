import React from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css"; // Ensure the slider styles are imported

export default function RangeControls({
  showValue,
  handleSlider1Change,
  visibleRange,
  handleSlider2Change,
  filteredData,
  handleJumpToStart,
  handlePrev,
  handleNext,
  handleJumpToEnd,
  isLiveView,
  handleExportData,
}) {
  return (
    <div>
      {/* Slider for adjusting the visible range */}
      <div className="mt-4">
        <label className="block mb-2">Adjust Visible Range:</label>
        <Slider
          min={1}
          max={Math.min(20000, filteredData.length)} // Ensure max value doesn't exceed data length
          value={showValue}
          onChange={handleSlider1Change}
          trackStyle={[{ backgroundColor: "#8884d8" }]}
          handleStyle={[{ borderColor: "#8884d8" }]}
        />
        <div className="mt-2 flex justify-between text-sm">
          <span>Show Value: {showValue}</span>
        </div>
      </div>

      {/* Slider for adjusting the start time */}
      {!isLiveView && (
        <>
          <div className="mt-4">
            <label className="block mb-2">Adjust Start Time:</label>
            <Slider
              min={0}
              max={Math.max(0, filteredData.length - showValue)} // Ensure max value is valid
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

          {/* Navigation buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={handleJumpToStart} className="button-primary w-full sm:w-auto">Jump to Start</button>
            <button onClick={handlePrev} className="button-primary w-full sm:w-auto">Prev {showValue}</button>
            <button onClick={handleNext} className="button-primary w-full sm:w-auto">Next {showValue}</button>
            <button onClick={handleJumpToEnd} className="button-primary w-full sm:w-auto">Jump to End</button>
          </div>

          {/* Export data button */}
          <div className="mt-4">
            <button onClick={handleExportData} className="button-primary w-full sm:w-auto">
              Export Data as CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}
