module.exports = {
	apps: [{
	  name: "sourceapi",
	  script: "./server.js",
	  env: {
		"NODE_ENV": "development"
	  },
	  env_staging: {
		"NODE_ENV": "staging"
	  },
	  env_production: {
		"NODE_ENV": "production"
	  }
	}]
  }
