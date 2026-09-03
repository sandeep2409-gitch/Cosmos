/**
 * Health Check API Controller
 */
export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    name: 'COSMOS API Engine',
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};
