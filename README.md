# 1-Lead ECG by EDS

![1-Lead ECG by EDS](public/eds-dark-logo.svg)

A React-based application for visualizing 1-lead ECG data. This app enables users to filter, zoom, and scroll through ECG data while providing a responsive and user-friendly interface.

## Features

- **Data Fetching**: Retrieve ECG data from a remote API.
- **Interactive Visualization**: Display data using a responsive line chart.
- **Data Smoothing**: Apply a Kalman filter with adjustable parameters (`Q`, `R`, `P`, `K`).
- **Navigation**: Zoom and scroll through the chart for detailed analysis.
- **Dark Mode**: Toggle between light and dark themes.
- **User Authentication**: Log in using `UID` and `API Key`.
- **Logout Functionality**: Securely log out of the application.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-repo/1-lead-ecg.git
   cd 1-lead-ecg
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory and add the following:
   ```
   REACT_APP_API_KEY=your_api_key
   REACT_APP_UID=your_uid
   ```

## Usage

1. **Start the Development Server**:
   ```bash
   npm start
   ```

2. **Access the Application**:
   Open your browser and navigate to `http://localhost:3000`.

3. **Log In**:
   Enter your `UID` and `API Key` to access the app.

4. **Explore the Features**:
   - Navigate through the data using the `Prev` and `Next` buttons.
   - Adjust the zoom level and the number of visible data points.
   - Modify Kalman filter parameters and apply the filter.
   - Toggle between light and dark modes for better visibility.

5. **Log Out**:
   Use the logout button next to the `UID` to securely exit the application.

## Dependencies

- **React**: Frontend framework.
- **Recharts**: Charting library for data visualization.
- **js-cookie**: Manage cookies for user authentication.
- **rc-slider**: Slider component for parameter adjustments.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
