import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import stockRoutes from './routes/stockRoutes.js';
import { setupRedis } from './services/redisService.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/stocks', stockRoutes);

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('subscribe', (symbol) => {
    socket.join(`stock:${symbol}`);
    console.log(`Client ${socket.id} subscribed to ${symbol}`);
  });

  socket.on('unsubscribe', (symbol) => {
    socket.leave(`stock:${symbol}`);
    console.log(`Client ${socket.id} unsubscribed from ${symbol}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize services
setupRedis().catch(err => {
  console.error('Failed to initialize Redis:', err);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Stock API Server running on port ${PORT}`);
});

// Make io globally accessible for emitting updates
globalThis.io = io;

export default app;
