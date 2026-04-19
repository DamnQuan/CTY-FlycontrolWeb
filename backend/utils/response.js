// 统一响应格式

const success = (res, data = null, message = '操作成功') => {
  return res.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const error = (res, message = '操作失败', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

const paginated = (res, data, pagination, message = '获取成功') => {
  return res.json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.pageSize)
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  success,
  error,
  paginated
};
