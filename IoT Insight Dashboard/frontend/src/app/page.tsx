'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface IoTData {
  deviceId: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  pressure: number;
}

export default function Dashboard() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [data, setData] = useState<IoTData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('iot-data', (newData: IoTData) => {
      setData(prev => [...prev.slice(-50), newData]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">IoT Insight Dashboard</h1>
          <div className="flex items-center mt-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Temperature</h3>
            <div className="text-3xl font-bold text-blue-600">
              {data.length > 0 ? `${data[data.length - 1].temperature}°C` : '--'}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Humidity</h3>
            <div className="text-3xl font-bold text-green-600">
              {data.length > 0 ? `${data[data.length - 1].humidity}%` : '--'}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Pressure</h3>
            <div className="text-3xl font-bold text-purple-600">
              {data.length > 0 ? `${data[data.length - 1].pressure} hPa` : '--'}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Real-time Data</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="temperature" stroke="#3B82F6" name="Temperature (°C)" />
              <Line type="monotone" dataKey="humidity" stroke="#10B981" name="Humidity (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}