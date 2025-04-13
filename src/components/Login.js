import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [uid, setUid] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Validate UID and API key
    if (uid === "EDS" && apiKey === "IzUKf0FyBbktDiRxgry6fpRg8NTpxmb8XU777DDhwqDVnuUbolhSYxSUsijwBkN2") {
      onLogin({ UID: uid, apiKey });
    } else {
      setError("Invalid UID or API key");
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
        <div>
          <label htmlFor="uid">UID</label>
          <input
            type="text"
            id="uid"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="apiKey">API Key</label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="button-primary">
          Login
        </button>
      </form>
    </div>
  );
}
