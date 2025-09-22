import asyncio
import json
import random
from datetime import datetime
from typing import Dict, Any
from fastapi import FastAPI
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import uvicorn

app = FastAPI(title="IoT Data Processing Backend")

# InfluxDB configuration
INFLUXDB_URL = "http://localhost:8086"
INFLUXDB_TOKEN = "your-token-here"
INFLUXDB_ORG = "your-org"
INFLUXDB_BUCKET = "iot-data"

class IoTDataProcessor:
    def __init__(self):
        self.client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
        self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
        
    def process_sensor_data(self, device_id: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process and validate sensor data"""
        processed_data = {
            "device_id": device_id,
            "timestamp": datetime.utcnow().isoformat(),
            "temperature": self._validate_temperature(raw_data.get("temperature", 0)),
            "humidity": self._validate_humidity(raw_data.get("humidity", 0)),
            "pressure": self._validate_pressure(raw_data.get("pressure", 0))
        }
        return processed_data
    
    def _validate_temperature(self, temp: float) -> float:
        """Validate temperature reading (-50 to 100°C)"""
        return max(-50, min(100, temp))
    
    def _validate_humidity(self, humidity: float) -> float:
        """Validate humidity reading (0 to 100%)"""
        return max(0, min(100, humidity))
    
    def _validate_pressure(self, pressure: float) -> float:
        """Validate pressure reading (800 to 1200 hPa)"""
        return max(800, min(1200, pressure))
    
    def store_data(self, data: Dict[str, Any]):
        """Store processed data in InfluxDB"""
        point = Point("sensor_data") \
            .tag("device_id", data["device_id"]) \
            .field("temperature", data["temperature"]) \
            .field("humidity", data["humidity"]) \
            .field("pressure", data["pressure"]) \
            .time(data["timestamp"])
        
        self.write_api.write(bucket=INFLUXDB_BUCKET, record=point)

# Initialize processor
processor = IoTDataProcessor()

async def simulate_iot_devices():
    """Simulate IoT device data generation"""
    devices = ["device_001", "device_002", "device_003"]
    
    while True:
        for device_id in devices:
            # Simulate sensor readings
            raw_data = {
                "temperature": random.uniform(18, 35),
                "humidity": random.uniform(30, 80),
                "pressure": random.uniform(980, 1020)
            }
            
            # Process and store data
            processed_data = processor.process_sensor_data(device_id, raw_data)
            processor.store_data(processed_data)
            
            print(f"Processed data from {device_id}: {processed_data}")
        
        await asyncio.sleep(5)  # Generate data every 5 seconds

@app.on_event("startup")
async def startup_event():
    """Start IoT simulation on app startup"""
    asyncio.create_task(simulate_iot_devices())

@app.get("/")
async def root():
    return {"message": "IoT Data Processing Backend is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)