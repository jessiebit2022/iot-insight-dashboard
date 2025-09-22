# IoT Insight Dashboard

**Author:** Jessie Borras  
**Website:** jessiedev.xyz

## Description

A system that collects data from various IoT devices, processes it in real-time, and displays it on a dashboard. This project highlights data ingestion, stream processing, and interactive data visualization.

## Tech Stack

- **Frontend:** React/Next.js
- **Data Processing Backend:** Python
- **Real-time API:** Node.js with Socket.IO
- **Database:** InfluxDB (time-series database)

## Features

- Real-time IoT device data collection
- Stream processing and data transformation
- Interactive dashboard with live visualizations
- Time-series data storage and querying
- WebSocket-based real-time updates

## Project Structure

```
IoT Insight Dashboard/
├── frontend/          # React/Next.js dashboard
├── backend/           # Python data processing
├── api/              # Node.js real-time API
├── database/         # InfluxDB configuration
└── docker/           # Docker configurations
```

## Getting Started

1. Clone the repository
2. Install dependencies for each service
3. Configure InfluxDB connection
4. Start the services in development mode

## Architecture

The system consists of multiple microservices:
- IoT data ingestion service (Python)
- Real-time API server (Node.js + Socket.IO)
- Dashboard frontend (React/Next.js)
- Time-series database (InfluxDB)

## License

MIT License