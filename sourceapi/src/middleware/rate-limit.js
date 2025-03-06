"use strict";

/* Package System */
const { rateLimit } = require('express-rate-limit');

module.exports = rateLimit({
	windowMs: 15 * 1000, // 15s
	max: 1,
	handler: (req, res)=> {
        res.status(429).json({
			status:'error',
			errors:{
				msg:"Quá nhiều yêu cầu. Vui lòng thử lại sau 30s"
			}
		})
    },
	keyGenerator: (req, res) => req.user.id
})
