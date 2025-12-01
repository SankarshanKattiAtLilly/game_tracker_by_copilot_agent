// Disable CSV sync by default; enable only if explicitly set to true
if (!process.env.ENABLE_CSV_SYNC) {
  process.env.ENABLE_CSV_SYNC = 'false';
}
const { app, initializeBackgroundProcesses } = require('./app');

const PORT = process.env.PORT || 3001;

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📄 CSV Sync Enabled: ${process.env.ENABLE_CSV_SYNC === 'true'}`);
  
  // Initialize background processes
  initializeBackgroundProcesses();
  console.log('✅ Background processes initialized');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
