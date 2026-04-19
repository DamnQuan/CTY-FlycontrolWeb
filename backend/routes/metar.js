const express = require('express');
const router = express.Router();
const axios = require('axios');

// 热门机场列表
const POPULAR_AIRPORTS = [
  { icao: 'ZBAA', name: '北京首都', city: '北京' },
  { icao: 'ZSPD', name: '上海浦东', city: '上海' },
  { icao: 'ZGGG', name: '广州白云', city: '广州' },
  { icao: 'ZUUU', name: '成都双流', city: '成都' },
  { icao: 'ZPPP', name: '昆明长水', city: '昆明' },
  { icao: 'ZUCK', name: '重庆江北', city: '重庆' },
  { icao: 'ZSSS', name: '上海虹桥', city: '上海' },
  { icao: 'ZGHA', name: '长沙黄花', city: '长沙' },
  { icao: 'ZSHC', name: '杭州萧山', city: '杭州' },
  { icao: 'ZSAM', name: '厦门高崎', city: '厦门' },
  { icao: 'ZSNJ', name: '南京禄口', city: '南京' },
  { icao: 'ZSQD', name: '青岛胶东', city: '青岛' }
];

// 获取METAR数据
router.get('/:icao', async (req, res) => {
  try {
    const { icao } = req.params;

    if (!icao || icao.length !== 4) {
      return res.status(400).json({ message: '请输入有效的4位ICAO机场代码' });
    }

    const icaoUpper = icao.toUpperCase();

    // 从ISFP API获取METAR
    try {
      const response = await axios.get(`https://isfpapi.flyisfp.com/api/metar?icao=${icaoUpper}`, {
        timeout: 10000
      });

      // ISFP API 返回格式: { code, message, data: ["METAR ..."] }
      if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return res.json({
          success: true,
          data: {
            icao: icaoUpper,
            metar: response.data.data[0], // 取数组第一个元素，即METAR报文
            source: 'ISFP云际模拟飞行',
            fetchedAt: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('ISFP API获取METAR失败:', error.message);
    }

    // 如果ISFP API失败，返回错误
    res.status(404).json({
      message: '无法获取该机场的METAR数据，请检查机场代码是否正确或稍后重试'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 批量获取METAR数据
router.post('/batch', async (req, res) => {
  try {
    const { icaos } = req.body;

    if (!icaos || !Array.isArray(icaos) || icaos.length === 0) {
      return res.status(400).json({ message: '请提供有效的机场代码数组' });
    }

    if (icaos.length > 20) {
      return res.status(400).json({ message: '一次最多查询20个机场' });
    }

    const results = [];
    const errors = [];

    // 并行获取所有METAR数据
    await Promise.all(
      icaos.map(async (icao) => {
        const icaoUpper = icao.toUpperCase();
        try {
          const response = await axios.get(
            `https://isfpapi.flyisfp.com/api/metar?icao=${icaoUpper}`,
            { timeout: 10000 }
          );

          // ISFP API 返回格式: { code, message, data: ["METAR ..."] }
          if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
            results.push({
              icao: icaoUpper,
              metar: response.data.data[0],
              source: 'ISFP云际模拟飞行',
              fetchedAt: new Date().toISOString()
            });
          } else {
            errors.push({
              icao: icaoUpper,
              error: '获取失败'
            });
          }
        } catch (error) {
          errors.push({
            icao: icaoUpper,
            error: '获取失败'
          });
        }
      })
    );

    res.json({
      success: true,
      data: {
        results,
        errors,
        total: icaos.length,
        successCount: results.length,
        errorCount: errors.length
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 获取热门机场列表
router.get('/airports/popular', async (req, res) => {
  try {
    // 获取热门机场的METAR数据
    const airportsWithMetar = await Promise.all(
      POPULAR_AIRPORTS.map(async (airport) => {
        try {
          const response = await axios.get(
            `https://isfpapi.flyisfp.com/api/metar?icao=${airport.icao}`,
            { timeout: 5000 }
          );

          // ISFP API 返回格式: { code, message, data: ["METAR ..."] }
          const metar = (response.data && response.data.data && Array.isArray(response.data.data)) 
            ? response.data.data[0] 
            : null;

          return {
            ...airport,
            metar: metar,
            fetchedAt: new Date().toISOString()
          };
        } catch (error) {
          return {
            ...airport,
            metar: null,
            error: '获取失败'
          };
        }
      })
    );

    res.json({
      success: true,
      data: airportsWithMetar
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
