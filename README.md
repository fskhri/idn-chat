# IDN Live Chat WebSocket Client

A Node.js application that connects to IDN Live Chat using WebSocket and provides an API to access chat messages.

## Features

- WebSocket connection to IDN Live Chat
- Real-time chat message monitoring
- Message buffering (stores last 100 messages)
- REST API endpoints for accessing messages and connection status
- Automatic reconnection on disconnection

## Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository: https://github.com/fskhri/idn-chat
2. Run `npm install` to install the dependencies
3. Run `node index.js` to start the server
4. Access the API at `http://localhost:3000/messages` to get the chat messages
5. Access the API at `http://localhost:3000/status` to get the connection status and message count