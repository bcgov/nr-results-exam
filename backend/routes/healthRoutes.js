const express = require('express');
const dependencyHealth = require('../services/dependencyHealth');

const router = express.Router({});

router.get('/', async (req, res) => {
  try {
    const forceRefresh = req.query.deep === 'true';
    const health = await dependencyHealth.getHealthStatus({ forceRefresh });

    const payload = {
      status: health.status,
      uptime: process.uptime(),
      timestamp: Date.now(),
      lastCheckedAt: health.checkedAt,
      refreshInProgress: health.refreshInProgress,
      dependencies: health.dependencies
    };

    const httpStatus =
      health.status === 'error' || health.status === 'degraded' ? 503 : 200;
    res
      .status(httpStatus)
      .type('application/json')
      .send(`${JSON.stringify(payload, null, 2)}\n`);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Unable to compute health status'
    });
  }
});

module.exports = router;
