# CSV Chart Viewer

A React-based application for visualizing CSV data in a chart format. The app supports data filtering using a Kalman filter and allows zooming and scrolling through the data.

## Features

- Fetch data from a remote API.
- Visualize data using a responsive line chart.
- Apply a Kalman filter to smooth the data.
- Zoom and scroll through the chart.
- Adjustable parameters for the Kalman filter.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/csv-chart-viewer.git
   cd csv-chart-viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following environment variables:
   ```
   REACT_APP_API_KEY=your_api_key
   REACT_APP_UID=your_uid
   ```

## Usage

1. Start the development server:
   ```bash
   npm start
   ```

2. Open the app in your browser at `http://localhost:3000`.

3. Click the "Fetch Data" button to load data from the API.

4. Use the controls to:
   - Navigate through the data (`Prev` and `Next` buttons).
   - Adjust the zoom level.
   - Change the number of visible data points.
   - Modify Kalman filter parameters (`Q`, `R`, `P`, `K`) and apply the filter.

## Dependencies

- React
- Recharts

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
