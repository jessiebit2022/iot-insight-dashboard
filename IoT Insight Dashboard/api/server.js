const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { InfluxDB } = require('@influxdata/influxdb-client');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// InfluxDB configuration
const url = 'http://localhost:8086';
const token = 'your-token-here';
const org = 'your-org';
const bucket = 'iot-data';

const influxDB = new InfluxDB({ url, token });
const queryApi = influxDB.getQueryApi(org);

// Store connected clients
const connectedClients = new Set();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  connectedClients.add(socket);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedClients.delete(socket);
  });
});

// Function to query latest data from InfluxDB
async function getLatestData() {
  const query = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "sensor_data")
      |> last()
  `;
  
  try {
    const data = [];
    await queryApi.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        data.push(o);
      },
      error(error) {
        console.error('Query error:', error);
      },
      complete() {
        // Process and emit data to connected clients
        if (data.length > 0) {
          const processedData = processInfluxData(data);
          io.emit('iot-data', processedData);
        }
      }
    });
  } catch (error) {
    console.error('Error querying InfluxDB:', error);
  }
}

// Process InfluxDB data into dashboard format
function processInfluxData(rawData) {
  const deviceData = {};
  
  rawData.forEach(row => {
    const deviceId = row.device_id;
    if (!deviceData[deviceId]) {
      deviceData[deviceId] = {
        deviceId,
        timestamp: new Date(row._time).toLocaleTimeString()
      };
    }
    
    if (row._field === 'temperature') {
      deviceData[deviceId].temperature = parseFloat(row._value).toFixed(1);
    } else if (row._field === 'humidity') {
      deviceData[deviceId].humidity = parseFloat(row._value).toFixed(1);
    } else if (row._field === 'pressure') {
      deviceData[deviceId].pressure = parseFloat(row._value).toFixed(1);
    }
  });
  
  return Object.values(deviceData)[0] || null;
}

// Simulate real-time data (for demo purposes)
function simulateRealTimeData() {
  const deviceIds = ['device_001', 'device_002', 'device_003'];
  
  setInterval(() => {
    const randomDevice = deviceIds[Math.floor(Math.random() * deviceIds.length)];
    const simulatedData = {
      deviceId: randomDevice,
      timestamp: new Date().toLocaleTimeString(),
      temperature: (Math.random() * 17 + 18).toFixed(1), // 18-35°C
      humidity: (Math.random() * 50 + 30).toFixed(1),    // 30-80%
      pressure: (Math.random() * 40 + 980).toFixed(1)    // 980-1020 hPa
    };
    
    io.emit('iot-data', simulatedData);
  }, 2000); // Emit every 2 seconds
}

// API Routes
app.get('/', (req, res) => {
  res.json({ message: 'IoT Dashboard API Server is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    connectedClients: connectedClients.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/devices', (req, res) => {
  res.json({
    devices: ['device_001', 'device_002', 'device_003'],
    count: 3
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start real-time data simulation
  simulateRealTimeData();
  
  // Optionally query real InfluxDB data every 10 seconds
  // setInterval(getLatestData, 10000);
});