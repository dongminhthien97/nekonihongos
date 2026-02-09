# API Error Logging Summary

## What was added to debug the 404 errors:

### 1. Enhanced Axios Interceptors (`src/api/axios.ts`)

- **Request logging**: Logs every outgoing request with method, URL, params, and headers
- **Response error logging**: Enhanced 404 error detection with detailed context
- **Error categorization**: Distinguishes between API errors, network errors, and unknown errors
- **Grammar mini-test specific logging**: Special handling for grammar mini-test endpoints

### 2. Error Logger Utility (`src/utils/errorLogger.ts`)

- **Structured error logging**: Consistent format for all error types
- **Troubleshooting hints**: Provides specific guidance for 404 and 401 errors
- **Context tracking**: Allows adding component and action context to errors
- **Console grouping**: Organizes error logs for better readability

### 3. Debug Utilities (`src/utils/debug.ts`)

- **Conditional logging**: Only logs when debug mode is enabled
- **Global access**: Available as `window.debug` in browser console
- **Multiple log levels**: log, warn, error, info, group, trace

### 4. Enhanced Component Logging (`src/components/MiniTestModal.tsx`)

- **Request tracking**: Logs when questions are fetched with lesson ID
- **Success logging**: Confirms successful requests with data count
- **Error context**: Provides detailed error information with component context

### 5. Debug Panel Component (`src/components/ApiDebugPanel.tsx`)

- **Interactive testing**: Test API endpoints directly from browser
- **Quick test buttons**: Pre-configured tests for common endpoints
- **Response inspection**: View full response data, headers, and status
- **Parameter testing**: Test different parameters and methods

### 6. Browser Console Tools

- **debugApi.testGrammarMiniTest()**: Test grammar mini-test endpoint manually
- **debugApi.checkAuth()**: Check authentication status
- **debugApi.listEndpoints()**: View axios configuration

## How to use the logging:

### 1. Enable debug mode:

```javascript
// In browser console
debug.enable();
```

### 2. Test the endpoint manually:

```javascript
// In browser console
debugApi.testGrammarMiniTest(6);
```

### 3. Check authentication:

```javascript
// In browser console
debugApi.checkAuth();
```

### 4. Use the debug panel:

- The debug panel is available as a component that can be imported and used
- It provides a UI for testing endpoints and viewing responses

### 5. View enhanced logs:

- All API requests and responses are now logged with detailed context
- 404 errors include troubleshooting hints
- Grammar mini-test specific errors have additional context

## Expected output when 404 occurs:

```
🚨 API Error [404]
Error Details: {
  type: "API_ERROR",
  status: 404,
  statusText: "Not Found",
  message: "Request failed with status code 404",
  url: "/grammar/mini-test/questions",
  method: "GET",
  baseURL: "http://localhost:8080",
  fullURL: "http://localhost:8080/grammar/mini-test/questions",
  params: { lesson_id: 6 },
  response: { error: "Endpoint not found" },
  timestamp: "2026-02-07T06:54:00.000Z",
  userAgent: "Mozilla/5.0...",
  origin: "https://nekonihongos.vercel.app",
  component: "MiniTestModal",
  action: "fetchQuestions",
  endpoint: "/grammar/mini-test/questions"
}

💡 404 Troubleshooting:
- Check if the endpoint exists on the backend
- Verify the URL path is correct
- Ensure the backend is running and accessible
- Check for CORS issues
```

This comprehensive logging setup will help identify exactly why the 404 errors are occurring and provide the information needed to fix them.
