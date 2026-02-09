import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ApiResponse {
  status: number;
  statusText: string;
  data: any;
  headers: any;
}

export const ApiDebugPanel: React.FC = () => {
  const [url, setUrl] = useState("/grammar/mini-test/questions");
  const [method, setMethod] = useState("GET");
  const [params, setParams] = useState('{"lesson_id": 6}');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Import apiClient dynamically to avoid circular imports
      const { default: apiClient } = await import("../api/axios");

      const parsedParams = JSON.parse(params);

      let result;
      if (method === "GET") {
        result = await apiClient.get(url, { params: parsedParams });
      } else if (method === "POST") {
        result = await apiClient.post(url, parsedParams);
      } else if (method === "PUT") {
        result = await apiClient.put(url, parsedParams);
      } else if (method === "DELETE") {
        result = await apiClient.delete(url, { params: parsedParams });
      } else {
        throw new Error(`Unsupported HTTP method: ${method}`);
      }

      setResponse({
        status: result.status,
        statusText: result.statusText,
        data: result.data,
        headers: result.headers,
      });
    } catch (err: any) {
      if (err.response) {
        setResponse({
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers,
        });
      } else {
        setError(err.message || "Unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = (endpoint: string, lessonId: number = 6) => {
    setUrl(endpoint);
    setMethod("GET");
    setParams(JSON.stringify({ lesson_id: lessonId }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 API Debug Panel</CardTitle>
        <p className="text-sm text-gray-600">
          Test API endpoints and debug 404 errors
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Test Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => handleQuickTest("/grammar/mini-test/questions", 6)}
            size="sm"
          >
            Test Grammar Mini-Test (lesson 6)
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              handleQuickTest("/api/grammar/mini-test/questions", 6)
            }
            size="sm"
          >
            Test with /api prefix
          </Button>
          <Button
            variant="outline"
            onClick={() => handleQuickTest("/grammar/mini-test/questions", 4)}
            size="sm"
          >
            Test Grammar Mini-Test (lesson 4)
          </Button>
        </div>

        {/* Request Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter endpoint URL"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Parameters (JSON)
          </label>
          <Textarea
            value={params}
            onChange={(e) => setParams(e.target.value)}
            placeholder='{"lesson_id": 6}'
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleTestRequest} disabled={loading}>
            {loading ? "Testing..." : "Test Request"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Clear all fields
              setUrl("/grammar/mini-test/questions");
              setMethod("GET");
              setParams('{"lesson_id": 6}');
              setResponse(null);
              setError(null);
            }}
          >
            Clear
          </Button>
        </div>

        {/* Response */}
        {response && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Response:</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <div
                  className={`font-mono ${response.status >= 400 ? "text-red-600" : "text-green-600"}`}
                >
                  {response.status} {response.statusText}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Method:</span>
                <div className="font-mono">{method}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">URL:</span>
                <div className="font-mono text-xs">{url}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Time:</span>
                <div className="font-mono text-xs">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="mt-2">
              <span className="text-sm text-gray-600">Response Data:</span>
              <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-700 mb-2">Error:</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiDebugPanel;
