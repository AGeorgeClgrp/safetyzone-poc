'use strict';

const USER_MAP = {
  jamie_vps: 'Jamie Chen',
  morgan_pso: 'Morgan Lee',
};

function authMiddleware(req, res, next) {
  const userId = req.headers['x-user-id'] || 'anonymous';
  const role = req.headers['x-user-role'] || 'Unknown';
  const name = USER_MAP[userId] || userId;

  req.user = { id: userId, role, name };
  next();
}

module.exports = authMiddleware;
